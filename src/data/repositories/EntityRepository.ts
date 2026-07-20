import { db } from '../database';
import { Entity } from '../../domain/models';

export interface IEntityRepository {
  getAllEntities(): Promise<Entity[]>;
  getEntityByUpi(upi_id: string): Promise<Entity | undefined>;
  getEntityById(id: string): Promise<Entity | undefined>;
  updateBalance(id: string, newBalance: number): Promise<void>;
  transferBalances(senderUpi: string, receiverUpi: string, amount: number): Promise<{ senderNewBalance: number; receiverNewBalance: number }>;
}

export class EntityRepository implements IEntityRepository {
  async getAllEntities(): Promise<Entity[]> {
    return await db.entities.toArray();
  }

  async getEntityByUpi(upi_id: string): Promise<Entity | undefined> {
    return await db.entities.where('upi_id').equals(upi_id).first();
  }

  async getEntityById(id: string): Promise<Entity | undefined> {
    return await db.entities.get(id);
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    await db.entities.update(id, { balance: newBalance });
  }

  async transferBalances(
    senderUpi: string,
    receiverUpi: string,
    amount: number
  ): Promise<{ senderNewBalance: number; receiverNewBalance: number }> {
    return await db.transaction('rw', db.entities, async () => {
      const sender = await db.entities.where('upi_id').equals(senderUpi).first();
      const receiver = await db.entities.where('upi_id').equals(receiverUpi).first();

      if (!sender) {
        throw new Error(`Sender with UPI ID '${senderUpi}' not found.`);
      }
      if (!receiver) {
        throw new Error(`Receiver with UPI ID '${receiverUpi}' not found.`);
      }
      if (sender.balance < amount) {
        throw new Error(`Insufficient funds: Balance is ₹${sender.balance}, requested ₹${amount}.`);
      }

      const senderNewBalance = sender.balance - amount;
      const receiverNewBalance = receiver.balance + amount;

      await db.entities.update(sender.id, { balance: senderNewBalance });
      await db.entities.update(receiver.id, { balance: receiverNewBalance });

      return { senderNewBalance, receiverNewBalance };
    });
  }
}
