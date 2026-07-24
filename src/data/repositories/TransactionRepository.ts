import { Transaction, TransactionStatus, PredictedCategory } from '../../domain/models';
import { apiClient } from '../../api/apiClient';

export interface ITransactionRepository {
  createTransaction(transaction: Transaction): Promise<void>;
  updateTransactionStatus(id: string, status: TransactionStatus, speedBumpReason?: string): Promise<void>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  getTodaySpendBySenderAndCategory(senderUpi: string, category: PredictedCategory): Promise<number>;
  getTodayTotalSpend(senderUpi: string): Promise<number>;
  getRecentVelocity(senderUpi: string, hoursWindow?: number): Promise<{ count: number; totalAmount: number }>;
  getPayeeFrequency(senderUpi: string, receiverUpi: string): Promise<number>;
}

export class TransactionRepository implements ITransactionRepository {
  async createTransaction(transaction: Transaction): Promise<void> {
    await apiClient.createTransaction(transaction);
  }

  async updateTransactionStatus(id: string, status: TransactionStatus, speedBumpReason?: string): Promise<void> {
    await apiClient.updateTransactionStatus(id, status, speedBumpReason);
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const txs = await apiClient.getTransactions();
    return txs.find(t => t.id === id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await apiClient.getTransactions();
  }

  async getTodaySpendBySenderAndCategory(senderUpi: string, category: PredictedCategory): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const txs = await apiClient.getTransactions();
    const completed = txs.filter(t => {
      if (t.sender_upi !== senderUpi || t.status !== 'COMPLETED' || t.timestamp < todayIso) return false;
      let txCategory: PredictedCategory = 'essential';
      if (t.note === 'impulsive') {
        txCategory = 'impulsive';
      } else if (t.note === 'other' || t.receiver_upi === 'sunitadevi@upi' || t.receiver_upi === 'rameshkumar@upi') {
        txCategory = 'transfers';
      }
      return txCategory === category;
    });
    return completed.reduce((sum, tx) => sum + tx.amount, 0);
  }

  async getTodayTotalSpend(senderUpi: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const txs = await apiClient.getTransactions();
    const completed = txs.filter(t => t.sender_upi === senderUpi && (t.status === 'COMPLETED' || t.status === 'APPROVED') && t.timestamp >= todayIso);
    return completed.reduce((sum, tx) => sum + tx.amount, 0);
  }

  async getRecentVelocity(senderUpi: string, hoursWindow: number = 2): Promise<{ count: number; totalAmount: number }> {
    const cutoffTime = new Date(Date.now() - hoursWindow * 60 * 60 * 1000).toISOString();
    const txs = await apiClient.getTransactions();
    const recent = txs.filter(t => t.sender_upi === senderUpi && t.timestamp >= cutoffTime && (t.status === 'COMPLETED' || t.status === 'APPROVED'));
    const totalAmount = recent.reduce((sum, tx) => sum + tx.amount, 0);
    return { count: recent.length, totalAmount };
  }

  async getPayeeFrequency(senderUpi: string, receiverUpi: string): Promise<number> {
    const txs = await apiClient.getTransactions();
    return txs.filter(t => t.sender_upi === senderUpi && t.receiver_upi === receiverUpi && t.status === 'COMPLETED').length;
  }
}


