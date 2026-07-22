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
import { apiClient } from '../api/apiClient';

export interface ISpeedBumpEvaluator {
  evaluateTransaction(
    senderUpi: string,
    receiverUpi: string,
    amount: number,
    note?: string,
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
    note: string = '',
    weather: WeatherCondition = 'CLEAR',
    event: LocalEventVector = 'NORMAL'
  ): Promise<SpeedBumpEvaluationResult> {
    const sender = await this.entityRepo.getEntityByUpi(senderUpi);
    const receiver = await this.entityRepo.getEntityByUpi(receiverUpi);

    const userState = await this.statePredictor.predictUserState(senderUpi);
    const budgetMetrics = await this.budgetCalculator.calculateMetrics(senderUpi, weather, event);

    // Spare change round up calculation to nearest ₹10
    const nextMultipleOf10 = Math.ceil(amount / 10) * 10;
    const roundUpAmount = nextMultipleOf10 > amount ? nextMultipleOf10 - amount : 0;

    const lowerNote = note.toLowerCase();
    const hasImpulsiveKw = IMPULSIVE_KEYWORDS.some(kw => lowerNote.includes(kw));
    const hasEssentialKw = ESSENTIAL_KEYWORDS.some(kw => lowerNote.includes(kw));
    const hasTransferKw = TRANSFER_KEYWORDS.some(kw => lowerNote.includes(kw));

    let predictedCategory: PredictedCategory = 'essential';
    if (receiver?.type === 'family' || hasTransferKw) {
      predictedCategory = 'transfers';
    } else if (hasImpulsiveKw || (receiver?.type === 'merchant' && (amount >= 2000 || userState.spendState === 'VULNERABLE'))) {
      predictedCategory = 'impulsive';
    } else if (hasEssentialKw) {
      predictedCategory = 'essential';
    } else {
      predictedCategory = amount > 1500 ? 'impulsive' : 'essential';
    }

    const isImpulsive = predictedCategory === 'impulsive';
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

    // Rules evaluation from DB
    const rules = await apiClient.getRules();
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

    const requiresSpeedBump = themeState !== 'GREEN' || ruleTriggered;
    const suggestedCooldownSeconds = requiresSpeedBump 
      ? (themeState === 'RED' ? Math.max(10, maxCooldown) : Math.max(5, maxCooldown))
      : 0;

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


