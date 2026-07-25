import React, { useEffect, useState } from 'react';
import { 
  RiskThemeProvider, 
  useRiskTheme 
} from './context/RiskThemeContext';
import { 
  Entity, 
  Liability, 
  EmbeddedLiability,
  Transaction, 
  SpeedBumpEvaluationResult, 
  WeatherCondition, 
  LocalEventVector,
  PredictiveUserState,
  DailyBudgetMetrics,
  VaultState,
  FlexiRDAccount
} from './domain/models';
import { PaymentController } from './controllers/PaymentController';
import { SpeedBumpEvaluator } from './engine/SpeedBumpEvaluator';
import { StatePredictor } from './engine/StatePredictor';
import { DailyBudgetCalculator } from './engine/DailyBudgetCalculator';
import { apiClient } from './api/apiClient';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  Wallet, 
  Activity,
  Calendar,
  CloudRain,
  Sun,
  Flame,
  Sparkles,
  PiggyBank,
  TrendingUp,
  Database,
  RefreshCw,
  Coins,
  Bell,
  MapPin,
  QrCode,
  Phone,
  AtSign,
  Info,
  HelpCircle,
  Home,
  FileText,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkle,
  ArrowLeft,
  Check,
  Award,
  X
} from 'lucide-react';

import { ReinforcementPredictor, getCurrentContext, PredictionResult } from './engine/ReinforcementModel';

const paymentController = new PaymentController();
const speedBumpEvaluator = new SpeedBumpEvaluator();
const statePredictor = new StatePredictor();
const budgetCalculator = new DailyBudgetCalculator();
const reinforcementPredictor = new ReinforcementPredictor();

