import { Transaction, TransactionStatus, SpeedBumpEvaluationResult, WeatherCondition, LocalEventVector } from '../domain/models';
import { IEntityRepository, EntityRepository } from '../data/repositories/EntityRepository';
import { ITransactionRepository, TransactionRepository } from '../data/repositories/TransactionRepository';
import { ISpeedBumpEvaluator, SpeedBumpEvaluator } from '../engine/SpeedBumpEvaluator';
import { apiClient } from '../api/apiClient';

export interface PaymentInitiationResult {
  status: TransactionStatus;
  transaction: Transaction;
  evaluationResult?: SpeedBumpEvaluationResult;
  errorMessage?: string;
  vaultSwept?: boolean;
}

export class PaymentController {
  private entityRepo: IEntityRepository;
  private transactionRepo: ITransactionRepository;
  private speedBumpEvaluator: ISpeedBumpEvaluator;

  constructor(
    entityRepo: IEntityRepository = new EntityRepository(),
    transactionRepo: ITransactionRepository = new TransactionRepository(),
    speedBumpEvaluator: ISpeedBumpEvaluator = new SpeedBumpEvaluator(entityRepo, transactionRepo)
  ) {
    this.entityRepo = entityRepo;
    this.transactionRepo = transactionRepo;
    this.speedBumpEvaluator = speedBumpEvaluator;
  }

  /**
   * Evaluates the speed bump rules for a transaction without executing it.
   */
  async evaluatePayment(
    senderUpi: string,
    receiverUpi: string,
    amount: number,
    note?: 'essential' | 'impulsive' | 'other' | 'emi',
    weather: WeatherCondition = 'CLEAR',
    event: LocalEventVector = 'NORMAL'
  ): Promise<SpeedBumpEvaluationResult> {
    return this.speedBumpEvaluator.evaluateTransaction(senderUpi, receiverUpi, amount, note, weather, event);
  }

  /**
   * Initiates payment flow and evaluates Speed-Bump rules via dynamic prediction engine.
   */
  async initiatePayment(
    senderUpi: string,
    receiverUpi: string,
    amount: number,
    note?: 'essential' | 'impulsive' | 'other' | 'emi',
    weather: WeatherCondition = 'CLEAR',
    event: LocalEventVector = 'NORMAL',
    bypassSpeedBump: boolean = false,
    roundUpOptIn: boolean = true
  ): Promise<PaymentInitiationResult> {
    try {
      const sender = await this.entityRepo.getEntityByUpi(senderUpi);
      const receiver = await this.entityRepo.getEntityByUpi(receiverUpi);

      if (!sender) throw new Error(`Sender account '${senderUpi}' does not exist.`);
      if (!receiver) throw new Error(`Receiver account '${receiverUpi}' does not exist.`);
      if (amount <= 0) throw new Error(`Amount must be greater than zero.`);

      // Evaluate Speed-Bump Rules and dynamic transaction prediction
      const evalResult = await this.speedBumpEvaluator.evaluateTransaction(
        senderUpi,
        receiverUpi,
        amount,
        note,
        weather,
        event
      );

      const originalRequiresSpeedBump = evalResult.requiresSpeedBump;
      if (bypassSpeedBump) {
        evalResult.requiresSpeedBump = false;
      }

      const roundUpAmount = roundUpOptIn ? evalResult.roundUpAmount : 0;
      const totalDeduction = amount + roundUpAmount;
      if (sender.balance < totalDeduction) {
        throw new Error(`Insufficient funds: Balance ₹${sender.balance.toLocaleString()}, required ₹${totalDeduction.toLocaleString()} (₹${amount} + ₹${roundUpAmount} round-up).`);
      }

      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const transaction: Transaction & { roundUpOptOut?: boolean } = {
        id: txId,
        sender_upi: senderUpi,
        receiver_upi: receiverUpi,
        amount,
        note,
        risk_score: evalResult.riskScore,
        status: evalResult.requiresSpeedBump ? 'SPEED_BUMP_REQUIRED' : 'PENDING',
        speed_bump_reason: originalRequiresSpeedBump ? evalResult.reasons.join(' | ') : undefined,
        timestamp: new Date().toISOString(),
        roundUpOptOut: !roundUpOptIn
      };

      // Store transaction in audit ledger
      await this.transactionRepo.createTransaction(transaction);

      if (evalResult.requiresSpeedBump) {
        return {
          status: 'SPEED_BUMP_REQUIRED',
          transaction,
          evaluationResult: evalResult
        };
      }

      // No Speed Bump required -> Execute Direct Transfer
      const transferRes = await this.executeTransfer(transaction);
      transaction.status = 'COMPLETED';

      return {
        status: 'COMPLETED',
        transaction,
        vaultSwept: transferRes.swept
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        transaction: {
          id: 'tx_failed',
          sender_upi: senderUpi,
          receiver_upi: receiverUpi,
          amount,
          note,
          risk_score: 0,
          status: 'FAILED',
          timestamp: new Date().toISOString()
        },
        errorMessage: err.message || 'Payment initiation failed.'
      };
    }
  }

  /**
   * Resolves an active Speed-Bump prompt when user decides to CONFIRM or CANCEL.
   */
  async resolveSpeedBump(
    transactionId: string,
    userChoice: 'CONFIRM' | 'CANCEL'
  ): Promise<PaymentInitiationResult> {
    const tx = await this.transactionRepo.getTransactionById(transactionId);
    if (!tx) throw new Error(`Transaction '${transactionId}' not found.`);

    if (tx.status !== 'SPEED_BUMP_REQUIRED' && tx.status !== 'PENDING') {
      throw new Error(`Transaction '${transactionId}' is in '${tx.status}' state and cannot be resolved.`);
    }

    if (userChoice === 'CANCEL') {
      await this.transactionRepo.updateTransactionStatus(transactionId, 'BLOCKED', 'Cancelled by user during Speed-Bump reflection');
      tx.status = 'BLOCKED';
      tx.speed_bump_reason = 'Cancelled by user during Speed-Bump reflection';
      return { status: 'BLOCKED', transaction: tx };
    }

    // User confirmed -> Update to APPROVED and execute transfer
    await this.transactionRepo.updateTransactionStatus(transactionId, 'APPROVED');
    tx.status = 'APPROVED';

    const transferRes = await this.executeTransfer(tx);
    tx.status = 'COMPLETED';

    return { status: 'COMPLETED', transaction: tx, vaultSwept: transferRes.swept };
  }

  private async executeTransfer(tx: Transaction): Promise<{ swept?: boolean }> {
    try {
      const nextMultipleOf10 = Math.ceil(tx.amount / 10) * 10;
      const roundUpAmount = nextMultipleOf10 > tx.amount ? nextMultipleOf10 - tx.amount : 0;
      const res = await apiClient.executeTransfer(tx.sender_upi, tx.receiver_upi, tx.amount, roundUpAmount);
      await this.transactionRepo.updateTransactionStatus(tx.id, 'COMPLETED');
      return { swept: res.swept };
    } catch (err: any) {
      await this.transactionRepo.updateTransactionStatus(tx.id, 'FAILED', err.message);
      throw err;
    }
  }
}


