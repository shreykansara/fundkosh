import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Entity } from './models/Entity.js';
import { Transaction } from './models/Transaction.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fundkosh';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

const SEED_ENTITIES = [
  { 
    id: 'usr_01', 
    name: 'Ramesh Kumar', 
    type: 0, // 0 = user
    balance: 45000, 
    upi_id: 'rameshkumar@upi', 
    phone: '+91 98290 12345',
    liabilities: [
      { id: 'liab_01', title: 'Bike Loan EMI (Hero FinCorp)', amount: 1800, period_days: 30, last_paid_date: new Date(Date.now() - 27 * 24 * 3600 * 1000).toISOString().split('T')[0], is_active: true },
      { id: 'liab_02', title: 'Apartment Rent', amount: 12000, period_days: 30, last_paid_date: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString().split('T')[0], is_active: true },
      { id: 'liab_03', title: 'Electricity Utility Bill', amount: 2500, period_days: 30, last_paid_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString().split('T')[0], is_active: true }
    ],
    vault: {
      balance: 0,
      target_threshold: 100,
      total_swept: 0,
      flexi_rd_balance: 1450,
      interest_rate: 7.2,
      total_sweeps_count: 3
    }
  },
  { 
    id: 'usr_02', 
    name: 'Sunita Devi', 
    type: 0, // 0 = user
    balance: 15000, 
    upi_id: 'sunitadevi@upi', 
    phone: '+91 94140 54321',
    liabilities: [],
    vault: {
      balance: 0,
      target_threshold: 100,
      total_swept: 0,
      flexi_rd_balance: 0,
      interest_rate: 7.2,
      total_sweeps_count: 0
    }
  },
  { id: 'mer_01', name: 'Balaji Stores (Grocery)', type: 1, balance: 120000, upi_id: 'balajistores@upi', phone: '+91 98870 99887', liabilities: [] },
  { id: 'mer_02', name: 'Khurana Oil Co. (Petrol Pump)', type: 1, balance: 500000, upi_id: 'khuranaoil@upi', phone: '+91 94600 11223', liabilities: [] },
  { id: 'mer_03', name: 'Pink City Sabji Bhandar', type: 1, balance: 5000, upi_id: 'pinkcitysabji@upi', phone: '+91 99280 44556', liabilities: [] },
  { id: 'mer_04', name: 'Rawat Pyaaz Kachori Shop', type: 1, balance: 35000, upi_id: 'rawatkachori@upi', phone: '+91 98280 77889', liabilities: [] },
  { id: 'mer_05', name: 'Sahu Tea Stall', type: 1, balance: 12000, upi_id: 'sahuteastall@upi', phone: '+91 94130 99001', liabilities: [] },
  { id: 'gig_01', name: 'Zomato Partner Payouts', type: 1, balance: 850000, upi_id: 'zomatogig@upi', phone: '+91 80030 11122', liabilities: [] },
  { id: 'gig_02', name: 'Swiggy Direct Earnings', type: 1, balance: 920000, upi_id: 'swiggygig@upi', phone: '+91 80030 33344', liabilities: [] },
  { id: 'fin_01', name: 'Hero FinCorp (Bike EMI)', type: 1, balance: 1500000, upi_id: 'herofincorp@upi', phone: '+91 80030 55566', liabilities: [] }
];

