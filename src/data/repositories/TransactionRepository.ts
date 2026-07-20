import { db } from '../database';
import { Transaction, TransactionStatus, EntityCategory } from '../../domain/models';

export interface ITransactionRepository {
  createTransaction(transaction: Transaction): Promise<void>;
  updateTransactionStatus(id: string, status: TransactionStatus, speedBumpReason?: string): Promise<void>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  getTodaySpendBySenderAndCategory(senderUpi: string, category: EntityCategory): Promise<number>;
}

export class TransactionRepository implements ITransactionRepository {
  async createTransaction(transaction: Transaction): Promise<void> {
    await db.transactions.add(transaction);
  }

  async updateTransactionStatus(id: string, status: TransactionStatus, speedBumpReason?: string): Promise<void> {
    const updateData: Partial<Transaction> = { status };
    if (speedBumpReason !== undefined) {
      updateData.speed_bump_reason = speedBumpReason;
    }
    await db.transactions.update(id, updateData);
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.transactions.orderBy('timestamp').reverse().toArray();
  }

  async getTodaySpendBySenderAndCategory(senderUpi: string, category: EntityCategory): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const completedTxs = await db.transactions
      .where('sender_upi')
      .equals(senderUpi)
      .and(tx => tx.category === category && tx.status === 'COMPLETED' && tx.timestamp >= todayIso)
      .toArray();

    return completedTxs.reduce((sum, tx) => sum + tx.amount, 0);
  }
}
