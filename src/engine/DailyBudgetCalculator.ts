import { DailyBudgetMetrics, WeatherCondition, LocalEventVector } from '../domain/models';
import { GigIncomeForecaster } from './GigIncomeForecaster';
import { LiabilityRepository, ILiabilityRepository } from '../data/repositories/LiabilityRepository';
import { TransactionRepository, ITransactionRepository } from '../data/repositories/TransactionRepository';

export class DailyBudgetCalculator {
  private forecaster: GigIncomeForecaster;
  private liabilityRepo: ILiabilityRepository;
  private transactionRepo: ITransactionRepository;

  constructor(
    liabilityRepo: ILiabilityRepository = new LiabilityRepository(),
    transactionRepo: ITransactionRepository = new TransactionRepository()
  ) {
    this.forecaster = new GigIncomeForecaster();
    this.liabilityRepo = liabilityRepo;
    this.transactionRepo = transactionRepo;
  }

  /**
   * Calculates dynamic daily spendable limit using:
   * Daily Budget = (Predicted Income - Total Liabilities) / DaysInMonth - Baseline Daily Spend
   */
  async calculateMetrics(
    userUpi: string = 'aarav@fundkosh',
    weather: WeatherCondition = 'CLEAR',
    event: LocalEventVector = 'NORMAL',
    baselineDailySpend: number = 300
  ): Promise<DailyBudgetMetrics> {
    const incomeForecast = this.forecaster.forecastIncome(weather, event);
    const predictedMonthlyIncome = incomeForecast.totalPredictedMonthly;

    const totalActiveLiabilities = await this.liabilityRepo.getTotalLiabilitiesAmount('usr_01', 30);
    const netSpendablePool = Math.max(0, predictedMonthlyIncome - totalActiveLiabilities);

    const daysInMonth = 30;
    const rawDailyLimit = Math.round(netSpendablePool / daysInMonth);
    const dailySpendableLimit = Math.max(100, rawDailyLimit - baselineDailySpend);

    const todaySpent = await this.transactionRepo.getTodayTotalSpend(userUpi);
    const remainingDailyBudget = Math.max(0, dailySpendableLimit - todaySpent);

    return {
      predictedMonthlyIncome,
      totalActiveLiabilities,
      netSpendablePool,
      daysInMonth,
      baselineDailySpend,
      dailySpendableLimit,
      todaySpent,
      remainingDailyBudget
    };
  }
}