function generateSeedTransactionsAndVault(baseDate) {
  const txs = [];
  const now = baseDate || new Date(Date.now() - 24 * 3600 * 1000);
  
  const makeId = (prefix) => `${prefix}_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).substring(2, 7)}`;

  const ramesh = { upi: 'rameshkumar@upi', id: 'usr_01' };
  const sunita = { upi: 'sunitadevi@upi', id: 'usr_02' };
  
  let vaultBalance = 0;
  let totalSwept = 0;
  let flexiRdBalance = 1450;
  let sweepsCount = 3;
  
  for (let day = 30; day >= 0; day--) {
    const date = new Date(now.getTime() - day * 24 * 3600 * 1000);
    date.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
    const timestampStr = date.toISOString();

    // 1. Weekly Income Payouts (every 7 days)
    if (day % 7 === 0 && day > 0) {
      txs.push({
        id: makeId('tx_inc_z'),
        sender_upi: 'zomatogig@upi',
        receiver_upi: ramesh.upi,
        amount: 6000 + Math.floor(Math.random() * 2000),
        round_up_amount: 0,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: timestampStr,
        createdAt: date
      });

      const swiggyTime = new Date(date.getTime() + 2 * 3600 * 1000);
      txs.push({
        id: makeId('tx_inc_s'),
        sender_upi: 'swiggygig@upi',
        receiver_upi: ramesh.upi,
        amount: 4500 + Math.floor(Math.random() * 1500),
        round_up_amount: 0,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: swiggyTime.toISOString(),
        createdAt: swiggyTime
      });
    }

    // Sunita's monthly allowance from Ramesh (on day 25 and day 10)
    if (day === 25 || day === 10) {
      txs.push({
        id: makeId('tx_allow'),
        sender_upi: ramesh.upi,
        receiver_upi: sunita.upi,
        amount: 4000,
        round_up_amount: 0,
        note: 'other',
        predicted_category: 'transfers',
        is_impulsive: false,
        risk_score: 5,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: timestampStr,
        createdAt: date
      });
    }

    // 2. Fixed Bills (EMI on day 27, Rent on day 25, Electricity on day 20)
    if (day === 27) {
      txs.push({
        id: makeId('tx_emi'),
        sender_upi: ramesh.upi,
        receiver_upi: 'herofincorp@upi',
        amount: 1800,
        round_up_amount: 0,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: timestampStr,
        createdAt: date
      });
    }
    if (day === 25) {
      const rentTime = new Date(date.getTime() + 4 * 3600 * 1000);
      txs.push({
        id: makeId('tx_rent'),
        sender_upi: ramesh.upi,
        receiver_upi: 'balajistores@upi',
        amount: 12000,
        round_up_amount: 0,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: rentTime.toISOString(),
        createdAt: rentTime
      });
    }
    if (day === 20) {
      txs.push({
        id: makeId('tx_elec'),
        sender_upi: ramesh.upi,
        receiver_upi: 'balajistores@upi',
        amount: 2150,
        round_up_amount: 0,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: timestampStr,
        createdAt: date
      });
    }

    // 3. Regular daily expenses for Ramesh
    if (day % 3 === 0) {
      const fuelAmount = 180 + Math.floor(Math.random() * 150);
      const nextMultipleOf10 = Math.ceil(fuelAmount / 10) * 10;
      const roundUp = nextMultipleOf10 > fuelAmount ? nextMultipleOf10 - fuelAmount : 0;
      txs.push({
        id: makeId('tx_fuel'),
        sender_upi: ramesh.upi,
        receiver_upi: 'khuranaoil@upi',
        amount: fuelAmount,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: timestampStr,
        createdAt: date
      });
    }
    if (day % 5 === 0) {
      const grocAmt = 600 + Math.floor(Math.random() * 800);
      const nextMultipleOf10 = Math.ceil(grocAmt / 10) * 10;
      const roundUp = nextMultipleOf10 > grocAmt ? nextMultipleOf10 - grocAmt : 0;
      const grocTime = new Date(date.getTime() + 3 * 3600 * 1000);
      txs.push({
        id: makeId('tx_groc'),
        sender_upi: ramesh.upi,
        receiver_upi: 'balajistores@upi',
        amount: grocAmt,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: grocTime.toISOString(),
        createdAt: grocTime
      });
    }
    if (day % 2 === 0) {
      const vegAmt = 120 + Math.floor(Math.random() * 120);
      const nextMultipleOf10 = Math.ceil(vegAmt / 10) * 10;
      const roundUp = nextMultipleOf10 > vegAmt ? nextMultipleOf10 - vegAmt : 0;
      const vegTime = new Date(date.getTime() + 1 * 3600 * 1000);
      txs.push({
        id: makeId('tx_veg'),
        sender_upi: ramesh.upi,
        receiver_upi: 'pinkcitysabji@upi',
        amount: vegAmt,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: vegTime.toISOString(),
        createdAt: vegTime
      });
    }
    if (Math.random() > 0.15) {
      const teaAmt = 25 + Math.floor(Math.random() * 30);
      const nextMultipleOf10 = Math.ceil(teaAmt / 10) * 10;
      const roundUp = nextMultipleOf10 > teaAmt ? nextMultipleOf10 - teaAmt : 0;
      const teaTime = new Date(date.getTime() - 4 * 3600 * 1000);
      txs.push({
        id: makeId('tx_tea'),
        sender_upi: ramesh.upi,
        receiver_upi: 'sahuteastall@upi',
        amount: teaAmt,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: teaTime.toISOString(),
        createdAt: teaTime
      });
    }

    // 4. Regular expenses for Sunita Devi
    if (day % 4 === 1) {
      const grocAmt = 400 + Math.floor(Math.random() * 500);
      const nextMultipleOf10 = Math.ceil(grocAmt / 10) * 10;
      const roundUp = nextMultipleOf10 > grocAmt ? nextMultipleOf10 - grocAmt : 0;
      const grocTime = new Date(date.getTime() - 2 * 3600 * 1000);
      txs.push({
        id: makeId('tx_groc_s'),
        sender_upi: sunita.upi,
        receiver_upi: 'balajistores@upi',
        amount: grocAmt,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: grocTime.toISOString(),
        createdAt: grocTime
      });
    }
    if (day % 3 === 1) {
      const vegAmt = 100 + Math.floor(Math.random() * 150);
      const nextMultipleOf10 = Math.ceil(vegAmt / 10) * 10;
      const roundUp = nextMultipleOf10 > vegAmt ? nextMultipleOf10 - vegAmt : 0;
      const vegTime = new Date(date.getTime() + 5 * 3600 * 1000);
      txs.push({
        id: makeId('tx_veg_s'),
        sender_upi: sunita.upi,
        receiver_upi: 'pinkcitysabji@upi',
        amount: vegAmt,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: vegTime.toISOString(),
        createdAt: vegTime
      });
    }
    if (day % 2 === 1) {
      const teaAmt = 20 + Math.floor(Math.random() * 20);
      const nextMultipleOf10 = Math.ceil(teaAmt / 10) * 10;
      const roundUp = nextMultipleOf10 > teaAmt ? nextMultipleOf10 - teaAmt : 0;
      const teaTime = new Date(date.getTime() + 6 * 3600 * 1000);
      txs.push({
        id: makeId('tx_tea_s'),
        sender_upi: sunita.upi,
        receiver_upi: 'sahuteastall@upi',
        amount: teaAmt,
        round_up_amount: roundUp,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: teaTime.toISOString(),
        createdAt: teaTime
      });
    }
    
    // Sunita's Independent Gig Payouts (days 8 and 22)
    if (day === 8 || day === 22) {
      const payoutAmt = 3200 + Math.floor(Math.random() * 800);
      txs.push({
        id: makeId('tx_inc_sunita'),
        sender_upi: 'swiggygig@upi',
        receiver_upi: sunita.upi,
        amount: payoutAmt,
        round_up_amount: 0,
        note: 'essential',
        predicted_category: 'essential',
        is_impulsive: false,
        risk_score: 0,
        theme_state: 'GREEN',
        status: 'COMPLETED',
        timestamp: timestampStr,
        createdAt: date
      });
    }

    // 5. Impulsive spendings and "Crossing limits"
    // Ramesh's impulsive spends:
    if (day === 26) {
      const impTime = new Date(date.getTime() + 5 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_r1'),
        sender_upi: ramesh.upi,
        receiver_upi: 'rawatkachori@upi',
        amount: 150,
        round_up_amount: 10,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 45,
        theme_state: 'AMBER',
        status: 'COMPLETED',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }
    if (day === 22) {
      const impTime = new Date(date.getTime() + 6 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_r2'),
        sender_upi: ramesh.upi,
        receiver_upi: 'rawatkachori@upi',
        amount: 800,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 80,
        theme_state: 'RED',
        status: 'COMPLETED',
        speed_bump_reason: 'Amount exceeds daily spendable limit (₹223) | Dynamic ML Impulsive Risk Threshold exceeded',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }
    if (day === 18) {
      const impTime = new Date(date.getTime() + 4 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_r3'),
        sender_upi: ramesh.upi,
        receiver_upi: 'balajistores@upi',
        amount: 2500,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 80,
        theme_state: 'RED',
        status: 'COMPLETED',
        speed_bump_reason: 'Amount exceeds single-transaction threshold (₹2,000) | Impulse risk score exceeded threshold',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }
    if (day === 15) {
      const impTime1 = new Date(date.getTime() + 2 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_r4a'),
        sender_upi: ramesh.upi,
        receiver_upi: 'balajistores@upi',
        amount: 3800,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 80,
        theme_state: 'RED',
        status: 'COMPLETED',
        speed_bump_reason: 'Amount exceeds single-transaction threshold (₹2,000) | Impulse risk score exceeded threshold',
        timestamp: impTime1.toISOString(),
        createdAt: impTime1
      });

      const impTime2 = new Date(date.getTime() + 5 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_r4b'),
        sender_upi: ramesh.upi,
        receiver_upi: 'rawatkachori@upi',
        amount: 2200,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 100,
        theme_state: 'RED',
        status: 'BLOCKED',
        speed_bump_reason: 'Cancelled by user during Speed-Bump reflection: Exceeds daily cumulative velocity guard limit (₹5,000)',
        timestamp: impTime2.toISOString(),
        createdAt: impTime2
      });
    }
    if (day === 8) {
      const impTime = new Date(date.getTime() + 4 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_r5'),
        sender_upi: ramesh.upi,
        receiver_upi: 'balajistores@upi',
        amount: 8500,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 100,
        theme_state: 'RED',
        status: 'BLOCKED',
        speed_bump_reason: 'Cancelled by user during Speed-Bump reflection: Exceeds single-transaction threshold (₹2,000)',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }

    // Sunita's impulsive spends:
    if (day === 24) {
      const impTime = new Date(date.getTime() + 3 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_s1'),
        sender_upi: sunita.upi,
        receiver_upi: 'balajistores@upi',
        amount: 1200,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 80,
        theme_state: 'RED',
        status: 'COMPLETED',
        speed_bump_reason: 'Amount exceeds daily spendable limit (₹767) | Dynamic ML Impulsive Risk Threshold exceeded',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }
    if (day === 14) {
      const impTime = new Date(date.getTime() + 4 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_s2'),
        sender_upi: sunita.upi,
        receiver_upi: 'rawatkachori@upi',
        amount: 1800,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 80,
        theme_state: 'RED',
        status: 'COMPLETED',
        speed_bump_reason: 'Amount exceeds daily spendable limit (₹767) | Dynamic ML Impulsive Risk Threshold exceeded',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }
    if (day === 10) {
      const impTime = new Date(date.getTime() + 5 * 3600 * 1000);
      txs.push({
        id: makeId('tx_imp_s3'),
        sender_upi: sunita.upi,
        receiver_upi: 'balajistores@upi',
        amount: 5500,
        round_up_amount: 0,
        note: 'impulsive',
        predicted_category: 'impulsive',
        is_impulsive: true,
        risk_score: 100,
        theme_state: 'RED',
        status: 'BLOCKED',
        speed_bump_reason: 'Cancelled by user during Speed-Bump reflection: Exceeds single-transaction threshold (₹2,000) | Exceeds daily budget limit (₹5,000)',
        timestamp: impTime.toISOString(),
        createdAt: impTime
      });
    }
  }

  // Calculate dynamic vault values based on Ramesh's transactions
  txs.forEach(tx => {
    if (tx.sender_upi === ramesh.upi && tx.status === 'COMPLETED' && tx.round_up_amount > 0) {
      vaultBalance += tx.round_up_amount;
      if (vaultBalance >= 100) {
        flexiRdBalance += vaultBalance;
        totalSwept += vaultBalance;
        sweepsCount += 1;
        vaultBalance = 0;
      }
    }
  });

  // Map to the new schema: remove round_up_amount, predicted_category, is_impulsive, theme_state
  const cleanedTxs = txs.map(tx => ({
    id: tx.id,
    sender_upi: tx.sender_upi,
    receiver_upi: tx.receiver_upi,
    amount: tx.amount,
    note: tx.note,
    risk_score: tx.risk_score,
    status: tx.status,
    speed_bump_reason: tx.speed_bump_reason,
    timestamp: tx.timestamp
  }));

  cleanedTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    transactions: cleanedTxs,
    vault: {
      balance: vaultBalance,
      target_threshold: 100,
      total_swept: totalSwept,
      flexi_rd_balance: flexiRdBalance,
      interest_rate: 7.2,
      total_sweeps_count: sweepsCount
    }
  };
}

function getSeededData() {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 1); // Preceding date as of the moment it is reseeded
  
  const initialData = generateSeedTransactionsAndVault(baseDate);
  const seeded = SEED_ENTITIES.map(ent => {
    const cloned = JSON.parse(JSON.stringify(ent));
    if (cloned.id === 'usr_01') {
      cloned.vault = initialData.vault;
      cloned.liabilities = [
        { id: 'liab_01', title: 'Bike Loan EMI (Hero FinCorp)', amount: 1800, period_days: 30, last_paid_date: new Date(baseDate.getTime() - 27 * 24 * 3600 * 1000).toISOString().split('T')[0], is_active: true },
        { id: 'liab_02', title: 'Apartment Rent', amount: 12000, period_days: 30, last_paid_date: new Date(baseDate.getTime() - 25 * 24 * 3600 * 1000).toISOString().split('T')[0], is_active: true },
        { id: 'liab_03', title: 'Electricity Utility Bill', amount: 2500, period_days: 30, last_paid_date: new Date(baseDate.getTime() - 20 * 24 * 3600 * 1000).toISOString().split('T')[0], is_active: true }
      ];
    }
    return cloned;
  });
  return {
    entities: seeded,
    transactions: initialData.transactions
  };
}

const initialData = getSeededData();

// Fallback in-memory DB if MongoDB is offline
const memoryStore = {
  entities: initialData.entities,
  transactions: initialData.transactions
};

async function initMongo() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB at:', MONGODB_URI);
    await seedDatabaseIfEmpty();
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB not available locally, running Express API with In-Memory Mock Store.');
  }
}

