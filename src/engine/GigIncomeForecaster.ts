import { WeatherCondition, LocalEventVector, GigIncomePrediction } from '../domain/models';

export class GigIncomeForecaster {
  private static BASE_MONTHLY_INCOME = 32000; // Baseline average gig earnings per month (₹32,000)

  /**
   * Forecasts monthly and weekly gig income based on external weather and event vectors.
   */
  public forecastIncome(
    weather: WeatherCondition = 'CLEAR',
    event: LocalEventVector = 'NORMAL'
  ): GigIncomePrediction {
    let weatherMultiplier = 1.0;
    if (weather === 'RAIN') weatherMultiplier = 1.25; // +25% rain surge
    else if (weather === 'HEATWAVE') weatherMultiplier = 1.10; // +10% heatwave surge

    let eventMultiplier = 1.0;
    if (event === 'FESTIVAL_SEASON') eventMultiplier = 1.30; // +30% festival surge
    else if (event === 'IPL_MATCH_NIGHT') eventMultiplier = 1.20; // +20% match night surge

    const baseMonthly = GigIncomeForecaster.BASE_MONTHLY_INCOME;
    const weatherSurgeBonus = Math.round(baseMonthly * (weatherMultiplier - 1.0));
    const eventSurgeBonus = Math.round(baseMonthly * (eventMultiplier - 1.0));

    const totalPredictedMonthly = Math.round(baseMonthly * weatherMultiplier * eventMultiplier);
    const predictedWeekly = Math.round(totalPredictedMonthly / 4);

    return {
      baseMonthlyIncome: baseMonthly,
      weatherMultiplier,
      weatherSurgeBonus,
      eventMultiplier,
      eventSurgeBonus,
      totalPredictedMonthly,
      predictedWeekly
    };
  }
}
