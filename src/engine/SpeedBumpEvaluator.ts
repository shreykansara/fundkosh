import { EntityCategory, SpeedBumpEvaluationResult } from '../domain/models';
import { db } from '../data/database';
import { ITransactionRepository, TransactionRepository } from '../data/repositories/TransactionRepository';

export interface ISpeedBumpEvaluator {
  evaluateTransaction(
    senderUpi: string,
    receiverCategory: EntityCategory,
    amount: number
  ): Promise<SpeedBumpEvaluationResult>;
}

export class SpeedBumpEvaluator implements ISpeedBumpEvaluator {
  private transactionRepo: ITransactionRepository;

  constructor(transactionRepo: ITransactionRepository = new TransactionRepository()) {
    this.transactionRepo = transactionRepo;
  }

  async evaluateTransaction(
    senderUpi: string,
    receiverCategory: EntityCategory,
    amount: number
  ): Promise<SpeedBumpEvaluationResult> {
    const rules = await db.speed_bump_rules.filter(r => r.isActive).toArray();
    const reasons: string[] = [];
    let riskScore = 0;
    let maxCooldown = 0;

    // Fetch today's aggregate spend for this category
    const todayCategorySpend = await this.transactionRepo.getTodaySpendBySenderAndCategory(
      senderUpi,
      receiverCategory
    );
    const cumulativeTotal = todayCategorySpend + amount;

    for (const rule of rules) {
      // 1. Impulsive / Flagged Category Check
      if (rule.flaggedCategories && rule.flaggedCategories.includes(receiverCategory)) {
        riskScore += 45;
        reasons.push(
          `Recipient category '${receiverCategory}' is categorized as impulsive spend.`
        );
        if (rule.cooldownPeriodSeconds && rule.cooldownPeriodSeconds > maxCooldown) {
          maxCooldown = rule.cooldownPeriodSeconds;
        }
      }

      // 2. Single High-Value Amount Threshold Check
      if (rule.maxAmountThreshold !== undefined && amount >= rule.maxAmountThreshold) {
        riskScore += 35;
        reasons.push(
          `Transaction amount (₹${amount.toLocaleString()}) exceeds single-transaction speed-bump threshold (₹${rule.maxAmountThreshold.toLocaleString()}).`
        );
        if (rule.cooldownPeriodSeconds && rule.cooldownPeriodSeconds > maxCooldown) {
          maxCooldown = rule.cooldownPeriodSeconds;
        }
      }

      // 3. Daily Velocity / Spend Limit Check
      if (
        rule.dailySpendLimit !== undefined &&
        receiverCategory === 'impulsive' &&
        cumulativeTotal >= rule.dailySpendLimit
      ) {
        riskScore += 40;
        reasons.push(
          `Cumulative daily spend in '${receiverCategory}' category (₹${cumulativeTotal.toLocaleString()}) exceeds daily target limit (₹${rule.dailySpendLimit.toLocaleString()}).`
        );
        if (rule.cooldownPeriodSeconds && rule.cooldownPeriodSeconds > maxCooldown) {
          maxCooldown = rule.cooldownPeriodSeconds;
        }
      }
    }

    // Clamp risk score to 100 max
    riskScore = Math.min(riskScore, 100);
    const requiresSpeedBump = riskScore >= 35 || reasons.length > 0;

    return {
      requiresSpeedBump,
      riskScore,
      reasons,
      suggestedCooldownSeconds: requiresSpeedBump ? (maxCooldown > 0 ? maxCooldown : 5) : 0
    };
  }
}