async function seedDatabaseIfEmpty() {
  if (!isMongoConnected) return;
  const count = await Entity.countDocuments();
  if (count === 0) {
    console.log('Seeding MongoDB with initial FundKosh dataset...');
    const data = getSeededData();
    await Entity.insertMany(data.entities);
    await Transaction.insertMany(data.transactions);
  }
}

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoConnected: isMongoConnected });
});

app.get('/api/entities', async (req, res) => {
  if (isMongoConnected) {
    const entities = await Entity.find();
    return res.json(entities);
  }
  res.json(memoryStore.entities);
});

app.post('/api/entities/create', async (req, res) => {
  const { name, phone, balance, upi_id, type, liabilities, vault } = req.body;
  const newEntity = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name,
    type: type !== undefined ? Number(type) : 0, // 0 = user, 1 = merchant
    balance: balance || 0,
    upi_id,
    phone,
    liabilities: liabilities || [],
    vault: vault || {
      balance: 0,
      target_threshold: 100,
      total_swept: 0,
      flexi_rd_balance: 0,
      interest_rate: 7.2,
      total_sweeps_count: 0
    }
  };

  if (isMongoConnected) {
    const created = await Entity.create(newEntity);
    return res.json(created);
  }
  memoryStore.entities.push(newEntity);
  res.json(newEntity);
});

