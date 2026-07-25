export interface PredictionContext {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (0 = Sunday)
  dayOfMonth: number; // 1-31
  dayOfYear: number; // 1-366
}

export interface PredictionResult {
  category: 'essential' | 'impulsive';
  confidence: number;
  probability: number;
  subProbabilities: {
    hour: number;
    dayOfWeek: number;
    dayOfMonth: number;
    dayOfYear: number;
  };
}

export function getCurrentContext(): PredictionContext {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  return {
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    dayOfMonth: now.getDate(),
    dayOfYear: dayOfYear
  };
}

interface SubModelData {
  bias: number;
  weights: { [key: number]: number };
}

interface RLModelDataV3 {
  hourModel: SubModelData;
  dayOfWeekModel: SubModelData;
  dayOfMonthModel: SubModelData;
  dayOfYearModel: SubModelData;
}

export class ReinforcementPredictor {
  private model!: RLModelDataV3;
  private learningRate = 0.2; // Quick learning rate for fast personalization feedback

  constructor() {
    this.loadModel();
  }

  private loadModel() {
    try {
      const stored = localStorage.getItem('fundkosh_rl_model_v3');
      if (stored) {
        this.model = JSON.parse(stored);
      } else {
        this.initializeDefaultModel();
      }
    } catch (e) {
      console.error("Failed to load RL model v3", e);
      this.initializeDefaultModel();
    }
  }

  private initializeDefaultModel() {
    // We initialize all 4 sub-models with a default bias of -0.3 to favor essential payments initially
    this.model = {
      hourModel: { bias: -0.3, weights: {} },
      dayOfWeekModel: { bias: -0.3, weights: {} },
      dayOfMonthModel: { bias: -0.3, weights: {} },
      dayOfYearModel: { bias: -0.3, weights: {} }
    };
  }

  private saveModel() {
    try {
      localStorage.setItem('fundkosh_rl_model_v3', JSON.stringify(this.model));
    } catch (e) {
      console.error("Failed to save RL model v3", e);
    }
  }

  private getWeight(subModel: SubModelData, key: number): number {
    if (subModel.weights[key] === undefined) {
      subModel.weights[key] = 0.0;
    }
    return subModel.weights[key];
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Predict whether the user has opened the app to make an essential or impulsive payment.
   */
  predict(context: PredictionContext): PredictionResult {
    // Sub-model 1: Hour (time of day)
    const logitHour = this.model.hourModel.bias + this.getWeight(this.model.hourModel, context.hour);
    const probHour = this.sigmoid(logitHour);

    // Sub-model 2: Day of Week
    const logitDayOfWeek = this.model.dayOfWeekModel.bias + this.getWeight(this.model.dayOfWeekModel, context.dayOfWeek);
    const probDayOfWeek = this.sigmoid(logitDayOfWeek);

    // Sub-model 3: Day of Month
    const logitDayOfMonth = this.model.dayOfMonthModel.bias + this.getWeight(this.model.dayOfMonthModel, context.dayOfMonth);
    const probDayOfMonth = this.sigmoid(logitDayOfMonth);

    // Sub-model 4: Day of Year
    const logitDayOfYear = this.model.dayOfYearModel.bias + this.getWeight(this.model.dayOfYearModel, context.dayOfYear);
    const probDayOfYear = this.sigmoid(logitDayOfYear);

    // Combine predictions by averaging the individual probabilities
    const probCombined = (probHour + probDayOfWeek + probDayOfMonth + probDayOfYear) / 4;

    const category = probCombined > 0.5 ? 'impulsive' : 'essential';
    const confidence = Math.round((category === 'impulsive' ? probCombined : 1 - probCombined) * 100);

    return {
      category,
      confidence,
      probability: probCombined,
      subProbabilities: {
        hour: probHour,
        dayOfWeek: probDayOfWeek,
        dayOfMonth: probDayOfMonth,
        dayOfYear: probDayOfYear
      }
    };
  }

  /**
   * Online reinforcement gradient step when a transaction completes.
   */
  update(context: PredictionContext, actualCategory: 'essential' | 'impulsive'): boolean {
    // Only update if actual category is essential or impulsive
    if (actualCategory !== 'essential' && actualCategory !== 'impulsive') {
      return false;
    }

    const currentPrediction = this.predict(context);
    const isCorrect = currentPrediction.category === actualCategory;

    // y = 1 for impulsive, 0 for essential
    const y = actualCategory === 'impulsive' ? 1.0 : 0.0;

    // Update Sub-model 1: Hour
    const logitHour = this.model.hourModel.bias + this.getWeight(this.model.hourModel, context.hour);
    const probHour = this.sigmoid(logitHour);
    const errHour = y - probHour;
    this.model.hourModel.bias += this.learningRate * errHour;
    this.model.hourModel.weights[context.hour] += this.learningRate * errHour;

    // Update Sub-model 2: Day of Week
    const logitDayOfWeek = this.model.dayOfWeekModel.bias + this.getWeight(this.model.dayOfWeekModel, context.dayOfWeek);
    const probDayOfWeek = this.sigmoid(logitDayOfWeek);
    const errDayOfWeek = y - probDayOfWeek;
    this.model.dayOfWeekModel.bias += this.learningRate * errDayOfWeek;
    this.model.dayOfWeekModel.weights[context.dayOfWeek] += this.learningRate * errDayOfWeek;

    // Update Sub-model 3: Day of Month
    const logitDayOfMonth = this.model.dayOfMonthModel.bias + this.getWeight(this.model.dayOfMonthModel, context.dayOfMonth);
    const probDayOfMonth = this.sigmoid(logitDayOfMonth);
    const errDayOfMonth = y - probDayOfMonth;
    this.model.dayOfMonthModel.bias += this.learningRate * errDayOfMonth;
    this.model.dayOfMonthModel.weights[context.dayOfMonth] += this.learningRate * errDayOfMonth;

    // Update Sub-model 4: Day of Year
    const logitDayOfYear = this.model.dayOfYearModel.bias + this.getWeight(this.model.dayOfYearModel, context.dayOfYear);
    const probDayOfYear = this.sigmoid(logitDayOfYear);
    const errDayOfYear = y - probDayOfYear;
    this.model.dayOfYearModel.bias += this.learningRate * errDayOfYear;
    this.model.dayOfYearModel.weights[context.dayOfYear] += this.learningRate * errDayOfYear;

    this.saveModel();
    return isCorrect;
  }
}
