import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender_upi: { type: String, required: true },
  receiver_upi: { type: String, required: true },
  amount: { type: Number, required: true },
  round_up_amount: { type: Number, default: 0 },
  note: { type: String },
  predicted_category: { 
    type: String, 
    enum: ['essential', 'impulsive', 'transfers'], 
    default: 'essential' 
  },
  is_impulsive: { type: Boolean, default: false },
  risk_score: { type: Number, default: 0 },
  theme_state: { type: String, enum: ['GREEN', 'AMBER', 'RED'], default: 'GREEN' },
  status: { 
    type: String, 
    enum: ['PENDING', 'SPEED_BUMP_REQUIRED', 'APPROVED', 'BLOCKED', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  speed_bump_reason: { type: String },
  timestamp: { type: String, required: true }
}, { timestamps: true });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