app.get('/api/liabilities', async (req, res) => {
  const list = [];
  if (isMongoConnected) {
    const users = await Entity.find({ type: 0 });
    for (const u of users) {
      if (u.liabilities) {
        for (const l of u.liabilities) {
          const lastPaid = new Date(l.last_paid_date);
          const diffTime = Math.abs(Date.now() - lastPaid.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const dueInDays = Math.max(0, l.period_days - diffDays);
          list.push({
            id: l.id,
            entity_id: u.id,
            title: l.title,
            amount: l.amount,
            due_in_days: dueInDays,
            is_active: l.is_active,
            period_days: l.period_days,
            last_paid_date: l.last_paid_date
          });
        }
      }
    }
    return res.json(list);
  }
  
  // Memory fallback
  const users = memoryStore.entities.filter(e => e.type === 0);
  for (const u of users) {
    if (u.liabilities) {
      for (const l of u.liabilities) {
        const lastPaid = new Date(l.last_paid_date);
        const diffTime = Math.abs(Date.now() - lastPaid.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dueInDays = Math.max(0, l.period_days - diffDays);
        list.push({
          id: l.id,
          entity_id: u.id,
          title: l.title,
          amount: l.amount,
          due_in_days: dueInDays,
          is_active: l.is_active,
          period_days: l.period_days,
          last_paid_date: l.last_paid_date
        });
      }
    }
  }
  res.json(list);
});

app.post('/api/liabilities/pay', async (req, res) => {
  const { senderUpi, liabilityId } = req.body;
  if (isMongoConnected) {
    const user = await Entity.findOne({ upi_id: senderUpi });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.liabilities) {
      const liab = user.liabilities.find(l => l.id === liabilityId);
      if (liab) {
        liab.last_paid_date = new Date().toISOString().split('T')[0];
        user.markModified('liabilities');
        await user.save();
        return res.json({ success: true, user });
      }
    }
    return res.status(404).json({ error: 'Liability not found' });
  }

  // Memory fallback
  const user = memoryStore.entities.find(e => e.upi_id === senderUpi);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.liabilities) {
    const liab = user.liabilities.find(l => l.id === liabilityId);
    if (liab) {
      liab.last_paid_date = new Date().toISOString().split('T')[0];
      return res.json({ success: true, user });
    }
  }
  return res.status(404).json({ error: 'Liability not found' });
});

