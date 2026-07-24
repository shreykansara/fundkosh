import mongoose from 'mongoose';

const LiabilitySubSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  period_days: { type: Number, required: true },
  last_paid_date: { type: String, required: true },
  is_active: { type: Boolean, default: true }
}, { _id: false, timestamps: false });

const VaultSubSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  target_threshold: { type: Number, default: 100 },
  total_swept: { type: Number, default: 0 },
  flexi_rd_balance: { type: Number, default: 0 },
  interest_rate: { type: Number, default: 7.2 },
  total_sweeps_count: { type: Number, default: 0 }
}, { _id: false, timestamps: false });

const EntitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: Number, 
    required: true, 
    enum: [0, 1] // 0 = user, 1 = merchant
  },
  balance: { type: Number, required: true, default: 0 },
  upi_id: { type: String, required: true, unique: true },
  phone: { type: String },
  liabilities: [LiabilitySubSchema],
  vault: { type: VaultSubSchema, default: () => ({}) }
}, { timestamps: true });

export const Entity = mongoose.models.Entity || mongoose.model('Entity', EntitySchema);
