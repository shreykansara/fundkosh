import { VaultState, FlexiRDAccount } from '../../domain/models';
import { apiClient } from '../../api/apiClient';

export interface IVaultRepository {
  getVault(): Promise<VaultState>;
  updateTargetThreshold(threshold: number): Promise<VaultState>;
  manualSweep(): Promise<VaultState>;
}

export class VaultRepository implements IVaultRepository {
  async getVault(): Promise<VaultState> {
    return await apiClient.getVault();
  }


  async updateTargetThreshold(threshold: number): Promise<VaultState> {
    return await apiClient.updateVaultThreshold(threshold);
  }

  async manualSweep(): Promise<VaultState> {
    return await apiClient.manualSweepVault();
  }
}