app.get('/api/transactions', async (req, res) => {
  if (isMongoConnected) {
    const txs = await Transaction.find();
    // Sort transactions reverse-chronologically in memory by timestamp
    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return res.json(txs);
  }
  res.json([...memoryStore.transactions].reverse());
});

app.get('/api/vault', async (req, res) => {
  const upi = req.query.upi;
  if (isMongoConnected) {
    const user = await Entity.findOne({ upi_id: upi || 'rameshkumar@upi' });
    return res.json(user?.vault || { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 });
  }
  const user = memoryStore.entities.find(e => e.upi_id === (upi || 'rameshkumar@upi'));
  res.json(user?.vault || { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 });
});

app.post('/api/seed', async (req, res) => {
  const data = getSeededData();

  if (isMongoConnected) {
    await Entity.deleteMany({});
    await Transaction.deleteMany({});

    await Entity.insertMany(data.entities);
    await Transaction.insertMany(data.transactions);
  } else {
    memoryStore.entities = data.entities;
    memoryStore.transactions = data.transactions;
  }
  res.json({ message: 'Database seeded successfully!' });
});

app.post('/api/payment/create-transaction', async (req, res) => {
  const txData = req.body;
  // Strip off unneeded fields if client sent them
  const cleaned = {
    id: txData.id,
    sender_upi: txData.sender_upi,
    receiver_upi: txData.receiver_upi,
    amount: txData.amount,
    note: txData.note,
    risk_score: txData.risk_score || 0,
    status: txData.status || 'PENDING',
    speed_bump_reason: txData.speed_bump_reason,
    timestamp: txData.timestamp || new Date().toISOString()
  };

  if (isMongoConnected) {
    const created = await Transaction.create(cleaned);
    return res.json(created);
  }
  memoryStore.transactions.push(cleaned);
  res.json(cleaned);
});

