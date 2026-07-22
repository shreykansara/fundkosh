import mongoose from 'mongoose';

const EntitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['user', 'family', 'merchant', 'financial_institution', 'gig_platform'] 
  },
  balance: { type: Number, required: true, default: 0 },
  upi_id: { type: String, required: true, unique: true },
  phone: { type: String }
}, { timestamps: true });

export const Entity = mongoose.models.Entity || mongoose.model('Entity', EntitySchema);
