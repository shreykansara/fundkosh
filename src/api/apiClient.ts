import { Entity, Liability, Transaction, VaultState, TransactionStatus } from '../domain/models';

const API_BASE = 'http://localhost:5000/api';

export const apiClient = {
  async checkHealth(): Promise<{ status: string; mongoConnected: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'offline', mongoConnected: false };
    }
  },

  async getEntities(): Promise<Entity[]> {
    try {
      const res = await fetch(`${API_BASE}/entities`);
      return await res.json();
    } catch (err) {
      console.warn('Backend API unavailable, returning empty entities array.');
      return [];
    }
  },

  async getLiabilities(): Promise<Liability[]> {
    try {
      const res = await fetch(`${API_BASE}/liabilities`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async getVault(userUpi?: string): Promise<VaultState & { flexi_rd_balance: number; interest_rate: number; total_sweeps_count: number }> {
    try {
      const res = await fetch(`${API_BASE}/vault?upi=${userUpi || ''}`);
      return await res.json();
    } catch {
      return { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 };
    }
  },

  async seedDatabase(): Promise<void> {
    await fetch(`${API_BASE}/seed`, { method: 'POST' });
  },

  async createTransaction(tx: Transaction): Promise<void> {
    await fetch(`${API_BASE}/payment/create-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
  },

  async updateTransactionStatus(id: string, status: TransactionStatus, speedBumpReason?: string): Promise<void> {
    await fetch(`${API_BASE}/payment/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, speedBumpReason })
    });
  },

  async executeTransfer(
    senderUpi: string, 
    receiverUpi: string, 
    amount: number, 
    roundUpAmount: number = 0
  ): Promise<{ senderNewBalance: number; receiverNewBalance: number; vault?: any; swept?: boolean }> {
    const res = await fetch(`${API_BASE}/payment/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderUpi, receiverUpi, amount, roundUpAmount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transfer failed');
    }
    return await res.json();
  },

  async updateVaultThreshold(userUpi: string, targetThreshold: number): Promise<VaultState> {
    const res = await fetch(`${API_BASE}/vault/update-threshold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upi: userUpi, targetThreshold })
    });
    return await res.json();
  },

  async manualSweepVault(userUpi: string): Promise<VaultState> {
    const res = await fetch(`${API_BASE}/vault/manual-sweep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upi: userUpi })
    });
    return await res.json();
  },

  async createEntity(entity: Omit<Entity, 'id'>): Promise<Entity> {
    const res = await fetch(`${API_BASE}/entities/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entity)
    });
    return await res.json();
  },

  async payLiability(senderUpi: string, liabilityId: string): Promise<{ success: boolean; user: Entity }> {
    const res = await fetch(`${API_BASE}/liabilities/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderUpi, liabilityId })
    });
    return await res.json();
  }
};