app.post('/api/payment/update-status', async (req, res) => {
  const { id, status, speedBumpReason } = req.body;
  if (isMongoConnected) {
    const tx = await Transaction.findOneAndUpdate(
      { id },
      { status, speed_bump_reason: speedBumpReason },
      { new: true }
    );
    return res.json(tx);
  }
  const tx = memoryStore.transactions.find(t => t.id === id);
  if (tx) {
    tx.status = status;
    if (speedBumpReason) tx.speed_bump_reason = speedBumpReason;
  }
  res.json(tx);
});

app.post('/api/payment/transfer', async (req, res) => {
  const { senderUpi, receiverUpi, amount, roundUpAmount = 0 } = req.body;
  
  if (isMongoConnected) {
    const sender = await Entity.findOne({ upi_id: senderUpi });
    const receiver = await Entity.findOne({ upi_id: receiverUpi });
    if (!sender || !receiver) return res.status(404).json({ error: 'Account not found' });

    const totalDeduction = amount + roundUpAmount;
    if (sender.balance < totalDeduction) return res.status(400).json({ error: 'Insufficient funds' });

    sender.balance -= totalDeduction;
    receiver.balance += amount;

    let swept = false;
    if (roundUpAmount > 0) {
      if (!sender.vault) {
        sender.vault = { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 };
      }
      sender.vault.balance += roundUpAmount;
      if (sender.vault.balance >= sender.vault.target_threshold) {
        sender.vault.flexi_rd_balance += sender.vault.balance;
        sender.vault.total_swept += sender.vault.balance;
        sender.vault.total_sweeps_count += 1;
        sender.vault.balance = 0;
        swept = true;
      }
    }
    sender.markModified('vault');
    await sender.save();
    await receiver.save();

    return res.json({ senderNewBalance: sender.balance, receiverNewBalance: receiver.balance, vault: sender.vault, swept });
  }

  // Memory fallback
  const sender = memoryStore.entities.find(e => e.upi_id === senderUpi);
  const receiver = memoryStore.entities.find(e => e.upi_id === receiverUpi);
  if (!sender || !receiver) return res.status(404).json({ error: 'Account not found' });

  const totalDeduction = amount + roundUpAmount;
  if (sender.balance < totalDeduction) return res.status(400).json({ error: 'Insufficient funds' });

  sender.balance -= totalDeduction;
  receiver.balance += amount;

  let swept = false;
  if (roundUpAmount > 0) {
    if (!sender.vault) {
      sender.vault = { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 };
    }
    sender.vault.balance += roundUpAmount;
    if (sender.vault.balance >= sender.vault.target_threshold) {
      sender.vault.flexi_rd_balance += sender.vault.balance;
      sender.vault.total_swept += sender.vault.balance;
      sender.vault.total_sweeps_count += 1;
      sender.vault.balance = 0;
      swept = true;
    }
  }
  res.json({ senderNewBalance: sender.balance, receiverNewBalance: receiver.balance, vault: sender.vault, swept });
});

