import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Entity } from './models/Entity.js';
import { Liability } from './models/Liability.js';
import { Transaction } from './models/Transaction.js';
import { Vault } from './models/Vault.js';
import { SpeedBumpRule } from './models/SpeedBumpRule.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fundkosh';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

const SEED_ENTITIES = [
  { id: 'usr_01', name: 'Ramesh Kumar', type: 'user', balance: 45000, upi_id: 'rameshkumar@upi', phone: '+91 98290 12345' },
  { id: 'usr_02', name: 'Sunita Devi', type: 'family', balance: 15000, upi_id: 'sunitadevi@upi', phone: '+91 94140 54321' },
  { id: 'mer_01', name: 'Balaji Stores (Grocery)', type: 'merchant', balance: 120000, upi_id: 'balajistores@upi', phone: '+91 98870 99887' },
  { id: 'mer_02', name: 'Khurana Oil Co. (Petrol Pump)', type: 'merchant', balance: 500000, upi_id: 'khuranaoil@upi', phone: '+91 94600 11223' },
  { id: 'mer_03', name: 'Pink City Sabji Bhandar', type: 'merchant', balance: 5000, upi_id: 'pinkcitysabji@upi', phone: '+91 99280 44556' },
  { id: 'mer_04', name: 'Rawat Pyaaz Kachori Shop', type: 'merchant', balance: 35000, upi_id: 'rawatkachori@upi', phone: '+91 98280 77889' },
  { id: 'mer_05', name: 'Sahu Tea Stall', type: 'merchant', balance: 12000, upi_id: 'sahuteastall@upi', phone: '+91 94130 99001' },
  { id: 'gig_01', name: 'Zomato Partner Payouts', type: 'gig_platform', balance: 850000, upi_id: 'zomatogig@upi', phone: '+91 80030 11122' },
  { id: 'gig_02', name: 'Swiggy Direct Earnings', type: 'gig_platform', balance: 920000, upi_id: 'swiggygig@upi', phone: '+91 80030 33344' },
  { id: 'fin_01', name: 'Hero FinCorp (Bike EMI)', type: 'financial_institution', balance: 1500000, upi_id: 'herofincorp@upi', phone: '+91 80030 55566' }
];

const SEED_LIABILITIES = [
  { id: 'liab_01', entity_id: 'usr_01', title: 'Bike Loan EMI (Hero FinCorp)', amount: 1800, due_in_days: 3, is_active: true },
  { id: 'liab_02', entity_id: 'usr_01', title: 'Apartment Rent', amount: 12000, due_in_days: 5, is_active: true },
  { id: 'liab_03', entity_id: 'usr_01', title: 'Electricity Utility Bill', amount: 2500, due_in_days: 10, is_active: true }
];

const SEED_RULES = [
  { id: 'rule_high_risk_ml', name: 'Dynamic Impulse Vulnerability Rule', description: 'Intercepts impulsive spending when temporal risk state or impulse risk score is high.', riskScoreThreshold: 45, cooldownPeriodSeconds: 10, isActive: true },
  { id: 'rule_high_value', name: 'High-Value Payment Guard', description: 'Requires intentional reflection for single transactions exceeding ₹2,000.', maxAmountThreshold: 2000, cooldownPeriodSeconds: 5, isActive: true },
  { id: 'rule_daily_limit', name: 'Daily Budget Exceeded Guard', description: 'Intercepts payments when daily aggregate impulsive spending exceeds limit.', dailySpendLimit: 5000, cooldownPeriodSeconds: 15, isActive: true }
];

