import mongoose from 'mongoose';

const LiabilitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  entity_id: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  due_in_days: { type: Number, required: true },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

export const Liability = mongoose.models.Liability || mongoose.model('Liability', LiabilitySchema);
