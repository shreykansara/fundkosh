import { 
  PredictedCategory, 
  SpeedBumpEvaluationResult, 
  RiskThemeState, 
  WeatherCondition, 
  LocalEventVector 
} from '../domain/models';
import { StatePredictor } from './StatePredictor';
import { DailyBudgetCalculator } from './DailyBudgetCalculator';
import { EntityRepository, IEntityRepository } from '../data/repositories/EntityRepository';
import { TransactionRepository, ITransactionRepository } from '../data/repositories/TransactionRepository';
import { LiabilityRepository, ILiabilityRepository } from '../data/repositories/LiabilityRepository';

export interface ISpeedBumpEvaluator {
  evaluateTransaction(
    senderUpi: string,
    receiverUpi: string,
    amount: number,
    note?: 'essential' | 'impulsive' | 'other' | string,
    weather?: WeatherCondition,
    event?: LocalEventVector
  ): Promise<SpeedBumpEvaluationResult>;
}

const IMPULSIVE_KEYWORDS = [
  'headphone', 'headphones', 'gadget', 'shoe', 'shoes', 'watch', 'fast food',
  'party', 'luxury', 'snack', 'snacks', 'game', 'gaming', 'console', 'dining',
  'pub', 'clubbing', 'apparel', 'perfume', 'gift', 'cab', 'uber', 'movie',
  'jacket', 'electronics', 'gourmet', 'cocktail', 'jewelry'
];

const ESSENTIAL_KEYWORDS = [
  'grocery', 'groceries', 'wheat', 'oil', 'rice', 'rent', 'emi', 'electricity',
  'bill', 'medicine', 'milk', 'vegetable', 'vegetables', 'school fee', 'tuition',
  'petrol', 'diesel', 'utility', 'doctor', 'hospital', 'loan', 'water'
];

const TRANSFER_KEYWORDS = [
  'pocket money', 'family', 'allowance', 'gift to spouse', 'savings', 'rent transfer', 'transfer'
];

export class SpeedBumpEvaluator implements ISpeedBumpEvaluator {
  private statePredictor: StatePredictor;
  private budgetCalculator: DailyBudgetCalculator;
  private entityRepo: IEntityRepository;
  private transactionRepo: ITransactionRepository;
  private liabilityRepo: ILiabilityRepository;

  constructor(
    entityRepo: IEntityRepository = new EntityRepository(),
    transactionRepo: ITransactionRepository = new TransactionRepository(),
    liabilityRepo: ILiabilityRepository = new LiabilityRepository()
  ) {
    this.entityRepo = entityRepo;
    this.transactionRepo = transactionRepo;
    this.liabilityRepo = liabilityRepo;
    this.statePredictor = new StatePredictor(entityRepo, liabilityRepo, transactionRepo);
    this.budgetCalculator = new DailyBudgetCalculator(liabilityRepo, transactionRepo);
  }

