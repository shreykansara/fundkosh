import { Entity } from '../../domain/models';
import { apiClient } from '../../api/apiClient';

export interface IEntityRepository {
  getAllEntities(): Promise<Entity[]>;
  getEntityByUpi(upi_id: string): Promise<Entity | undefined>;
  getEntityById(id: string): Promise<Entity | undefined>;
}

export class EntityRepository implements IEntityRepository {
  async getAllEntities(): Promise<Entity[]> {
    return await apiClient.getEntities();
  }

  async getEntityByUpi(upi_id: string): Promise<Entity | undefined> {
    const entities = await apiClient.getEntities();
    return entities.find(e => e.upi_id === upi_id);
  }

  async getEntityById(id: string): Promise<Entity | undefined> {
    const entities = await apiClient.getEntities();
    return entities.find(e => e.id === id);
  }
}

