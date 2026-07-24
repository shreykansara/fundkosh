import { VaultState } from '../../domain/models';
import { apiClient } from '../../api/apiClient';

export interface IVaultRepository {
  getVault(userUpi?: string): Promise<VaultState>;
  updateTargetThreshold(userUpi: string, threshold: number): Promise<VaultState>;
  manualSweep(userUpi: string): Promise<VaultState>;
}

export class VaultRepository implements IVaultRepository {
  async getVault(userUpi?: string): Promise<VaultState> {
    return await apiClient.getVault(userUpi);
  }

  async updateTargetThreshold(userUpi: string, threshold: number): Promise<VaultState> {
    return await apiClient.updateVaultThreshold(userUpi, threshold);
  }

  async manualSweep(userUpi: string): Promise<VaultState> {
    return await apiClient.manualSweepVault(userUpi);
  }
}
