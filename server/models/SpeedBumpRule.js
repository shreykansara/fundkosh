import mongoose from 'mongoose';

const SpeedBumpRuleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  maxAmountThreshold: { type: Number },
  riskScoreThreshold: { type: Number },
  dailySpendLimit: { type: Number },
  cooldownPeriodSeconds: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SpeedBumpRule = mongoose.models.SpeedBumpRule || mongoose.model('SpeedBumpRule', SpeedBumpRuleSchema);
