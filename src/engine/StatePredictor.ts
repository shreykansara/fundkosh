import { PredictiveUserState, RiskThemeState, SpendState } from '../domain/models';
import { EntityRepository, IEntityRepository } from '../data/repositories/EntityRepository';
import { LiabilityRepository, ILiabilityRepository } from '../data/repositories/LiabilityRepository';
import { TransactionRepository, ITransactionRepository } from '../data/repositories/TransactionRepository';

export class StatePredictor {
  private entityRepo: IEntityRepository;
  private liabilityRepo: ILiabilityRepository;
  private transactionRepo: ITransactionRepository;

  constructor(
    entityRepo: IEntityRepository = new EntityRepository(),
    liabilityRepo: ILiabilityRepository = new LiabilityRepository(),
    transactionRepo: ITransactionRepository = new TransactionRepository()
  ) {
    this.entityRepo = entityRepo;
    this.liabilityRepo = liabilityRepo;
    this.transactionRepo = transactionRepo;
  }

  /**
   * Proactively predicts the user's spending state (SAFE, VULNERABLE, CRITICAL) upon app open
   */
  async predictUserState(userUpi: string = 'aarav@fundkosh'): Promise<PredictiveUserState> {
    const user = await this.entityRepo.getEntityByUpi(userUpi);
    const userBalance = user ? user.balance : 0;
    const userId = user ? user.id : 'usr_01';

    const [liabilities30Days, liabilities3Days, velocity, todaySpend] = await Promise.all([
      this.liabilityRepo.getTotalLiabilitiesAmount(userId, 30),
      this.liabilityRepo.getTotalLiabilitiesAmount(userId, 3),
      this.transactionRepo.getRecentVelocity(userUpi, 2),
      this.transactionRepo.getTodayTotalSpend(userUpi)
    ]);
    const availableCushion = Math.max(0, userBalance - liabilities30Days);

    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    let spendState: SpendState = 'SAFE';
    let themeState: RiskThemeState = 'GREEN';
    let temporalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const reasons: string[] = [];

    // Critical State Trigger Checks
    if (userBalance < liabilities3Days) {
      spendState = 'CRITICAL';
      themeState = 'RED';
      temporalRiskLevel = 'HIGH';
      reasons.push(`Account balance (₹${userBalance.toLocaleString()}) is below upcoming 3-day liabilities (₹${liabilities3Days.toLocaleString()}).`);
    } else if (availableCushion <= 2000) {
      spendState = 'CRITICAL';
      themeState = 'RED';
      temporalRiskLevel = 'HIGH';
      reasons.push(`Available cash cushion (₹${availableCushion.toLocaleString()}) is severely depleted.`);
    }

    // Vulnerable State Trigger Checks (if not critical)
    if (spendState !== 'CRITICAL') {
      if (currentHour >= 22 || currentHour < 5) {
        spendState = 'VULNERABLE';
        themeState = 'AMBER';
        temporalRiskLevel = 'MEDIUM';
        reasons.push(`Late-night hour (${currentHour}:00 hrs) elevates impulse risk vulnerability.`);
      }
      if (isWeekend) {
        if (spendState === 'SAFE') {
          spendState = 'VULNERABLE';
          themeState = 'AMBER';
        }
        reasons.push('Weekend temporal window active (statistically higher discretionary spend).');
      }
      if (velocity.count >= 2 || velocity.totalAmount >= 3000) {
        spendState = 'VULNERABLE';
        themeState = 'AMBER';
        temporalRiskLevel = 'MEDIUM';
        reasons.push(`High spending velocity: ${velocity.count} transactions totaling ₹${velocity.totalAmount.toLocaleString()} in last 2h.`);
      }
      if (todaySpend >= 4000) {
        spendState = 'VULNERABLE';
        themeState = 'AMBER';
        reasons.push(`Cumulative daily spend (₹${todaySpend.toLocaleString()}) approaching daily target budget.`);
      }
    }

    if (spendState === 'SAFE') {
      reasons.push(`User is in a Safe Liquidity State (Cushion: ₹${availableCushion.toLocaleString()}, Low velocity).`);
    }

    return {
      spendState,
      themeState,
      temporalRiskLevel,
      reasons,
      availableCushion,
      remainingDailyBudget: Math.max(0, 1500 - todaySpend) // Default baseline remaining
    };
  }
}
