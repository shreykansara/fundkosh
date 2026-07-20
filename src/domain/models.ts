export type EntityType = 'user' | 'family' | 'merchant';
export type EntityCategory = 'primary' | 'household' | 'essential' | 'impulsive';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  category: EntityCategory;
  balance: number;
  upi_id: string;
}

export type TransactionStatus = 
  | 'PENDING'
  | 'SPEED_BUMP_REQUIRED'
  | 'APPROVED'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED';

export interface Transaction {
  id: string;
  sender_upi: string;
  receiver_upi: string;
  amount: number;
  note?: string;
  category: EntityCategory;
  status: TransactionStatus;
  speed_bump_reason?: string;
  timestamp: string; // ISO String
}

export interface SpeedBumpRule {
  id: string;
  name: string;
  description: string;
  maxAmountThreshold?: number; // E.g., > 2000 INR triggers speed bump
  flaggedCategories?: EntityCategory[]; // E.g., ['impulsive']
  dailySpendLimit?: number; // E.g., > 10000 INR per day triggers speed bump
  cooldownPeriodSeconds?: number;
  isActive: boolean;
}

export interface SpeedBumpEvaluationResult {
  requiresSpeedBump: boolean;
  riskScore: number; // 0 to 100
  reasons: string[];
  suggestedCooldownSeconds: number;
}