function AppContent() {
  const { themeState, setThemeState, getThemeColors } = useRiskTheme();

  const [activeTab, setActiveTab] = useState<'pay' | 'budget' | 'vault' | 'ledger'>('pay');
  const [isDbReady, setIsDbReady] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);

  // Active User Profile Onboarding State
  const [currentUser, setCurrentUser] = useState<Entity | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'PHONE' | 'UPI'>('UPI');
  const [isEnteringUpiPin, setIsEnteringUpiPin] = useState(false);
  const [upiPin, setUpiPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [bypassSpeedBump, setBypassSpeedBump] = useState(false);
  const [optInRoundUp, setOptInRoundUp] = useState(true);
  const [showEmiPopup, setShowEmiPopup] = useState(false);
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string>('');
  const [currentEmiLiability, setCurrentEmiLiability] = useState<EmbeddedLiability | null>(null);

  // Create New Account Wizard States
  const [showCreateAccountWizard, setShowCreateAccountWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [selectedBank, setSelectedBank] = useState('Small Finance Bank');
  const [isSmsVerifying, setIsSmsVerifying] = useState(false);
  const [smsVerificationMessage, setSmsVerificationMessage] = useState('');
  
  const [newUserIncome, setNewUserIncome] = useState<number>(30000);
  const [newUserThreshold, setNewUserThreshold] = useState<number>(100);
  const [customLiabilities, setCustomLiabilities] = useState<{
    title: string;
    amount: number;
    period_days: number;
    last_paid_date: string;
  }[]>([
    { title: '', amount: 0, period_days: 30, last_paid_date: new Date().toISOString().split('T')[0] }
  ]);
  const [isPersonalizing, setIsPersonalizing] = useState(false);

  // AI Reinforcement Model States
  const [activePrediction, setActivePrediction] = useState<PredictionResult | null>(null);

  // Verification & Payment Result Status State
  const [verificationQuery, setVerificationQuery] = useState('');
  const [verifiedRecipient, setVerifiedRecipient] = useState<Entity | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'SUCCESS' | 'FAILED';
    txId: string;
    amount: number;
    payeeName: string;
    payeeUpi: string;
    timestamp: number;
    errorMessage?: string;
  } | null>(null);

  const handleOpenPaymentModal = (mode: 'PHONE' | 'UPI') => {
    setPaymentMode(mode);
    setVerificationQuery('');
    setVerifiedRecipient(null);
    setVerificationError(null);
    setPaymentResult(null);
    setAmount(0);
    setNote('other');
    setIsEnteringUpiPin(false);
    setOptInRoundUp(true);
    setShowEmiPopup(false);
    setSelectedLiabilityId('');
    setCurrentEmiLiability(null);
    setIsPaymentModalOpen(true);
  };

  const handleVerifyRecipient = () => {
    setVerificationError(null);
    setVerifiedRecipient(null);
    const query = verificationQuery.trim().toLowerCase();
    if (!query) {
      setVerificationError(paymentMode === 'PHONE' ? 'Please enter a phone number' : 'Please enter a UPI ID');
      return;
    }
    
    let matched: Entity | undefined;
    if (paymentMode === 'PHONE') {
      matched = entities.find(e => 
        e.phone && e.phone.replace(/[\s\-\+]/g, '').endsWith(query.replace(/[\s\-\+]/g, ''))
      );
    } else {
      matched = entities.find(e => e.upi_id.toLowerCase() === query);
    }

    if (matched) {
      if (matched.upi_id === senderUpi) {
        setVerificationError('Cannot pay yourself!');
        return;
      }
      setVerifiedRecipient(matched);
      setReceiverUpi(matched.upi_id);
    } else {
      setVerificationError(paymentMode === 'PHONE' 
        ? 'Phone number not found in directory. Please verify credentials.' 
        : 'UPI ID not found in directory. Please verify credentials.');
    }
  };

  // User & Simulator Form Inputs
  const [senderUpi, setSenderUpi] = useState('');
  const [receiverUpi, setReceiverUpi] = useState('gigatech@upi');
  const [amount, setAmount] = useState<number>(1500);
  const [note, setNote] = useState<'essential' | 'impulsive' | 'other' | 'emi'>('other');

  // External Vectors
  const [weather, setWeather] = useState<WeatherCondition>('CLEAR');
  const [eventVector, setEventVector] = useState<LocalEventVector>('NORMAL');

  // App-Launch Proactive State & Live Models
  const [userState, setUserState] = useState<PredictiveUserState | null>(null);
  const [budgetMetrics, setBudgetMetrics] = useState<DailyBudgetMetrics | null>(null);
  const [liveEvaluation, setLiveEvaluation] = useState<SpeedBumpEvaluationResult | null>(null);

  // DB Collections Data
  const [entities, setEntities] = useState<Entity[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vaultData, setVaultData] = useState<VaultState | null>(null);

  // Speed-Bump Modal State
  const [activeSpeedBump, setActiveSpeedBump] = useState<{
    tx: Transaction;
    evalResult: SpeedBumpEvaluationResult;
  } | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isBlueTheme = (activeTab !== 'pay') || (!currentUser);

  const rawThemeColors = getThemeColors();
  const themeColors = isBlueTheme ? {
    primary: '#0284c7',
    bgGradient: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
    cardBg: '#ffffff',
    borderColor: 'rgba(2, 132, 199, 0.15)',
    glowShadow: '0 8px 30px rgba(2, 132, 199, 0.06)',
    badgeBg: 'rgba(2, 132, 199, 0.1)',
    textColor: '#0284c7'
  } : rawThemeColors;

  const headerBg = isBlueTheme
    ? '#F0F9FF'
    : (themeState === 'GREEN' ? '#F0FDF4' : themeState === 'AMBER' ? '#FFFBEB' : '#FEF2F2');

  // Load Data & Run App-Launch Prediction
  const refreshAppData = async () => {
    const health = await apiClient.checkHealth();
    setMongoConnected(health.mongoConnected);

    const activeUpi = currentUser?.upi_id || senderUpi;
    const [e, l, t, v] = await Promise.all([
      apiClient.getEntities(),
      apiClient.getLiabilities(),
      apiClient.getTransactions(),
      apiClient.getVault(activeUpi)
    ]);

    setEntities(e);
    setLiabilities(l);
    setTransactions(t);
    
    const updatedUser = e.find(ent => ent.upi_id === activeUpi);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      if (updatedUser.vault) {
        setVaultData(updatedUser.vault);
      } else {
        setVaultData(v);
      }
    } else {
      setVaultData(v);
    }
    setIsDbReady(true);

    if (activeUpi) {
      // Proactive Launch State Prediction
      const state = await statePredictor.predictUserState(activeUpi);
      setUserState(state);

      const bMetrics = await budgetCalculator.calculateMetrics(
        activeUpi, 
        currentUser?.id || 'usr_01', 
        weather, 
        eventVector
      );
      setBudgetMetrics(bMetrics);

      // AI Reinforcement Launch Prediction
      const context = getCurrentContext();
      const prediction = reinforcementPredictor.predict(context);
      setActivePrediction(prediction);

      // Decides whether the UI theme would be GREEN, RED, or AMBER:
      // 1. GREEN: predicted category is 'essential' (usual time for essential payments)
      // 2. AMBER: predicted category is 'impulsive' (not usual time), but remainingDailyBudget > 0
      // 3. RED: predicted category is 'impulsive' and remainingDailyBudget <= 0 (high risk of daily budget exceeded)
      let mappedThemeState: RiskThemeState = 'GREEN';
      if (prediction.category === 'impulsive') {
        mappedThemeState = bMetrics.remainingDailyBudget > 0 ? 'AMBER' : 'RED';
      }
      setThemeState(mappedThemeState);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, [weather, eventVector, senderUpi]);

  useEffect(() => {
    if (currentUser) {
      // Sync sender UPI when profile is chosen or changed
      setSenderUpi(currentUser.upi_id);
    }
  }, [currentUser]);

  // Real-time evaluation as user types payment details
  useEffect(() => {
    if (!isDbReady || !senderUpi || !receiverUpi || amount <= 0) return;

    let isSubscribed = true;
    speedBumpEvaluator.evaluateTransaction(senderUpi, receiverUpi, amount, note, weather, eventVector)
      .then(res => {
        if (isSubscribed) {
          setLiveEvaluation(res);
          setThemeState(res.themeState);
        }
      })
      .catch(console.error);

    return () => { isSubscribed = false; };
  }, [senderUpi, receiverUpi, amount, note, weather, eventVector, isDbReady]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  // SMS verification hook for onboarding wizard
  useEffect(() => {
    if (isSmsVerifying) {
      setSmsVerificationMessage('Initiating secure bank SMS handshake...');
      const t1 = setTimeout(() => {
        setSmsVerificationMessage('Verifying credentials with SMS token...');
      }, 700);
      const t2 = setTimeout(() => {
        setSmsVerificationMessage('Bank Account linked successfully!');
      }, 1400);
      const t3 = setTimeout(() => {
        setIsSmsVerifying(false);
        setWizardStep(2);
      }, 2100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isSmsVerifying]);

  const handleSendPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amount <= 0) return;
    setStatusMessage(null);

    try {
      const evalResult = await paymentController.evaluatePayment(
        senderUpi,
        receiverUpi,
        amount,
        note,
        weather,
        eventVector
      );

      if (evalResult.requiresSpeedBump) {
        setActiveSpeedBump({
          tx: {
            id: 'temp_eval_' + Date.now(),
            sender_upi: senderUpi,
            receiver_upi: receiverUpi,
            amount,
            note,
            risk_score: evalResult.riskScore,
            status: 'SPEED_BUMP_REQUIRED',
            speed_bump_reason: evalResult.reasons.join(' | '),
            timestamp: new Date().toISOString()
          },
          evalResult
        });
        setCooldownLeft(evalResult.suggestedCooldownSeconds);
        setStatusMessage('⚡ Speed-Bump Intercept Triggered! Take a moment to reflect.');
      } else {
        setBypassSpeedBump(false);
        setIsEnteringUpiPin(true);
        setUpiPin('');
      }
    } catch (err: any) {
      setStatusMessage(`❌ Evaluation Error: ${err.message || 'Failed to check payment security.'}`);
    }
  };

  const handleKeypadPress = (key: string) => {
    if (key === 'backspace') {
      setUpiPin(prev => prev.slice(0, -1));
    } else if (key === 'confirm') {
      if (upiPin.length === 6) {
        setIsEnteringUpiPin(false);
        executePayment();
      }
    } else if (['—', '↵'].includes(key)) {
      // no op
    } else {
      if (upiPin.length < 6) {
        setUpiPin(prev => prev + key);
      }
    }
  };

  const executePayment = async () => {
    setStatusMessage(null);

    const result = await paymentController.initiatePayment(
      senderUpi,
      receiverUpi,
      amount,
      note,
      weather,
      eventVector,
      bypassSpeedBump,
      optInRoundUp
    );

    if (result.status === 'SPEED_BUMP_REQUIRED' && result.evaluationResult) {
      setActiveSpeedBump({
        tx: result.transaction,
        evalResult: result.evaluationResult
      });
      setCooldownLeft(result.evaluationResult.suggestedCooldownSeconds);
      setStatusMessage('⚡ Speed-Bump Intercept Triggered! Take a moment to reflect.');
    } else if (result.status === 'COMPLETED') {
      // Run AI Reinforcement Predictor update if category is essential or impulsive (no update for emi or other)
      if (note === 'essential' || note === 'impulsive') {
        const context = getCurrentContext();
        reinforcementPredictor.update(context, note);
      }

      const nextMultipleOf10 = Math.ceil(amount / 10) * 10;
      const roundUp = (optInRoundUp && nextMultipleOf10 > amount) ? nextMultipleOf10 - amount : 0;
      let msg = `✅ Payment of ₹${amount.toLocaleString()} completed!`;
      if (roundUp > 0) {
        msg += ` (Round-Up: ₹${roundUp} → Vault).`;
      }
      if (result.vaultSwept) {
        msg += ` 🐖 Vault reached target threshold & auto-swept to 7.2% Flexi-RD!`;
      }
      setStatusMessage(msg);

      // If this was an EMI payment, update the liability last paid date on the server
      if (note === 'emi' && currentEmiLiability) {
        try {
          await apiClient.payLiability(senderUpi, currentEmiLiability.id);
        } catch (err) {
          console.error("Failed to update liability last paid date", err);
        }
      }

      setPaymentResult({
        status: 'SUCCESS',
        txId: result.transaction.id,
        amount: amount,
        payeeName: verifiedRecipient ? verifiedRecipient.name : receiverUpi.split('@')[0],
        payeeUpi: receiverUpi,
        timestamp: Date.now()
      });
      setIsPaymentModalOpen(true);

      const updatedEntities = await apiClient.getEntities();
      const updatedMe = updatedEntities.find(ent => ent.upi_id === senderUpi);
      if (updatedMe) {
        setCurrentUser(updatedMe);
      }
      refreshAppData();
    } else if (result.status === 'FAILED') {
      setStatusMessage(`❌ Payment Failed: ${result.errorMessage}`);
      setPaymentResult({
        status: 'FAILED',
        txId: 'TXN_' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        amount: amount,
        payeeName: verifiedRecipient ? verifiedRecipient.name : receiverUpi.split('@')[0],
        payeeUpi: receiverUpi,
        timestamp: Date.now(),
        errorMessage: result.errorMessage
      });
      setIsPaymentModalOpen(true);
    }
  };

  const handleResolveSpeedBump = async (choice: 'CONFIRM' | 'CANCEL') => {
    if (!activeSpeedBump) return;

    setActiveSpeedBump(null);

    if (choice === 'CANCEL') {
      setStatusMessage('🛑 Payment cancelled. Funds preserved safely!');
    } else {
      setBypassSpeedBump(true);
      setIsEnteringUpiPin(true);
      setUpiPin('');
    }
  };

  const handleSeedDatabase = async () => {
    await apiClient.seedDatabase();
    // After seeding database, clear current user session to force re-selection
    setCurrentUser(null);
    await refreshAppData();
    setStatusMessage('🌱 Database re-seeded with initial entities, liabilities, rules, and vault.');
  };

  const handleManualSweep = async () => {
    if (currentUser?.upi_id) {
      await apiClient.manualSweepVault(currentUser.upi_id);
      await refreshAppData();
      setStatusMessage('🐖 Manual sweep executed! All spare change moved to 7.2% Flexi-RD.');
    }
  };

  const handleCreateAccount = async () => {
    setIsPersonalizing(true);
    setWizardStep(5);
    
    try {
      const firstPart = newUserName.trim().split(' ')[0].toLowerCase();
      const upiId = `${firstPart}${Math.floor(100 + Math.random() * 900)}@upi`;
      
      const userLiabs = customLiabilities
        .filter(l => l.title.trim() && l.amount > 0)
        .map(l => ({
          id: 'liab_' + Math.random().toString(36).substring(2, 9),
          title: l.title.trim(),
          amount: l.amount,
          period_days: l.period_days,
          last_paid_date: l.last_paid_date,
          is_active: true
        }));

      const createdUser = await apiClient.createEntity({
        name: newUserName.trim(),
        type: 0, // 0 = user
        balance: 25000,
        upi_id: upiId,
        phone: newUserPhone.trim(),
        liabilities: userLiabs,
        vault: {
          balance: 0,
          target_threshold: newUserThreshold,
          total_swept: 0,
          flexi_rd_balance: 0,
          interest_rate: 7.2,
          total_sweeps_count: 0
        }
      });

      setTimeout(async () => {
        setIsPersonalizing(false);
        setShowCreateAccountWizard(false);
        setWizardStep(1);
        
        await refreshAppData();
        setCurrentUser(createdUser);
        setStatusMessage(`🎉 Welcome ${newUserName}! Your FundKosh account is linked and personalized.`);
      }, 2500);

    } catch (err) {
      console.error(err);
      setIsPersonalizing(false);
      setStatusMessage('❌ Failed to link bank account. Please verify API server status.');
    }
  };

  if (!isDbReady) {
    return (
      <div style={styles.centerContainer}>
        <Activity className="animate-spin" size={36} color={themeColors.primary} />
        <p style={{ marginTop: 14, color: '#475569', fontSize: 14 }}>Connecting to FundKosh MongoDB API Server...</p>
      </div>
    );
  }

  // ONBOARDING PAGE
  if (!currentUser) {
    return (
      <div style={{ ...styles.appShell, background: themeColors.bgGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ ...styles.title, fontSize: 36, color: themeColors.primary }}>FundKosh</h1>
          <p style={{ ...styles.description, fontSize: 14 }}>Dynamic Cash Management & Sahayak Friction Engine</p>
        </div>

        {!showCreateAccountWizard ? (
          /* PROFILE SELECTION SCREEN */
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, fontSize: 18, marginBottom: 6, textAlign: 'center' }}>Choose Your Profile</h2>
            <p style={{ ...styles.description, textAlign: 'center', marginBottom: 20 }}>Select a user account to experience customized daily budgets and auto spare-change sweeps.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entities.filter(e => e.type === 0).map(user => (
                <div 
                  key={user.id} 
                  onClick={() => {
                    setCurrentUser(user);
                  }}
                  style={{ 
                    ...styles.entityItem, 
                    cursor: 'pointer', 
                    border: '1px solid #e2e8f0', 
                    padding: '16px', 
                    borderRadius: 12,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      backgroundColor: themeColors.primary, 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 16
                    }}>
                      {user.name[0]}
                    </div>
                    <div>
                      <span style={{ ...styles.entityName, fontSize: 14 }}>{user.name}</span>
                      <span style={{ ...styles.upiText, fontSize: 11, marginTop: 2 }}>{user.upi_id}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>Balance</span>
                    <span style={{ ...styles.balanceText, fontSize: 14, color: themeColors.primary }}>₹{user.balance.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
              <button 
                onClick={() => setShowCreateAccountWizard(true)}
                style={{
                  ...styles.submitBtn, 
                  backgroundColor: themeColors.primary, 
                  width: '100%', 
                  fontSize: 14, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 6 
                }}
              >
                ➕ Create New User Account
              </button>
            </div>
          </div>
        ) : (
          /* CREATE USER ACCOUNT MULTI-STEP WIZARD */
          <div style={styles.card}>
            
            {/* Header and Back Button */}
            {wizardStep < 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button 
                  onClick={() => {
                    if (wizardStep === 1) {
                      setShowCreateAccountWizard(false);
                    } else {
                      setWizardStep(prev => prev - 1);
                    }
                  }} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <ArrowLeft size={18} color={themeColors.primary} />
                </button>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Step {wizardStep} of 4
                  </h3>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {wizardStep === 1 ? 'Dummy Account Linking' : wizardStep === 2 ? 'Monthly Earnings' : wizardStep === 3 ? 'Fixed Monthly Bills' : 'Flexi-RD Setup'}
                  </span>
                </div>
              </div>
            )}

            {/* STEP 1: DUMMY ACCOUNT LINKING */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input 
                    type="text" 
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input 
                    type="text" 
                    value={newUserPhone}
                    onChange={e => setNewUserPhone(e.target.value)}
                    placeholder="e.g. 98290 55667"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Bank Account</label>
                  <select 
                    value={selectedBank} 
                    onChange={e => setSelectedBank(e.target.value)}
                    style={styles.input}
                  >
                    <option value="Small Finance Bank">Small Finance Bank (Recommended)</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                  </select>
                </div>

                {otpSent && !isOtpVerified && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Enter 4-Digit OTP (Sent to Phone)</label>
                    <input 
                      type="text" 
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value)}
                      placeholder="e.g. 1234"
                      maxLength={4}
                      style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                    />
                  </div>
                )}

                {isSmsVerifying && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 16, 
                    backgroundColor: themeColors.badgeBg, 
                    borderRadius: 10, 
                    border: '1px solid ' + themeColors.borderColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <Activity className="animate-spin" size={24} color={themeColors.primary} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: themeColors.textColor }}>
                      {smsVerificationMessage}
                    </span>
                  </div>
                )}

                {!isSmsVerifying && (
                  <div style={{ marginTop: 8 }}>
                    {!otpSent ? (
                      <button
                        onClick={() => {
                          if (!newUserName.trim() || !newUserPhone.trim()) {
                            alert('Please fill in your name and phone number.');
                            return;
                          }
                          setOtpSent(true);
                          setOtpValue('1234'); // Auto fill verification OTP value
                        }}
                        style={{ ...styles.submitBtn, backgroundColor: themeColors.primary, width: '100%' }}
                      >
                        Send Verification OTP
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (otpValue.length < 4) {
                            alert('Please enter the 4-digit OTP.');
                            return;
                          }
                          setIsOtpVerified(true);
                          setIsSmsVerifying(true);
                        }}
                        style={{ ...styles.submitBtn, backgroundColor: themeColors.primary, width: '100%' }}
                      >
                        Verify OTP & Link Bank
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: AVERAGE MONTHLY INCOME */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: themeColors.primary }}>💵 Monthly Earnings</span>
                  <p style={{ ...styles.description, marginTop: 4 }}>Enter your average monthly take-home income or salary.</p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Average Monthly Income (₹)</label>
                  <input 
                    type="number" 
                    value={newUserIncome === 0 ? '' : newUserIncome}
                    onChange={e => setNewUserIncome(Number(e.target.value))}
                    placeholder="e.g. 35000"
                    style={styles.input}
                    min={1000}
                    required
                  />
                </div>

                <button
                  onClick={() => {
                    if (newUserIncome < 1000) {
                      alert('Please enter a valid monthly income.');
                      return;
                    }
                    setWizardStep(3);
                  }}
                  style={{ ...styles.submitBtn, backgroundColor: themeColors.primary, width: '100%' }}
                >
                  Next: Fixed Payments ➔
                </button>
              </div>
            )}

            {/* STEP 3: FIXED MONTHLY PAYMENTS */}
            {wizardStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: themeColors.primary }}>💳 Fixed Payments</span>
                  <p style={{ ...styles.description, marginTop: 4 }}>Add your active EMIs, rent, subscriptions, or family allowance payouts.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                  {customLiabilities.map((liab, idx) => (
                    <div key={idx} style={{ 
                      backgroundColor: '#f8fafc', 
                      borderRadius: 12, 
                      padding: 12, 
                      border: '1px solid #e2e8f0', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 8,
                      position: 'relative'
                    }}>
                      {customLiabilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = customLiabilities.filter((_, i) => i !== idx);
                            setCustomLiabilities(updated);
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 'bold',
                            padding: 4
                          }}
                        >
                          ✕ Remove
                        </button>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: customLiabilities.length > 1 ? 24 : 0 }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>Title</label>
                          <input 
                            type="text" 
                            value={liab.title}
                            onChange={e => {
                              const updated = [...customLiabilities];
                              updated[idx].title = e.target.value;
                              setCustomLiabilities(updated);
                            }}
                            placeholder="e.g. Rent"
                            style={{ ...styles.input, padding: '8px' }}
                          />
                        </div>
                        <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>Amount (₹)</label>
                          <input 
                            type="number" 
                            value={liab.amount === 0 ? '' : liab.amount}
                            onChange={e => {
                              const updated = [...customLiabilities];
                              updated[idx].amount = Number(e.target.value);
                              setCustomLiabilities(updated);
                            }}
                            placeholder="Amount"
                            style={{ ...styles.input, padding: '8px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>Period (Days)</label>
                          <input 
                            type="number" 
                            value={liab.period_days}
                            onChange={e => {
                              const updated = [...customLiabilities];
                              updated[idx].period_days = Number(e.target.value);
                              setCustomLiabilities(updated);
                            }}
                            placeholder="e.g. 30"
                            style={{ ...styles.input, padding: '8px' }}
                          />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>Last Paid Date</label>
                          <input 
                            type="date" 
                            value={liab.last_paid_date}
                            onChange={e => {
                              const updated = [...customLiabilities];
                              updated[idx].last_paid_date = e.target.value;
                              setCustomLiabilities(updated);
                            }}
                            style={{ ...styles.input, padding: '8px' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCustomLiabilities([...customLiabilities, { title: '', amount: 0, period_days: 30, last_paid_date: new Date().toISOString().split('T')[0] }])}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: themeColors.primary,
                    border: '1px dashed ' + themeColors.primary,
                    borderRadius: 8,
                    padding: '8px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 4
                  }}
                >
                  ➕ Add Another Fixed Expense
                </button>

                <button
                  onClick={() => setWizardStep(4)}
                  style={{ ...styles.submitBtn, backgroundColor: themeColors.primary, width: '100%', marginTop: 12 }}
                >
                  Next: Setup Flexi-RD ➔
                </button>
              </div>
            )}

            {/* STEP 4: FLEXI-RD SETUP */}
            {wizardStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: themeColors.primary }}>🐖 Flexi-RD Setup</span>
                  <p style={{ ...styles.description, marginTop: 4 }}>Configure your automated round-up savings and sweep threshold.</p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Auto-Sweep Threshold</span>
                  <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                    Choose the amount at which your accumulated spare change will be automatically swept into your 7.2% interest Flexi-RD.
                  </span>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {[100, 150, 200, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewUserThreshold(val)}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          borderRadius: 8,
                          border: newUserThreshold === val ? '2px solid ' + themeColors.primary : '1px solid #cbd5e1',
                          backgroundColor: newUserThreshold === val ? themeColors.badgeBg : '#ffffff',
                          color: newUserThreshold === val ? themeColors.textColor : '#475569',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateAccount}
                  style={{ ...styles.submitBtn, backgroundColor: themeColors.primary, width: '100%', marginTop: 8 }}
                >
                  Personalize my FundKosh ➔
                </button>
              </div>
            )}

            {/* STEP 5: PERSONALIZATION LOADING */}
            {wizardStep === 5 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '24px 12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 16 
              }}>
                <Sparkles className="animate-pulse" size={48} color={themeColors.primary} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: themeColors.primary }}>
                    Personalizing FundKosh...
                  </h3>
                  <p style={{ ...styles.description, marginTop: 6, fontSize: 12, lineHeight: '1.5' }}>
                    Recalculating daily limits and setting up your Sahayak Assistant cognitive friction models...
                  </p>
                </div>
                <div style={{ width: '100%', height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '70%', backgroundColor: themeColors.primary, borderRadius: 2 }} className="animate-bounce" />
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    );
  }

  const selectedReceiver = entities.find(e => e.upi_id === receiverUpi);

  return (
    <div style={{ ...styles.appShell, background: headerBg }}>
      
      {/* Mobile Top Header */}
      <header style={{ ...styles.header, borderBottom: 'none', backgroundColor: headerBg, padding: '16px 16px 8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User Profile Avatar */}
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: '50%', 
            overflow: 'hidden',
            border: '2px solid ' + themeColors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ color: themeColors.primary, fontWeight: 700, fontSize: 16 }}>
              {currentUser.name[0]}
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: themeColors.primary, margin: 0 }}>
              Namaste, {currentUser.name.split(' ')[0]} Ji!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <MapPin size={12} color="#64748b" />
              <span style={{ fontSize: 11, color: '#64748b' }}>Mansarovar, Jaipur</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeTab === 'pay' && (
            <span style={{ ...styles.themeStateChip, backgroundColor: themeColors.badgeBg, color: themeColors.textColor, fontSize: 9 }}>
              🛡️ {themeState}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        
        {/* TAB 1: HOME PAGE */}
        {activeTab === 'pay' && (
          <div style={styles.tabContainer}>
            
            {/* Primary Account Balance Card */}
            <div style={{ 
              ...styles.card, 
              borderLeft: '4px solid #006C49', 
              padding: '16px 20px',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
              marginBottom: 4
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>
                  PRIMARY ACCOUNT BALANCE
                </span>
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 700, 
                  color: '#006C49', 
                  backgroundColor: '#E6F4EA', 
                  padding: '3px 8px', 
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  🏦 SFB Linked
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                  {showBalance ? `₹${currentUser.balance.toLocaleString()}` : '■■■■■■'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  style={{ 
                    backgroundColor: '#E6F4EA', 
                    color: '#006C49', 
                    border: 'none', 
                    borderRadius: 16, 
                    padding: '4px 12px', 
                    fontSize: 11, 
                    fontWeight: 600,
                    cursor: 'pointer' 
                  }}
                >
                  {showBalance ? 'Hide Balance' : 'Show Balance'}
                </button>
              </div>

              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                Small Finance Bank •••• 8829
              </div>
            </div>

            {/* AI prediction model runs silently in the background to set the UI theme colors */}

            {/* Scan QR Code Button */}
            <button 
              onClick={() => handleOpenPaymentModal('UPI')}
              style={{
                width: '100%',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '16px',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                marginBottom: 4
              }}
            >
              <QrCode size={20} />
              SCAN ANY QR CODE
            </button>

            {/* Quick Actions Icon Row */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '8px 0 8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => handleOpenPaymentModal('PHONE')}>
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '50%', 
                  backgroundColor: '#16a34a', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                }}>
                  <Phone size={22} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>To Contact</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => handleOpenPaymentModal('UPI')}>
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '50%', 
                  backgroundColor: '#16a34a', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                }}>
                  <AtSign size={22} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>To UPI ID</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.5, cursor: 'not-allowed' }}>
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '50%', 
                  backgroundColor: '#64748b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#ffffff',
                  boxShadow: 'none'
                }}>
                  <Wallet size={22} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Self-Transfer</span>
              </div>
            </div>

            {/* Chillar Vault Card */}
            <div style={{ ...styles.card, padding: 16, border: '1px solid #e2e8f0', marginBottom: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: 10, top: 10, opacity: 0.04, pointerEvents: 'none' }}>
                <PiggyBank size={90} color="#006C49" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: '50%', 
                  backgroundColor: '#E6F4EA', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#006C49' 
                }}>
                  <PiggyBank size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#006C49', margin: 0 }}>
                  Chillar Vault
                </h3>
              </div>

              <p style={{ fontSize: 12, color: '#475569', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                Your loose change from scanned transactions is cached securely on this phone.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <span style={{ color: '#006C49' }}>
                  ₹ {vaultData?.balance || 0} Saved
                </span>
                <span style={{ color: '#64748b', fontSize: 11 }}>
                  ₹{vaultData?.target_threshold || 100} Target
                </span>
              </div>

              <div style={{ ...styles.progressBarBg, height: 8, borderRadius: 4, marginBottom: 16 }}>
                <div style={{
                  ...styles.progressBarFill,
                  height: '100%',
                  width: `${Math.min(100, ((vaultData?.balance || 0) / (vaultData?.target_threshold || 100)) * 100)}%`,
                  backgroundColor: '#16a34a',
                  borderRadius: 4
                }} />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: 8, 
                backgroundColor: '#F0FDF4', 
                border: '1px solid #bbf7d0', 
                borderRadius: 8, 
                padding: '10px', 
                fontSize: 11, 
                color: '#16a34a', 
                alignItems: 'flex-start',
                lineHeight: '1.4'
              }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Once you hit ₹{vaultData?.target_threshold || 100}, we automatically sweep it directly to your Flexi-RD to earn 7.2% interest!
                </span>
              </div>
            </div>



            {statusMessage && (
              <div style={styles.notification}>
                {statusMessage}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PROFILE & BUDGET (mapped to PROFILE in Bottom Nav) */}
        {activeTab === 'budget' && (
          <div style={styles.tabContainer}>
            
            {/* User Profile Summary */}
            <div style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  backgroundColor: themeColors.primary, 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18
                }}>
                  {currentUser.name[0]}
                </div>
                <div>
                  <h3 style={{ ...styles.cardTitle, fontSize: 16, marginBottom: 4 }}>{currentUser.name}</h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={getTypeStyle(currentUser.type, activeTab !== 'pay')}>{currentUser.type === 0 ? 'USER' : 'MERCHANT'}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{currentUser.upi_id}</span>
                  </div>
                </div>
              </div>

              {/* Log Out Option */}
              <button 
                onClick={() => setCurrentUser(null)}
                style={{
                  width: '100%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '10px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Log Out of Profile
              </button>
            </div>

            {/* Dynamic Daily Budget Breakdown */}
            {budgetMetrics && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <TrendingUp size={20} color={themeColors.primary} />
                  <h2 style={styles.cardTitle}>Daily Budget Engine</h2>
                </div>

                <div style={styles.budgetFormulaGrid}>
                  <div style={styles.budgetBox}>
                    <span style={{ fontSize: 11, color: '#475569' }}>Est. Monthly Income</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: themeColors.primary }}>
                      ₹{budgetMetrics.predictedMonthlyIncome.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.budgetBox}>
                    <span style={{ fontSize: 11, color: '#475569' }}>Fixed Bills (30d)</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: themeColors.primary }}>
                      - ₹{budgetMetrics.totalActiveLiabilities.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ ...styles.budgetBox, borderColor: themeColors.borderColor }}>
                    <span style={{ fontSize: 11, color: themeColors.textColor, fontWeight: 600 }}>Daily Limit</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: themeColors.primary }}>
                      ₹{budgetMetrics.dailySpendableLimit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>Today's Total Spend:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{budgetMetrics.todaySpent.toLocaleString()} / ₹{budgetMetrics.dailySpendableLimit.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div style={{
                      ...styles.progressBarFill,
                      width: `${Math.min(100, (budgetMetrics.todaySpent / budgetMetrics.dailySpendableLimit) * 100)}%`,
                      backgroundColor: themeColors.primary
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: themeColors.textColor, display: 'block', marginTop: 6, fontWeight: 600 }}>
                    Remaining Budget Buffer: ₹{budgetMetrics.remainingDailyBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Active Liabilities Table */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Calendar size={20} color={themeColors.primary} />
                <h2 style={styles.cardTitle}>Upcoming Fixed Obligations</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liabilities.filter(liab => liab.entity_id === currentUser.id).map(liab => (
                  <div key={liab.id} style={styles.liabItem}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{liab.title}</span>
                      <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>Due in {liab.due_in_days} days</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: themeColors.primary }}>₹{liab.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: VAULT & FLEXI-RD MICRO-SAVINGS */}
        {activeTab === 'vault' && (
          <div style={{ ...styles.tabContainer, flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Vault Metrics */}
            <div style={{ 
              ...styles.card, 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1, 
              minHeight: 'calc(100vh - 220px)', 
              padding: '24px 20px', 
              boxSizing: 'border-box' 
            }}>
              <div style={styles.cardHeader}>
                <PiggyBank size={22} color={themeColors.primary} />
                <h2 style={{ ...styles.cardTitle, fontSize: 16 }}>Automated Round-Up Vault</h2>
              </div>
              
              <p style={{ fontSize: 12, color: '#64748b', margin: '-4px 0 20px 0', lineHeight: '1.4' }}>
                Your spare change from transactions is saved here automatically. Once the threshold is met, it auto-sweeps into your 7.2% Flexi-RD account.
              </p>

              {/* Grid of micro-savings cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                {(() => {
                  const threshold = vaultData?.target_threshold || 100;
                  const balance = vaultData?.balance || 0;
                  const percent = Math.min(100, Math.floor((balance / threshold) * 100));

                  return (
                    <div style={{ 
                      ...styles.budgetBox, 
                      backgroundColor: themeColors.badgeBg, 
                      borderColor: themeColors.borderColor,
                      padding: '14px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 120
                    }}>
                      <div>
                        <span style={{ fontSize: 12, color: themeColors.textColor, fontWeight: 700, display: 'block' }}>Spare Change</span>
                        <span style={{ fontSize: 28, fontWeight: 900, color: themeColors.primary, display: 'block', margin: '4px 0' }}>
                          ₹{balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: themeColors.textColor, fontWeight: 600 }}>Sweep Progress: {percent}%</span>
                        <div style={{ height: 6, backgroundColor: themeColors.borderColor, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: themeColors.primary, borderRadius: 3 }}></div>
                        </div>
                        <span style={{ fontSize: 9, color: themeColors.textColor, display: 'block', marginTop: 4 }}>Target: ₹{threshold}</span>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ 
                  ...styles.budgetBox, 
                  backgroundColor: themeColors.badgeBg, 
                  borderColor: themeColors.borderColor,
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 120
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: themeColors.textColor, fontWeight: 700, display: 'block' }}>Flexi-RD Savings</span>
                    <span style={{ fontSize: 28, fontWeight: 900, color: themeColors.primary, display: 'block', margin: '4px 0' }}>
                      ₹{(vaultData?.flexi_rd_balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: themeColors.textColor, fontWeight: 700, display: 'block' }}>7.2% Per Annum</span>
                    <span style={{ fontSize: 10, color: themeColors.textColor, display: 'block', marginTop: 2 }}>Sweeps Completed: {vaultData?.total_sweeps_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Auto-Sweep Threshold Selector */}
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>Set Auto-Sweep Threshold</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[100, 150, 200, 500].map(val => (
                    <button 
                      key={val}
                      type="button"
                      onClick={() => apiClient.updateVaultThreshold(currentUser?.upi_id || senderUpi, val).then(refreshAppData)}
                      style={{
                        ...styles.vectorBtn,
                        flex: 1,
                        padding: '10px 0',
                        fontSize: 13,
                        borderRadius: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        justifyContent: 'center',
                        ...(vaultData?.target_threshold === val 
                          ? { backgroundColor: themeColors.primary, borderColor: themeColors.primary, color: '#ffffff' } 
                          : { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }
                        )
                      }}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleManualSweep}
                style={{ 
                  ...styles.submitBtn, 
                  backgroundColor: themeColors.primary, 
                  marginTop: 'auto',
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: activeTab === 'pay' ? '0 4px 12px rgba(0, 108, 73, 0.15)' : '0 4px 12px rgba(2, 132, 199, 0.15)'
                }}
              >
                <PiggyBank size={18} /> Execute Manual Sweep to 7.2% Flexi-RD
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: AUDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div style={styles.tabContainer}>
            
            {/* Audit Log */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Activity size={20} color={themeColors.primary} />
                <h2 style={styles.cardTitle}>Transaction History</h2>
              </div>
              <div style={styles.txList}>
                {(() => {
                  const filteredTxs = transactions.filter(tx => tx.sender_upi === currentUser.upi_id);
                  if (filteredTxs.length === 0) {
                    return (
                      <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                        No transactions recorded yet. Initiate a payment to populate ledger.
                      </div>
                    );
                  }
                  return filteredTxs.map(tx => (
                    <div key={tx.id} style={styles.txItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          You → {tx.receiver_upi.split('@')[0]}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          ₹{tx.amount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={getStatusBadgeStyle(tx.status, activeTab !== 'pay')}>{tx.status}</span>
                          <span style={getPredictedCategoryBadge(tx.note === 'other' ? 'transfers' : (tx.note || 'essential'), activeTab !== 'pay')}>
                            {tx.note === 'other' ? 'transfers' : (tx.note || 'essential')}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: getRiskColor(tx.risk_score, activeTab !== 'pay') }}>
                            Score: {tx.risk_score}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},{' '}
                          {new Date(tx.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Floating Support & Sandbox Button */}
      <button 
        onClick={() => setShowSandbox(!showSandbox)}
        style={{
          position: 'fixed',
          bottom: 75,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: themeColors.primary,
          color: '#ffffff',
          border: 'none',
          boxShadow: activeTab === 'pay' ? '0 4px 10px rgba(0, 108, 73, 0.3)' : '0 4px 10px rgba(2, 132, 199, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        <HelpCircle size={22} />
      </button>

      {/* Collapsible Sandbox Tray */}
      {showSandbox && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }} onClick={() => setShowSandbox(false)}>
          <div 
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '100%',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={18} color="#006C49" />
                <h3 style={{ ...styles.cardTitle, fontSize: 16 }}>Developer Sandbox</h3>
              </div>
              <button 
                onClick={() => setShowSandbox(false)}
                style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#64748b', fontWeight: 600 }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={styles.statusChip}>
                <Database size={13} color={mongoConnected ? '#16a34a' : '#d97706'} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  {mongoConnected ? 'MongoDB Connected' : 'Mock Memory Database'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSeedDatabase} style={styles.seedBtn}>
                  <RefreshCw size={11} /> Reset / Seed DB
                </button>
                <button onClick={() => { setCurrentUser(null); setShowSandbox(false); }} style={{ ...styles.seedBtn, color: '#dc2626' }}>
                  Log Out
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <div>
                <label style={styles.label}>Weather Conditions (Affects spend propensity scores)</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {(['CLEAR', 'RAIN', 'HEATWAVE'] as WeatherCondition[]).map(w => (
                    <button 
                      key={w}
                      onClick={() => setWeather(w)}
                      style={weather === w ? styles.activeVectorBtn : styles.vectorBtn}
                    >
                      {w === 'CLEAR' ? <Sun size={12} /> : w === 'RAIN' ? <CloudRain size={12} /> : <Flame size={12} />} {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label}>Local Events (Affects spending stress limits)</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {(['NORMAL', 'FESTIVAL_SEASON', 'IPL_MATCH_NIGHT'] as LocalEventVector[]).map(ev => (
                    <button 
                      key={ev}
                      onClick={() => setEventVector(ev)}
                      style={eventVector === ev ? styles.activeVectorBtn : styles.vectorBtn}
                    >
                      {ev.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Overlay Modal */}
      {isPaymentModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f8fafc',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {/* Top AppBar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '16px 20px', 
            borderBottom: '1px solid #e2e8f0', 
            backgroundColor: '#ffffff'
          }}>
            <button
              onClick={() => {
                if (paymentResult) {
                  setPaymentResult(null);
                  setIsPaymentModalOpen(false);
                } else if (isEnteringUpiPin) {
                  setIsEnteringUpiPin(false);
                } else if (verifiedRecipient) {
                  setVerifiedRecipient(null);
                  setAmount(0);
                } else {
                  setIsPaymentModalOpen(false);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#006C49'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginLeft: 12 }}>
              {paymentResult 
                ? (paymentResult.status === 'SUCCESS' ? 'Payment Success' : 'Payment Failed')
                : (verifiedRecipient ? `Pay to ${verifiedRecipient.name}` : (paymentMode === 'PHONE' ? 'Pay to Contact' : 'Pay to UPI ID'))
              }
            </span>
          </div>

          {/* Page Scrollable Content */}
          <div style={{ 
            flex: 1, 
            padding: '24px 20px', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            maxWidth: 480, 
            margin: '0 auto', 
            boxSizing: 'border-box' 
          }}>

            {/* PHASE 3: STATUS SCREENS */}
            {paymentResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                {paymentResult.status === 'SUCCESS' ? (
                  /* PAYMENT SUCCESS VIEW */
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: 'auto 0', width: '100%' }}>
                      <div style={{ 
                        width: 72, 
                        height: 72, 
                        borderRadius: '50%', 
                        backgroundColor: '#16a34a', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)',
                        marginBottom: 8
                      }}>
                        <Check size={38} />
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#006C49', margin: 0 }}>Payment Successful</h2>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Transaction ID: {paymentResult.txId}</span>

                      <span style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                        ₹{paymentResult.amount.toLocaleString()}
                      </span>

                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        📅 {new Date(paymentResult.timestamp).toLocaleString()}
                      </span>

                      {/* Recipient info */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 12, 
                        padding: 12, 
                        width: '100%', 
                        margin: '12px 0 6px 0',
                        textAlign: 'left'
                      }}>
                        <div style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: '50%', 
                          backgroundColor: '#006C49', 
                          color: '#ffffff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>
                          {paymentResult.payeeName[0]}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{paymentResult.payeeName}</h4>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{paymentResult.payeeUpi}</span>
                        </div>
                        <div style={{ marginLeft: 'auto', color: '#16a34a' }}>
                          <CheckCircle2 size={16} />
                        </div>
                      </div>

                      {/* Source details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                        <Home size={14} />
                        <span>Paid from Small Finance Bank •••• 8829</span>
                      </div>

                      {/* Reward Card */}
                      <div style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                        border: '1px solid #bbf7d0',
                        borderRadius: 12, 
                        padding: 12, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10,
                        marginTop: 10,
                        textAlign: 'left'
                      }}>
                        <div style={{ backgroundColor: '#16a34a', color: '#ffffff', borderRadius: 8, padding: 6 }}>
                          <Award size={18} />
                        </div>
                        <div>
                          <h5 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#006C49' }}>New Reward Earned!</h5>
                          <span style={{ fontSize: 10, color: '#16a34a' }}>Tap to scratch and reveal coupon</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsPaymentModalOpen(false)}
                      style={{ ...styles.submitBtn, backgroundColor: '#006C49', width: '100%', marginTop: 'auto' }}
                    >
                      Back to Home
                    </button>
                  </div>
                ) : (
                  /* PAYMENT FAILED VIEW */
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: 'auto 0', width: '100%' }}>
                      <div style={{ 
                        width: 72, 
                        height: 72, 
                        borderRadius: '50%', 
                        backgroundColor: '#ef4444', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                        marginBottom: 8
                      }}>
                        <XCircle size={38} />
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#991b1b', margin: 0 }}>Payment Failed</h2>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Transaction ID: {paymentResult.txId}</span>

                      <span style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                        ₹{paymentResult.amount.toLocaleString()}
                      </span>

                      <div style={{ 
                        backgroundColor: '#fff1f2', 
                        border: '1px solid #fecaca', 
                        color: '#991b1b', 
                        padding: 12, 
                        borderRadius: 12, 
                        width: '100%', 
                        fontSize: 12,
                        fontWeight: 600,
                        margin: '8px 0'
                      }}>
                        {paymentResult.errorMessage || 'Unknown Error Encountered'}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button 
                        onClick={() => setPaymentResult(null)}
                        style={{ ...styles.submitBtn, backgroundColor: '#dc2626', width: '100%', margin: 0 }}
                      >
                        Try Again
                      </button>
                      <button 
                        onClick={() => setIsPaymentModalOpen(false)}
                        style={{ ...styles.submitBtn, backgroundColor: '#64748b', width: '100%', margin: 0 }}
                      >
                        Back to Home
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !verifiedRecipient ? (
              /* PHASE 1: VERIFICATION SCREEN */
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <p style={{ ...styles.description, marginBottom: 16 }}>
                  Enter details to verify the beneficiary and proceed with payment.
                </p>

                <div style={{ ...styles.form, marginTop: 12, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      {paymentMode === 'PHONE' ? "Recipient's Phone Number" : "Recipient's UPI ID"}
                    </label>
                    <input 
                      type="text" 
                      value={verificationQuery}
                      onChange={e => setVerificationQuery(e.target.value)}
                      placeholder={paymentMode === 'PHONE' ? 'e.g. +91 94140 54321' : 'e.g. sunitadevi@upi'}
                      style={styles.input}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyRecipient();
                        }
                      }}
                    />
                  </div>

                  {verificationError && (
                    <div style={{ 
                      backgroundColor: '#fff1f2', 
                      border: '1px solid #fecaca', 
                      color: '#b91c1c', 
                      padding: 10, 
                      borderRadius: 8, 
                      fontSize: 12,
                      marginTop: 4,
                      fontWeight: 600
                    }}>
                      ⚠️ {verificationError}
                    </div>
                  )}

                  {/* DISPLAY AVAILABLE CREDENTIALS INSTEAD OF TIP */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginTop: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#006C49', display: 'block', marginBottom: 8 }}>
                      {paymentMode === 'PHONE' ? 'Available Registered Phone Numbers:' : 'Available Registered UPI IDs:'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
                      {entities
                        .filter(e => e.upi_id !== senderUpi && (paymentMode === 'PHONE' ? !!e.phone : true))
                        .map(ent => (
                          <div 
                            key={ent.id}
                            onClick={() => setVerificationQuery(paymentMode === 'PHONE' ? (ent.phone || '') : ent.upi_id)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 12,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#006C49';
                              e.currentTarget.style.backgroundColor = '#f0fdf4';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{ent.name}</span>
                            <span style={{ color: '#006C49', fontFamily: 'monospace', fontWeight: 600 }}>
                              {paymentMode === 'PHONE' ? ent.phone : ent.upi_id}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleVerifyRecipient}
                    style={{
                      ...styles.submitBtn,
                      backgroundColor: '#006C49',
                      width: '100%',
                      padding: 14,
                      fontSize: 15,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    Verify Beneficiary ➔
                  </button>
                </div>
              </div>
            ) : isEnteringUpiPin ? (
              /* PHASE 1.5: DEDICATED UPI PIN PAGE (NPCI STANDARD LAYOUT) */
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                
                {/* Top Bar */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 20px 8px 20px', 
                  backgroundColor: 'transparent' 
                }}>
                  {/* UPI Logo in italic styled text */}
                  <span style={{ fontSize: 18, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#4b5563' }}>U</span>
                    <span style={{ color: '#059669' }}>P</span>
                    <span style={{ color: '#3b82f6' }}>I</span>
                  </span>
                  {/* Close X button */}
                  <button 
                    onClick={() => setIsEnteringUpiPin(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Source Bank details */}
                <div style={{ padding: '0 20px', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SAVINGS · Small Finance Bank ···· 8829
                  </span>
                </div>

                {/* Payment summary card */}
                <div style={{ 
                  margin: '0 20px 24px 20px', 
                  padding: '16px 20px', 
                  backgroundColor: '#fffdf4', 
                  border: '1px solid #fef08a', 
                  borderRadius: 16, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>To: {verifiedRecipient ? verifiedRecipient.name : ''}</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#1f2937' }}>Pay ₹{amount.toFixed(2)}</span>
                  </div>
                  {/* Recipient User Badge */}
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 10, 
                    backgroundColor: '#2563eb', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#ffffff' 
                  }}>
                    <User size={18} />
                  </div>
                </div>

                {/* Centered PIN entry display */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 24px' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Enter your PIN</span>
                  
                  {/* 6 Digit hollow circles */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                    {[0, 1, 2, 3, 4, 5].map(idx => {
                      const hasDigit = idx < upiPin.length;
                      return (
                        <div key={idx} style={{ 
                          width: 14, 
                          height: 14, 
                          borderRadius: '50%', 
                          border: hasDigit ? '2px solid #1f2937' : '2px solid #9ca3af',
                          backgroundColor: hasDigit ? '#1f2937' : 'transparent',
                          transition: 'all 0.1s ease-in-out'
                        }} />
                      );
                    })}
                  </div>
                </div>

                {/* Warning note above keyboard */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 6, 
                  marginBottom: 20, 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: '#6b7280' 
                }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 14, 
                    height: 14, 
                    borderRadius: '50%', 
                    border: '1.5px solid #d97706', 
                    color: '#d97706',
                    fontSize: 9,
                    fontWeight: 800
                  }}>i</span>
                  <span>Never enter your UPI PIN to receive money</span>
                </div>

                {/* Custom Numeric Keypad at the bottom */}
                <div style={{ backgroundColor: '#eef2f6', padding: '20px 24px 28px 24px', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: 16,
                    maxWidth: 340,
                    margin: '0 auto'
                  }}>
                    {/* Row 1 */}
                    <button type="button" onClick={() => handleKeypadPress('1')} style={styles.keypadNum}>1</button>
                    <button type="button" onClick={() => handleKeypadPress('2')} style={styles.keypadNum}>2</button>
                    <button type="button" onClick={() => handleKeypadPress('3')} style={styles.keypadNum}>3</button>

                    {/* Row 2 */}
                    <button type="button" onClick={() => handleKeypadPress('4')} style={styles.keypadNum}>4</button>
                    <button type="button" onClick={() => handleKeypadPress('5')} style={styles.keypadNum}>5</button>
                    <button type="button" onClick={() => handleKeypadPress('6')} style={styles.keypadNum}>6</button>

                    {/* Row 3 */}
                    <button type="button" onClick={() => handleKeypadPress('7')} style={styles.keypadNum}>7</button>
                    <button type="button" onClick={() => handleKeypadPress('8')} style={styles.keypadNum}>8</button>
                    <button type="button" onClick={() => handleKeypadPress('9')} style={styles.keypadNum}>9</button>

                    {/* Row 4 */}
                    <button 
                      type="button" 
                      onClick={() => handleKeypadPress('backspace')} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#1f2937'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                        <line x1="18" y1="9" x2="12" y2="15"></line>
                        <line x1="12" y1="9" x2="18" y2="15"></line>
                      </svg>
                    </button>
                    <button type="button" onClick={() => handleKeypadPress('0')} style={styles.keypadNum}>0</button>
                    <button 
                      type="button" 
                      onClick={() => handleKeypadPress('confirm')}
                      style={{ 
                        backgroundColor: upiPin.length === 6 ? '#2563eb' : '#60a5fa', 
                        color: '#ffffff',
                        borderRadius: 24,
                        border: 'none',
                        fontSize: 16,
                        fontWeight: 800,
                        height: 48,
                        cursor: upiPin.length === 6 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: upiPin.length === 6 ? '0 4px 10px rgba(37, 99, 235, 0.2)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Pay
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* PHASE 2: STANDARD COMMON PAYMENT PAGE */
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Enter payment details */}

                {/* Payment form */}
                <form onSubmit={handleSendPayment} style={{ ...styles.form, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  
                  {/* Centering Wrapper for Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 'auto 0' }}>
                    
                    {/* Payee verified badge card */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      backgroundColor: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      borderRadius: 12, 
                      padding: 12,
                      marginBottom: 4
                    }}>
                      <div style={{ 
                        width: 38, 
                        height: 38, 
                        borderRadius: '50%', 
                        backgroundColor: '#006C49', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#ffffff' 
                      }}>
                        <Check size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          {verifiedRecipient.name}
                        </h4>
                        <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>
                          Verified Name: {verifiedRecipient.name.toUpperCase()}
                        </span>
                      </div>
                      <Info size={18} color="#64748b" />
                    </div>

                    {/* Currency Amount Display */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 12px 0', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: '#16a34a' }}>₹</span>
                        <input 
                          type="number" 
                          value={amount === 0 ? '' : amount} 
                          onChange={e => setAmount(Number(e.target.value))}
                          style={{
                            border: 'none',
                            borderBottom: '2px solid #cbd5e1',
                            fontSize: 36,
                            fontWeight: 800,
                            color: '#0f172a',
                            width: '160px',
                            textAlign: 'center',
                            outline: 'none',
                            backgroundColor: 'transparent'
                          }}
                          min={1}
                          required
                          placeholder="0"
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Enter amount you want to transfer</span>
                    </div>

                    {/* Select note category selection */}
                    <div style={{ ...styles.formGroup, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Transaction Category (Note)</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['essential', 'impulsive', 'other', 'emi'] as const).map(option => {
                          const hasNoLiabilities = option === 'emi' && (!currentUser?.liabilities || currentUser.liabilities.length === 0);
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={hasNoLiabilities}
                              onClick={() => {
                                if (option === 'emi') {
                                  setShowEmiPopup(true);
                                  setSelectedLiabilityId('');
                                } else {
                                  setNote(option);
                                  setCurrentEmiLiability(null);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '10px 4px',
                                borderRadius: 10,
                                border: note === option 
                                  ? '2px solid #006C49' 
                                  : '1px solid #cbd5e1',
                                backgroundColor: hasNoLiabilities 
                                  ? '#f1f5f9' 
                                  : (note === option ? '#E6F4EA' : '#ffffff'),
                                color: hasNoLiabilities 
                                  ? '#94a3b8' 
                                  : (note === option ? '#006C49' : '#475569'),
                                fontWeight: 700,
                                fontSize: 11,
                                textTransform: 'capitalize',
                                cursor: hasNoLiabilities ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                opacity: hasNoLiabilities ? 0.6 : 1
                              }}
                            >
                              {option === 'essential' && '🥦 '}
                              {option === 'impulsive' && '🛍️ '}
                              {option === 'other' && '🏷️ '}
                              {option === 'emi' && '📉 '}
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Linked Bank details */}
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Linked Bank Account</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }}>
                        <div style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 8, 
                          backgroundColor: '#E6F4EA', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#006C49' 
                        }}>
                          <Home size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Small Finance Bank •••• 8829</h5>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            Available Balance: ₹{currentUser.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time ML Prediction Feedback Card */}
                    {liveEvaluation && (
                      <div style={{ ...styles.previewBox, borderColor: themeColors.borderColor, padding: 12, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={16} color={themeColors.primary} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                              Sahayak Assistant Guard:
                            </span>
                          </div>
                          <span style={getPredictedCategoryBadge(liveEvaluation.predictedCategory)}>
                            {liveEvaluation.predictedCategory.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '6px 0 2px 0' }}>
                          <span style={{ color: '#475569' }}>Impulse Risk Score:</span>
                          <span style={{ fontWeight: 700, color: themeColors.textColor }}>
                            {liveEvaluation.riskScore} / 100
                          </span>
                        </div>
                        
                        <div style={styles.progressBarBg}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${liveEvaluation.riskScore}%`,
                            backgroundColor: themeColors.primary
                          }} />
                        </div>

                        {liveEvaluation.roundUpAmount > 0 && (
                          <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            marginTop: 8, 
                            fontSize: 11, 
                            color: '#16a34a', 
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontWeight: 600
                          }}>
                            <input 
                              type="checkbox" 
                              checked={optInRoundUp} 
                              onChange={e => setOptInRoundUp(e.target.checked)}
                              style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                            />
                            <span>Auto Spare Change Round-Up: <strong>+₹{liveEvaluation.roundUpAmount}</strong> → Vault</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    style={{ 
                      ...styles.submitBtn, 
                      backgroundColor: '#16a34a', 
                      width: '100%', 
                      fontSize: 15, 
                      padding: 14, 
                      marginTop: 'auto',
                      fontWeight: 700
                    }}
                  >
                    Proceed to Pay ➔
                  </button>
                </form>

                {/* EMI Liabilities Selector Popup Modal */}
                {showEmiPopup && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: 16
                  }}>
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 16,
                      padding: 20,
                      maxWidth: 360,
                      width: '100%',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16
                    }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Select Periodic Liability</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b' }}>Select one active liability to pay this EMI</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                        {currentUser?.liabilities?.map(liab => {
                          const isSelected = selectedLiabilityId === liab.id;
                          return (
                            <div 
                              key={liab.id}
                              onClick={() => setSelectedLiabilityId(liab.id)}
                              style={{
                                padding: 12,
                                borderRadius: 10,
                                border: isSelected ? '2px solid #006C49' : '1px solid #cbd5e1',
                                backgroundColor: isSelected ? '#E6F4EA' : '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.1s'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{liab.title}</span>
                                <span style={{ fontSize: 10, color: '#64748b' }}>Period: {liab.period_days} days · Last paid: {liab.last_paid_date}</span>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#006C49' }}>₹{liab.amount.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowEmiPopup(false);
                            setNote('other');
                            setCurrentEmiLiability(null);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          disabled={!selectedLiabilityId}
                          onClick={() => {
                            const matched = currentUser?.liabilities?.find(l => l.id === selectedLiabilityId);
                            if (matched) {
                              setNote('emi');
                              setCurrentEmiLiability(matched);
                              setAmount(matched.amount);
                            }
                            setShowEmiPopup(false);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: 8,
                            border: 'none',
                            backgroundColor: '#006C49',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: selectedLiabilityId ? 'pointer' : 'not-allowed',
                            opacity: selectedLiabilityId ? 1 : 0.6
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speed Bump Modal */}
      {activeSpeedBump && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ ...styles.modalIconBg, backgroundColor: activeSpeedBump.evalResult.themeState === 'RED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)' }}>
                <ShieldAlert size={36} color={activeSpeedBump.evalResult.themeState === 'RED' ? '#ef4444' : '#f59e0b'} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '12px 0 4px 0' }}>
                Speed-Bump Reflection Intercept
              </h2>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                {activeSpeedBump.evalResult.themeState === 'RED'
                  ? 'Critical Speed-Bump! High impulse risk exceeding budget limits.'
                  : 'Warning Speed-Bump! Take a breath before spending.'}
              </p>
            </div>

            <div style={styles.modalSummary}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#475569', fontSize: 13 }}>Amount:</span>
                <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 16 }}>₹{activeSpeedBump.tx.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#475569', fontSize: 13 }}>Payee:</span>
                <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>{activeSpeedBump.tx.receiver_upi}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569', fontSize: 13 }}>Risk Score:</span>
                <span style={{ color: activeSpeedBump.evalResult.themeState === 'RED' ? '#dc2626' : '#d97706', fontWeight: 700, fontSize: 14 }}>
                  {activeSpeedBump.evalResult.riskScore} / 100
                </span>
              </div>
            </div>

            <div style={styles.reasonsBox}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                Evaluation Factors:
              </span>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 12, color: '#991b1b' }}>
                {activeSpeedBump.evalResult.reasons.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
            </div>

            {cooldownLeft > 0 ? (
              <div style={styles.cooldownNotice}>
                <Clock size={16} color="#d97706" />
                <span>Reflection Delay: Proceed enabled in <strong>{cooldownLeft}s</strong></span>
              </div>
            ) : (
              <div style={styles.cooldownDoneNotice}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Reflection complete. You may now decide.</span>
              </div>
            )}

            <div style={styles.modalActions}>
              <button onClick={() => handleResolveSpeedBump('CANCEL')} style={styles.cancelBtn}>
                <XCircle size={16} /> Cancel Payment
              </button>
              <button 
                onClick={() => handleResolveSpeedBump('CONFIRM')}
                disabled={cooldownLeft > 0}
                style={{
                  ...styles.confirmBtn,
                  opacity: cooldownLeft > 0 ? 0.5 : 1,
                  cursor: cooldownLeft > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <CheckCircle2 size={16} /> Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav style={{ ...styles.bottomNav, borderTop: `1px solid ${themeColors.borderColor}` }}>
        <button 
          onClick={() => setActiveTab('pay')}
          style={activeTab === 'pay' ? { ...styles.navTab, color: themeColors.primary } : styles.navTab}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          style={activeTab === 'ledger' ? { ...styles.navTab, color: themeColors.primary } : styles.navTab}
        >
          <FileText size={20} />
          <span>Transactions</span>
        </button>
        <button 
          onClick={() => setActiveTab('vault')}
          style={activeTab === 'vault' ? { ...styles.navTab, color: themeColors.primary } : styles.navTab}
        >
          <PiggyBank size={20} />
          <span>Vault</span>
        </button>
        <button 
          onClick={() => setActiveTab('budget')}
          style={activeTab === 'budget' ? { ...styles.navTab, color: themeColors.primary } : styles.navTab}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>

    </div>
  );
}

export default function App() {
  return (
    <RiskThemeProvider>
      <AppContent />
    </RiskThemeProvider>
  );
}

// Helper Badge Styles
function getTypeStyle(type: number, isBlueTheme?: boolean): React.CSSProperties {
  if (isBlueTheme) {
    return { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
  }
  switch (type) {
    case 0: return { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    case 1: return { backgroundColor: '#faf5ff', color: '#7c3aed', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontSize: 10 };
  }
}

function getPredictedCategoryBadge(category: string, isBlueTheme?: boolean): React.CSSProperties {
  if (isBlueTheme) {
    return { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
  }
  switch (category) {
    case 'essential': return { backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    case 'impulsive': return { backgroundColor: '#fff1f2', color: '#e11d48', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    case 'transfers': return { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontSize: 11 };
  }
}

function getStatusBadgeStyle(status: string, isBlueTheme?: boolean): React.CSSProperties {
  if (isBlueTheme) {
    return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
  }
  switch (status) {
    case 'COMPLETED': return { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    case 'SPEED_BUMP_REQUIRED': return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    case 'BLOCKED': return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
  }
}

function getRiskColor(score: number, isBlueTheme?: boolean): string {
  if (isBlueTheme) return '#0284c7';
  if (score >= 60) return '#dc2626';
  if (score >= 35) return '#d97706';
  return '#16a34a';
}

const styles: Record<string, React.CSSProperties> = {
  appShell: { width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: '#0f172a', paddingBottom: 80 },
  centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px 16px', backgroundColor: 'rgba(240, 253, 244, 0.85)', backdropFilter: 'blur(8px)' },
  title: { fontSize: 22, fontWeight: 800, margin: 0, color: '#006C49' },
  themeStateChip: { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12 },
  description: { fontSize: 12, color: '#475569', margin: '2px 0 0 0' },
  statusChip: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', padding: '4px 10px', borderRadius: 16, fontSize: 11, color: '#475569', border: '1px solid #e2e8f0' },
  mainContent: { flex: 1, padding: '16px 16px 80px 16px' },
  tabContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  formRow: { display: 'flex', gap: 10 },
  label: { fontSize: 12, fontWeight: 600, color: '#475569' },
  input: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px', color: '#0f172a', fontSize: 14, outline: 'none' },
  previewBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, border: '1px dashed #cbd5e1' },
  progressBarBg: { height: 6, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', transition: 'width 0.3s ease, background-color 0.3s ease' },
  submitBtn: { color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 },
  notification: { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 },
  vectorBtn: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  activeVectorBtn: { backgroundColor: '#006C49', border: '1px solid #006C49', color: '#ffffff', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  budgetFormulaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' },
  budgetBox: { display: 'flex', flexDirection: 'column', gap: 2, padding: 8, backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0' },
  liabItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' },
  entityList: { display: 'flex', flexDirection: 'column', gap: 8 },
  entityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0' },
  entityName: { fontWeight: 600, fontSize: 13, color: '#0f172a' },
  upiText: { fontSize: 11, color: '#64748b', display: 'block', marginTop: 2 },
  balanceText: { fontWeight: 700, fontSize: 13, color: '#006C49' },
  txList: { display: 'flex', flexDirection: 'column', gap: 8 },
  txItem: { backgroundColor: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' },
  seedBtn: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#006C49', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, maxWidth: 400, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)' },
  modalIconBg: { width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  modalSummary: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 },
  reasonsBox: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 },
  cooldownNotice: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', color: '#d97706', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 },
  cooldownDoneNotice: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', color: '#16a34a', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 },
  modalActions: { display: 'flex', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  confirmBtn: { flex: 1, backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 90, borderTop: '1px solid #e2e8f0', boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)' },
  navTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer' },
  keypadNum: {
    backgroundColor: '#ffffff',
    color: '#1f2937',
    borderRadius: 24,
    border: 'none',
    fontSize: 22,
    fontWeight: '700',
    height: 48,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.1s'
  }
};