  async evaluateTransaction(
    senderUpi: string,
    receiverUpi: string,
    amount: number,
    note: 'essential' | 'impulsive' | 'other' | string = 'other',
    weather: WeatherCondition = 'CLEAR',
    event: LocalEventVector = 'NORMAL'
  ): Promise<SpeedBumpEvaluationResult> {
    const sender = await this.entityRepo.getEntityByUpi(senderUpi);
    const receiver = await this.entityRepo.getEntityByUpi(receiverUpi);

    const userState = await this.statePredictor.predictUserState(senderUpi);
    const budgetMetrics = await this.budgetCalculator.calculateMetrics(
      senderUpi, 
      sender?.id || 'usr_01', 
      weather, 
      event
    );

    // Spare change round up calculation to nearest ₹10
    const nextMultipleOf10 = Math.ceil(amount / 10) * 10;
    const roundUpAmount = nextMultipleOf10 > amount ? nextMultipleOf10 - amount : 0;

    const lowerNote = note.toLowerCase();
    const hasImpulsiveKw = lowerNote === 'impulsive' || IMPULSIVE_KEYWORDS.some(kw => lowerNote.includes(kw));
    const hasEssentialKw = lowerNote === 'essential' || ESSENTIAL_KEYWORDS.some(kw => lowerNote.includes(kw));
    const hasTransferKw = TRANSFER_KEYWORDS.some(kw => lowerNote.includes(kw));

    let predictedCategory: PredictedCategory = 'essential';
    if (receiver?.type === 0 || hasTransferKw) {
      predictedCategory = 'transfers';
    } else if (hasImpulsiveKw || (receiver?.type === 1 && (amount >= 2000 || userState.spendState === 'VULNERABLE'))) {
      predictedCategory = 'impulsive';
    } else if (hasEssentialKw) {
      predictedCategory = 'essential';
    } else {
      predictedCategory = amount > 1500 ? 'impulsive' : 'essential';
    }

    let isImpulsive = predictedCategory === 'impulsive';
    const reasons: string[] = [];
    let riskScore = 0;

    if (isImpulsive) riskScore += 25;
    if (hasImpulsiveKw) {
      riskScore += 20;
      reasons.push(`Note text contains discretionary keywords ("${note}").`);
    }
    if (amount > budgetMetrics.remainingDailyBudget) {
      riskScore += 35;
      reasons.push(`Amount (₹${amount.toLocaleString()}) exceeds remaining daily spendable limit (₹${budgetMetrics.remainingDailyBudget.toLocaleString()}).`);
    }
    if (amount > userState.availableCushion) {
      riskScore += 40;
      reasons.push(`Amount (₹${amount.toLocaleString()}) exceeds available cash cushion (₹${userState.availableCushion.toLocaleString()}).`);
    }
    if (userState.spendState === 'VULNERABLE') {
      riskScore += 15;
      reasons.push(...userState.reasons);
    }

    // Hardcoded rules evaluation (as speedbumprules collection is removed)
    const rules = [
      { id: 'rule_high_risk_ml', name: 'Dynamic Impulse Vulnerability Rule', riskScoreThreshold: 45, cooldownPeriodSeconds: 10, isActive: true },
      { id: 'rule_high_value', name: 'High-Value Payment Guard', maxAmountThreshold: 2000, cooldownPeriodSeconds: 5, isActive: true },
      { id: 'rule_daily_limit', name: 'Daily Budget Exceeded Guard', dailySpendLimit: 5000, cooldownPeriodSeconds: 15, isActive: true }
    ];
    let maxCooldown = 0;
    let ruleTriggered = false;

    for (const rule of rules) {
      if (rule.riskScoreThreshold !== undefined && riskScore >= rule.riskScoreThreshold && isImpulsive) {
        ruleTriggered = true;
        reasons.push(`Impulse risk score (${riskScore}/100) exceeded threshold (${rule.riskScoreThreshold}).`);
        if (rule.cooldownPeriodSeconds && rule.cooldownPeriodSeconds > maxCooldown) {
          maxCooldown = rule.cooldownPeriodSeconds;
        }
      }
      if (rule.maxAmountThreshold !== undefined && amount >= rule.maxAmountThreshold) {
        ruleTriggered = true;
        reasons.push(`Amount (₹${amount.toLocaleString()}) exceeds single-transaction threshold (₹${rule.maxAmountThreshold.toLocaleString()}).`);
        if (rule.cooldownPeriodSeconds && rule.cooldownPeriodSeconds > maxCooldown) {
          maxCooldown = rule.cooldownPeriodSeconds;
        }
      }
    }

    riskScore = Math.min(100, Math.max(0, riskScore));

    // Dynamic Theme State Determination
    let themeState: RiskThemeState = 'GREEN';
    if (!isImpulsive || predictedCategory === 'essential') {
      themeState = 'GREEN';
    } else if (isImpulsive && amount <= budgetMetrics.remainingDailyBudget && amount <= userState.availableCushion) {
      themeState = 'AMBER';
    } else {
      themeState = 'RED';
    }

    let requiresSpeedBump = themeState !== 'GREEN' || ruleTriggered;
    let suggestedCooldownSeconds = requiresSpeedBump ? 3 : 0;

    if (note === 'essential' || note === 'emi') {
      requiresSpeedBump = false;
      suggestedCooldownSeconds = 0;
      themeState = 'GREEN';
      predictedCategory = 'essential';
      isImpulsive = false;
      riskScore = 0;
      reasons.length = 0;
    }

    return {
      predictedCategory,
      isImpulsive,
      riskScore,
      requiresSpeedBump,
      themeState,
      reasons,
      suggestedCooldownSeconds,
      roundUpAmount
    };
  }
}