app.post('/api/vault/update-threshold', async (req, res) => {
  const { upi, targetThreshold } = req.body;
  const userUpi = upi || 'rameshkumar@upi';
  if (isMongoConnected) {
    const user = await Entity.findOne({ upi_id: userUpi });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.vault) {
      user.vault = { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 };
    }
    user.vault.target_threshold = targetThreshold;
    user.markModified('vault');
    await user.save();
    return res.json(user.vault);
  }
  const user = memoryStore.entities.find(e => e.upi_id === userUpi);
  if (user) {
    if (!user.vault) {
      user.vault = { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 };
    }
    user.vault.target_threshold = targetThreshold;
  }
  res.json(user?.vault || {});
});

app.post('/api/vault/manual-sweep', async (req, res) => {
  const { upi } = req.body;
  const userUpi = upi || 'rameshkumar@upi';
  if (isMongoConnected) {
    const user = await Entity.findOne({ upi_id: userUpi });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.vault) {
      user.vault = { balance: 0, target_threshold: 100, total_swept: 0, flexi_rd_balance: 0, interest_rate: 7.2, total_sweeps_count: 0 };
    }
    if (user.vault.balance > 0) {
      user.vault.flexi_rd_balance += user.vault.balance;
      user.vault.total_swept += user.vault.balance;
      user.vault.total_sweeps_count += 1;
      user.vault.balance = 0;
      user.markModified('vault');
      await user.save();
    }
    return res.json(user.vault);
  }
  const user = memoryStore.entities.find(e => e.upi_id === userUpi);
  if (user && user.vault && user.vault.balance > 0) {
    user.vault.flexi_rd_balance += user.vault.balance;
    user.vault.total_swept += user.vault.balance;
    user.vault.total_sweeps_count += 1;
    user.vault.balance = 0;
  }
  res.json(user?.vault || {});
});

app.listen(PORT, () => {
  console.log(`🚀 FundKosh Express API Server running on http://localhost:${PORT}`);
  initMongo();
});
