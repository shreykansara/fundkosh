import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  target_threshold: { type: Number, default: 100 },
  total_swept: { type: Number, default: 0 },
  flexi_rd_balance: { type: Number, default: 0 },
  interest_rate: { type: Number, default: 7.2 },
  total_sweeps_count: { type: Number, default: 0 }
}, { timestamps: true });

export const Vault = mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
