import { Transaction, TransactionStatus, SpeedBumpEvaluationResult } from '../domain/models';
import { IEntityRepository, EntityRepository } from '../data/repositories/EntityRepository';
import { ITransactionRepository, TransactionRepository } from '../data/repositories/TransactionRepository';
import { ISpeedBumpEvaluator, SpeedBumpEvaluator } from '../engine/SpeedBumpEvaluator';

export interface PaymentInitiationResult {
  status: TransactionStatus;
  transaction: Transaction;
  evaluationResult?: SpeedBumpEvaluationResult;
  errorMessage?: string;
}

export class PaymentController {
  private entityRepo: IEntityRepository;
  private transactionRepo: ITransactionRepository;
  private speedBumpEvaluator: ISpeedBumpEvaluator;

  constructor(
    entityRepo: IEntityRepository = new EntityRepository(),
    transactionRepo: ITransactionRepository = new TransactionRepository(),
    speedBumpEvaluator: ISpeedBumpEvaluator = new SpeedBumpEvaluator(transactionRepo)
  ) {
    this.entityRepo = entityRepo;
    this.transactionRepo = transactionRepo;
    this.speedBumpEvaluator = speedBumpEvaluator;
  }

  /**
   * Initiates payment flow and evaluates Speed-Bump rules.
   */
  async initiatePayment(
    senderUpi: string,
    receiverUpi: string,
    amount: number,
    note?: string
  ): Promise<PaymentInitiationResult> {
    try {
      const sender = await this.entityRepo.getEntityByUpi(senderUpi);
      const receiver = await this.entityRepo.getEntityByUpi(receiverUpi);

      if (!sender) {
        throw new Error(`Sender account with UPI ID '${senderUpi}' does not exist.`);
      }
      if (!receiver) {
        throw new Error(`Receiver account with UPI ID '${receiverUpi}' does not exist.`);
      }
      if (amount <= 0) {
        throw new Error(`Invalid transaction amount ₹${amount}. Amount must be greater than zero.`);
      }
      if (sender.balance < amount) {
        throw new Error(`Insufficient funds: Sender balance is ₹${sender.balance.toLocaleString()}, requested ₹${amount.toLocaleString()}.`);
      }

      const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const transaction: Transaction = {
        id: txId,
        sender_upi: senderUpi,
        receiver_upi: receiverUpi,
        amount,
        note,
        category: receiver.category,
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };

      // Store initial PENDING transaction
      await this.transactionRepo.createTransaction(transaction);

      // Evaluate Speed-Bump Rules
      const evalResult = await this.speedBumpEvaluator.evaluateTransaction(
        senderUpi,
        receiver.category,
        amount
      );

      if (evalResult.requiresSpeedBump) {
        const reasonStr = evalResult.reasons.join(' | ');
        await this.transactionRepo.updateTransactionStatus(txId, 'SPEED_BUMP_REQUIRED', reasonStr);
        transaction.status = 'SPEED_BUMP_REQUIRED';
        transaction.speed_bump_reason = reasonStr;

        return {
          status: 'SPEED_BUMP_REQUIRED',
          transaction,
          evaluationResult: evalResult
        };
      }

      // No Speed Bump required -> Execute Direct Transfer
      await this.executeTransfer(transaction);
      transaction.status = 'COMPLETED';

      return {
        status: 'COMPLETED',
        transaction
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
          category: 'essential',
          status: 'FAILED',
          timestamp: new Date().toISOString()
        },
        errorMessage: err.message || 'Payment initiation failed.'
      };
    }
  }

  /**
   * Resolves an active Speed-Bump prompt when the user decides to CONFIRM (overriding or completing after delay) or CANCEL.
   */
  async resolveSpeedBump(
    transactionId: string,
    userChoice: 'CONFIRM' | 'CANCEL'
  ): Promise<PaymentInitiationResult> {
    const tx = await this.transactionRepo.getTransactionById(transactionId);
    if (!tx) {
      throw new Error(`Transaction '${transactionId}' not found.`);
    }

    if (tx.status !== 'SPEED_BUMP_REQUIRED' && tx.status !== 'PENDING') {
      throw new Error(`Transaction '${transactionId}' is in '${tx.status}' state and cannot be resolved.`);
    }

    if (userChoice === 'CANCEL') {
      await this.transactionRepo.updateTransactionStatus(transactionId, 'BLOCKED', 'Cancelled by user during Speed-Bump reflection');
      tx.status = 'BLOCKED';
      tx.speed_bump_reason = 'Cancelled by user during Speed-Bump reflection';
      return { status: 'BLOCKED', transaction: tx };
    }

    // User confirmed -> Update to APPROVED and execute ledger transfer
    await this.transactionRepo.updateTransactionStatus(transactionId, 'APPROVED');
    tx.status = 'APPROVED';

    await this.executeTransfer(tx);
    tx.status = 'COMPLETED';

    return { status: 'COMPLETED', transaction: tx };
  }

  private async executeTransfer(tx: Transaction): Promise<void> {
    try {
      await this.entityRepo.transferBalances(tx.sender_upi, tx.receiver_upi, tx.amount);
      await this.transactionRepo.updateTransactionStatus(tx.id, 'COMPLETED');
    } catch (err: any) {
      await this.transactionRepo.updateTransactionStatus(tx.id, 'FAILED', err.message);
      throw err;
    }
  }
}
