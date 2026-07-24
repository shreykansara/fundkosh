import Dexie, { Table } from 'dexie';
import { Entity, Liability, Transaction, SpeedBumpRule } from '../domain/models';

export class FundKoshDatabase extends Dexie {
  entities!: Table<Entity, string>;
  liabilities!: Table<Liability, string>;
  transactions!: Table<Transaction, string>;
  speed_bump_rules!: Table<SpeedBumpRule, string>;

  constructor() {
    super('FundKoshDB');
    this.version(2).stores({
      entities: 'id, &upi_id, type',
      liabilities: 'id, entity_id, is_active, due_in_days',
      transactions: 'id, sender_upi, receiver_upi, status, predicted_category, is_impulsive, timestamp',
      speed_bump_rules: 'id, name, isActive'
    });
  }
}

export const db = new FundKoshDatabase();

export const SEED_ENTITIES: Entity[] = [
  {
    id: 'usr_01',
    name: 'Aarav Sharma (Primary User)',
    type: 0,
    balance: 50000,
    upi_id: 'aarav@fundkosh',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'fam_01',
    name: 'Priya Sharma (Spouse)',
    type: 0,
    balance: 15000,
    upi_id: 'priya@fundkosh',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'fam_02',
    name: 'Rohan Sharma (Child)',
    type: 0,
    balance: 2500,
    upi_id: 'rohan@fundkosh',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'mer_01',
    name: 'FreshMart Supermarket',
    type: 1,
    balance: 120000,
    upi_id: 'freshmart@upi',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'mer_02',
    name: 'PowerGrid Electric Co',
    type: 1,
    balance: 500000,
    upi_id: 'powergrid@upi',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'mer_03',
    name: 'GigaTech Electronics Store',
    type: 1,
    balance: 350000,
    upi_id: 'gigatech@upi',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'mer_04',
    name: 'Vogue Apparel & Luxury',
    type: 1,
    balance: 200000,
    upi_id: 'vogue@upi',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'mer_05',
    name: 'The Royal Spice Gourmet',
    type: 1,
    balance: 95000,
    upi_id: 'royalspice@upi',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  },
  {
    id: 'fin_01',
    name: 'Hero FinCorp',
    type: 1,
    balance: 1000000,
    upi_id: 'herofincorp@upi',
    liabilities: [],
    vault: { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 }
  }
];

export const SEED_LIABILITIES: Liability[] = [
  {
    id: 'liab_01',
    entity_id: 'usr_01',
    title: 'Bike Loan EMI',
    amount: 1800,
    due_in_days: 3,
    is_active: true
  },
  {
    id: 'liab_02',
    entity_id: 'usr_01',
    title: 'Apartment Rent',
    amount: 12000,
    due_in_days: 5,
    is_active: true
  },
  {
    id: 'liab_03',
    entity_id: 'usr_01',
    title: 'Electricity Utility Bill',
    amount: 2500,
    due_in_days: 10,
    is_active: true
  }
];

export const DEFAULT_SPEED_BUMP_RULES: SpeedBumpRule[] = [
  {
    id: 'rule_high_risk_ml',
    name: 'Dynamic ML Impulsive Risk Threshold',
    description: 'Intercepts payments dynamically categorized as impulsive when on-device ML risk score exceeds threshold.',
    riskScoreThreshold: 45,
    cooldownPeriodSeconds: 10,
    isActive: true
  },
  {
    id: 'rule_high_value',
    name: 'High-Value Payment Guard',
    description: 'Requires intentional reflection for single transactions exceeding ₹2,000.',
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
  const entityCount = await db.entities.count();
  if (entityCount === 0) {
    console.log('Seeding FundKosh DB with initial entities, liabilities, and speed-bump rules...');
    await db.entities.bulkAdd(SEED_ENTITIES);
    await db.liabilities.bulkAdd(SEED_LIABILITIES);
    await db.speed_bump_rules.bulkAdd(DEFAULT_SPEED_BUMP_RULES);
  } else {
    // Ensure liabilities exist if upgrading from v1
    const liabCount = await db.liabilities.count();
    if (liabCount === 0) {
      await db.liabilities.bulkAdd(SEED_LIABILITIES);
    }
  }
}