// Fallback in-memory DB if MongoDB is offline
const memoryStore = {
  entities: [...SEED_ENTITIES],
  liabilities: [...SEED_LIABILITIES],
  transactions: [],
  rules: [...SEED_RULES],
  vault: { balance: 42, target_threshold: 100, total_swept: 200, flexi_rd_balance: 1450, interest_rate: 7.2, total_sweeps_count: 3 }
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
    await Entity.insertMany(SEED_ENTITIES);
    await Liability.insertMany(SEED_LIABILITIES);
    await SpeedBumpRule.insertMany(SEED_RULES);
    await Vault.create(memoryStore.vault);
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

app.get('/api/liabilities', async (req, res) => {
  if (isMongoConnected) {
    const liabilities = await Liability.find();
    return res.json(liabilities);
  }
  res.json(memoryStore.liabilities);
});

app.get('/api/transactions', async (req, res) => {
  if (isMongoConnected) {
    const txs = await Transaction.find().sort({ createdAt: -1 });
    return res.json(txs);
  }
  res.json([...memoryStore.transactions].reverse());
});

app.get('/api/vault', async (req, res) => {
  if (isMongoConnected) {
    let vault = await Vault.findOne();
    if (!vault) {
      vault = await Vault.create(memoryStore.vault);
    }
    return res.json(vault);
  }
  res.json(memoryStore.vault);
});

app.get('/api/rules', async (req, res) => {
  if (isMongoConnected) {
    const rules = await SpeedBumpRule.find();
    return res.json(rules);
  }
  res.json(memoryStore.rules);
});

app.post('/api/seed', async (req, res) => {
  if (isMongoConnected) {
    await Entity.deleteMany({});
    await Liability.deleteMany({});
    await SpeedBumpRule.deleteMany({});
    await Vault.deleteMany({});
    await Transaction.deleteMany({});

    await Entity.insertMany(SEED_ENTITIES);
    await Liability.insertMany(SEED_LIABILITIES);
    await SpeedBumpRule.insertMany(SEED_RULES);
    await Vault.create(memoryStore.vault);
  } else {
    memoryStore.entities = [...SEED_ENTITIES];
    memoryStore.liabilities = [...SEED_LIABILITIES];
    memoryStore.rules = [...SEED_RULES];
    memoryStore.transactions = [];
    memoryStore.vault = { balance: 42, target_threshold: 100, total_swept: 200, flexi_rd_balance: 1450, interest_rate: 7.2, total_sweeps_count: 3 };
  }
  res.json({ message: 'Database seeded successfully!' });
});

app.post('/api/payment/create-transaction', async (req, res) => {
  const txData = req.body;
  if (isMongoConnected) {
    const created = await Transaction.create(txData);
    return res.json(created);
  }
  memoryStore.transactions.push(txData);
  res.json(txData);
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
    await sender.save();
    await receiver.save();

    if (roundUpAmount > 0) {
      let vault = await Vault.findOne();
      if (!vault) vault = await Vault.create(memoryStore.vault);
      vault.balance += roundUpAmount;

      // Auto-sweep check
      let swept = false;
      if (vault.balance >= vault.target_threshold) {
        vault.flexi_rd_balance += vault.balance;
        vault.total_swept += vault.balance;
        vault.total_sweeps_count += 1;
        vault.balance = 0;
        swept = true;
      }
      await vault.save();
      return res.json({ senderNewBalance: sender.balance, receiverNewBalance: receiver.balance, vault, swept });
    }
    return res.json({ senderNewBalance: sender.balance, receiverNewBalance: receiver.balance });
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
    memoryStore.vault.balance += roundUpAmount;
    if (memoryStore.vault.balance >= memoryStore.vault.target_threshold) {
      memoryStore.vault.flexi_rd_balance += memoryStore.vault.balance;
      memoryStore.vault.total_swept += memoryStore.vault.balance;
      memoryStore.vault.total_sweeps_count += 1;
      memoryStore.vault.balance = 0;
      swept = true;
    }
  }
  res.json({ senderNewBalance: sender.balance, receiverNewBalance: receiver.balance, vault: memoryStore.vault, swept });
});

app.post('/api/vault/update-threshold', async (req, res) => {
  const { targetThreshold } = req.body;
  if (isMongoConnected) {
    let vault = await Vault.findOne();
    if (!vault) vault = await Vault.create(memoryStore.vault);
    vault.target_threshold = targetThreshold;
    await vault.save();
    return res.json(vault);
  }
  memoryStore.vault.target_threshold = targetThreshold;
  res.json(memoryStore.vault);
});

app.post('/api/vault/manual-sweep', async (req, res) => {
  if (isMongoConnected) {
    let vault = await Vault.findOne();
    if (!vault) vault = await Vault.create(memoryStore.vault);
    if (vault.balance > 0) {
      vault.flexi_rd_balance += vault.balance;
      vault.total_swept += vault.balance;
      vault.total_sweeps_count += 1;
      vault.balance = 0;
      await vault.save();
    }
    return res.json(vault);
  }
  if (memoryStore.vault.balance > 0) {
    memoryStore.vault.flexi_rd_balance += memoryStore.vault.balance;
    memoryStore.vault.total_swept += memoryStore.vault.balance;
    memoryStore.vault.total_sweeps_count += 1;
    memoryStore.vault.balance = 0;
  }
  res.json(memoryStore.vault);
});

app.listen(PORT, () => {
  console.log(`🚀 FundKosh Express API Server running on http://localhost:${PORT}`);
  initMongo();
});
