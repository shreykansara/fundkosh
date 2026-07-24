import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender_upi: { type: String, required: true },
  receiver_upi: { type: String, required: true },
  amount: { type: Number, required: true },
  note: { type: String, enum: ['essential', 'impulsive', 'other', 'emi'], default: 'other' },
  risk_score: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['PENDING', 'SPEED_BUMP_REQUIRED', 'APPROVED', 'BLOCKED', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  speed_bump_reason: { type: String },
  timestamp: { type: String, required: true }
}, { timestamps: false, versionKey: false });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
