import Dexie, { Table } from 'dexie';
import { Entity, Transaction, SpeedBumpRule } from '../domain/models';

export class FundKoshDatabase extends Dexie {
  entities!: Table<Entity, string>;
  transactions!: Table<Transaction, string>;
  speed_bump_rules!: Table<SpeedBumpRule, string>;

  constructor() {
    super('FundKoshDB');
    this.version(1).stores({
      entities: 'id, &upi_id, type, category',
      transactions: 'id, sender_upi, receiver_upi, status, category, timestamp',
      speed_bump_rules: 'id, name, isActive'
    });
  }
}

export const db = new FundKoshDatabase();

export const SEED_ENTITIES: Entity[] = [
  {
    id: 'usr_01',
    name: 'Aarav Sharma (Primary User)',
    type: 'user',
    category: 'primary',
    balance: 50000,
    upi_id: 'aarav@fundkosh'
  },
  {
    id: 'fam_01',
    name: 'Priya Sharma (Spouse)',
    type: 'family',
    category: 'household',
    balance: 15000,
    upi_id: 'priya@fundkosh'
  },
  {
    id: 'fam_02',
    name: 'Rohan Sharma (Child)',
    type: 'family',
    category: 'household',
    balance: 2500,
    upi_id: 'rohan@fundkosh'
  },
  {
    id: 'mer_01',
    name: 'FreshMart Supermarket',
    type: 'merchant',
    category: 'essential',
    balance: 120000,
    upi_id: 'freshmart@upi'
  },
  {
    id: 'mer_02',
    name: 'PowerGrid Electric Co',
    type: 'merchant',
    category: 'essential',
    balance: 500000,
    upi_id: 'powergrid@upi'
  },
  {
    id: 'mer_03',
    name: 'GigaTech Electronics Store',
    type: 'merchant',
    category: 'impulsive',
    balance: 350000,
    upi_id: 'gigatech@upi'
  },
  {
    id: 'mer_04',
    name: 'Vogue Apparel & Luxury',
    type: 'merchant',
    category: 'impulsive',
    balance: 200000,
    upi_id: 'vogue@upi'
  },
  {
    id: 'mer_05',
    name: 'The Royal Spice Gourmet',
    type: 'merchant',
    category: 'impulsive',
    balance: 95000,
    upi_id: 'royalspice@upi'
  }
];

export const DEFAULT_SPEED_BUMP_RULES: SpeedBumpRule[] = [
  {
    id: 'rule_impulsive_cat',
    name: 'Impulsive Category Speed-Bump',
    description: 'Intercepts payments made to impulsive categories (e.g., luxury electronics, fine dining, fast fashion).',
    flaggedCategories: ['impulsive'],
    cooldownPeriodSeconds: 10,
    isActive: true
  },
  {
    id: 'rule_high_value',
    name: 'High-Value Payment Threshold',
    description: 'Requires intentional reflection for transactions exceeding ₹2,000.',
    maxAmountThreshold: 2000,
    cooldownPeriodSeconds: 5,
    isActive: true
  },
  {
    id: 'rule_daily_limit',
    name: 'Daily Cumulative Velocity Guard',
    description: 'Intercepts payments when daily aggregate impulsive spending exceeds ₹5,000.',
    dailySpendLimit: 5000,
    cooldownPeriodSeconds: 15,
    isActive: true
  }
];

export async function initializeDatabaseSeed(): Promise<void> {
  const count = await db.entities.count();
  if (count === 0) {
    console.log('Seeding FundKosh DB with initial 8 entities and speed-bump rules...');
    await db.entities.bulkAdd(SEED_ENTITIES);
    await db.speed_bump_rules.bulkAdd(DEFAULT_SPEED_BUMP_RULES);
  }
}
