export type EntityType = 0 | 1; // 0 = user, 1 = merchant
export type PredictedCategory = 'essential' | 'impulsive' | 'transfers';
export type RiskThemeState = 'GREEN' | 'AMBER' | 'RED';
export type SpendState = 'SAFE' | 'VULNERABLE' | 'CRITICAL';
export type WeatherCondition = 'CLEAR' | 'RAIN' | 'HEATWAVE';
export type LocalEventVector = 'NORMAL' | 'FESTIVAL_SEASON' | 'IPL_MATCH_NIGHT';

export interface EmbeddedLiability {
  id: string;
  title: string;
  amount: number;
  period_days: number;
  last_paid_date: string; // ISO string YYYY-MM-DD
  is_active: boolean;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  balance: number;
  upi_id: string;
  phone?: string;
  liabilities?: EmbeddedLiability[];
  vault?: VaultState;
}

export interface Liability {
  id: string;
  entity_id: string;
  title: string;
  amount: number;
  due_in_days: number;
  is_active: boolean;
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
  note?: 'essential' | 'impulsive' | 'other' | 'emi';
  risk_score: number; // 0 to 100
  status: TransactionStatus;
  speed_bump_reason?: string;
  timestamp: string; // ISO String
}

export interface SpeedBumpRule {
  id: string;
  name: string;
  description: string;
  maxAmountThreshold?: number;
  riskScoreThreshold?: number;
  dailySpendLimit?: number;
  cooldownPeriodSeconds?: number;
  isActive: boolean;
}

export interface VaultState {
  balance: number;
  target_threshold: number;
  total_swept: number;
  flexi_rd_balance: number;
  interest_rate: number;
  total_sweeps_count: number;
}

export interface FlexiRDAccount {
  account_id: string;
  balance: number;
  interest_rate: number; // e.g., 7.2%
  total_sweeps_count: number;
}

export interface GigIncomePrediction {
  baseMonthlyIncome: number;
  weatherMultiplier: number;
  weatherSurgeBonus: number;
  eventMultiplier: number;
  eventSurgeBonus: number;
  totalPredictedMonthly: number;
  predictedWeekly: number;
}

export interface DailyBudgetMetrics {
  predictedMonthlyIncome: number;
  totalActiveLiabilities: number;
  netSpendablePool: number;
  daysInMonth: number;
  baselineDailySpend: number;
  dailySpendableLimit: number;
  todaySpent: number;
  remainingDailyBudget: number;
}

export interface PredictiveUserState {
  spendState: SpendState;
  themeState: RiskThemeState;
  temporalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  availableCushion: number;
  remainingDailyBudget: number;
}

export interface SpeedBumpEvaluationResult {
  predictedCategory: PredictedCategory;
  isImpulsive: boolean;
  riskScore: number; // 0 to 100
  requiresSpeedBump: boolean;
  themeState: RiskThemeState;
  reasons: string[];
  suggestedCooldownSeconds: number;
  roundUpAmount: number;
}
