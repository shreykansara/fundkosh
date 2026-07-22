import { Liability } from '../../domain/models';
import { apiClient } from '../../api/apiClient';

export interface ILiabilityRepository {
  getAllLiabilities(): Promise<Liability[]>;
  getActiveLiabilitiesForEntity(entityId: string, dueWithinDays?: number): Promise<Liability[]>;
  getTotalLiabilitiesAmount(entityId: string, dueWithinDays?: number): Promise<number>;
}

export class LiabilityRepository implements ILiabilityRepository {
  async getAllLiabilities(): Promise<Liability[]> {
    return await apiClient.getLiabilities();
  }

  async getActiveLiabilitiesForEntity(entityId: string, dueWithinDays: number = 30): Promise<Liability[]> {
    const all = await apiClient.getLiabilities();
    return all.filter(l => l.entity_id === entityId && Boolean(l.is_active) && l.due_in_days <= dueWithinDays);
  }

  async getTotalLiabilitiesAmount(entityId: string, dueWithinDays: number = 30): Promise<number> {
    const active = await this.getActiveLiabilitiesForEntity(entityId, dueWithinDays);
    return active.reduce((sum, l) => sum + l.amount, 0);
  }
}

