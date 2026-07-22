import React, { useEffect, useState } from 'react';
import { 
  RiskThemeProvider, 
  useRiskTheme 
} from './context/RiskThemeContext';
import { 
  Entity, 
  Liability, 
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
  Award
} from 'lucide-react';

const paymentController = new PaymentController();
const speedBumpEvaluator = new SpeedBumpEvaluator();
const statePredictor = new StatePredictor();
const budgetCalculator = new DailyBudgetCalculator();

function AppContent() {
  const { themeState, setThemeState, getThemeColors } = useRiskTheme();
  const themeColors = getThemeColors();

  const [activeTab, setActiveTab] = useState<'pay' | 'budget' | 'vault' | 'ledger'>('pay');
  const [isDbReady, setIsDbReady] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);

  // Active User Profile Onboarding State
  const [currentUser, setCurrentUser] = useState<Entity | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  const handleOpenPaymentModal = () => {
    setVerificationQuery('');
    setVerifiedRecipient(null);
    setVerificationError(null);
    setPaymentResult(null);
    setAmount(0);
    setNote('');
    setIsPaymentModalOpen(true);
  };

  const handleVerifyRecipient = () => {
    setVerificationError(null);
    setVerifiedRecipient(null);
    const query = verificationQuery.trim().toLowerCase();
    if (!query) {
      setVerificationError('Please enter a phone number or UPI ID');
      return;
    }
    // Scan entities for match
    const matched = entities.find(e => 
      e.upi_id.toLowerCase() === query || 
      (e.phone && e.phone.replace(/[\s\-\+]/g, '').endsWith(query.replace(/[\s\-\+]/g, '')))
    );

    if (matched) {
      if (matched.upi_id === senderUpi) {
        setVerificationError('Cannot pay yourself!');
        return;
      }
      setVerifiedRecipient(matched);
      setReceiverUpi(matched.upi_id);
    } else {
      setVerificationError('Recipient not found in directory. Please verify credentials.');
    }
  };

  // User & Simulator Form Inputs
  const [senderUpi, setSenderUpi] = useState('');
  const [receiverUpi, setReceiverUpi] = useState('gigatech@upi');
  const [amount, setAmount] = useState<number>(1500);
  const [note, setNote] = useState('Wireless Earbuds');

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

  // Load Data & Run App-Launch Prediction
  const refreshAppData = async () => {
    const health = await apiClient.checkHealth();
    setMongoConnected(health.mongoConnected);

    const [e, l, t, v] = await Promise.all([
      apiClient.getEntities(),
      apiClient.getLiabilities(),
      apiClient.getTransactions(),
      apiClient.getVault()
    ]);

    setEntities(e);
    setLiabilities(l);
    setTransactions(t);
    setVaultData(v);
    setIsDbReady(true);

    const activeUpi = currentUser?.upi_id || senderUpi;
    if (activeUpi) {
      // Proactive Launch State Prediction
      const state = await statePredictor.predictUserState(activeUpi);
      setUserState(state);

      const bMetrics = await budgetCalculator.calculateMetrics(activeUpi, weather, eventVector);
      setBudgetMetrics(bMetrics);

      // Sync App Baseline Theme to Launch State
      setThemeState(state.themeState);
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

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const result = await paymentController.initiatePayment(senderUpi, receiverUpi, amount, note, weather, eventVector);

    if (result.status === 'SPEED_BUMP_REQUIRED' && result.evaluationResult) {
      setActiveSpeedBump({
        tx: result.transaction,
        evalResult: result.evaluationResult
      });
      setCooldownLeft(result.evaluationResult.suggestedCooldownSeconds);
      setStatusMessage('⚡ Speed-Bump Intercept Triggered! Take a moment to reflect.');
    } else if (result.status === 'COMPLETED') {
      let msg = `✅ Payment of ₹${amount.toLocaleString()} completed! (Round-Up: ₹${result.transaction.round_up_amount} → Vault).`;
      if (result.vaultSwept) {
        msg += ` 🐖 Vault reached target threshold & auto-swept to 7.2% Flexi-RD!`;
      }
      setStatusMessage(msg);
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

    const res = await paymentController.resolveSpeedBump(activeSpeedBump.tx.id, choice);
    setActiveSpeedBump(null);

    if (res.status === 'COMPLETED') {
      let msg = `✅ Payment confirmed after Speed-Bump reflection! (Round-Up: ₹${res.transaction.round_up_amount} → Vault).`;
      if (res.vaultSwept) {
        msg += ` 🐖 Vault auto-swept to 7.2% Flexi-RD!`;
      }
      setStatusMessage(msg);
      setPaymentResult({
        status: 'SUCCESS',
        txId: res.transaction.id,
        amount: res.transaction.amount,
        payeeName: verifiedRecipient ? verifiedRecipient.name : res.transaction.receiver_upi.split('@')[0],
        payeeUpi: res.transaction.receiver_upi,
        timestamp: Date.now()
      });
      setIsPaymentModalOpen(true);

      const updatedEntities = await apiClient.getEntities();
      const updatedMe = updatedEntities.find(ent => ent.upi_id === senderUpi);
      if (updatedMe) {
        setCurrentUser(updatedMe);
      }
    } else if (res.status === 'BLOCKED') {
      setStatusMessage(`🛑 Payment cancelled. Funds preserved safely!`);
      setPaymentResult({
        status: 'FAILED',
        txId: activeSpeedBump.tx.id,
        amount: activeSpeedBump.tx.amount,
        payeeName: verifiedRecipient ? verifiedRecipient.name : activeSpeedBump.tx.receiver_upi.split('@')[0],
        payeeUpi: activeSpeedBump.tx.receiver_upi,
        timestamp: Date.now(),
        errorMessage: 'Payment cancelled during reflection cooldown.'
      });
      setIsPaymentModalOpen(true);
    }
    refreshAppData();
  };

  const handleSeedDatabase = async () => {
    await apiClient.seedDatabase();
    // After seeding database, clear current user session to force re-selection
    setCurrentUser(null);
    await refreshAppData();
    setStatusMessage('🌱 Database re-seeded with initial entities, liabilities, rules, and vault.');
  };

  const handleManualSweep = async () => {
    await apiClient.manualSweepVault();
    await refreshAppData();
    setStatusMessage('🐖 Manual sweep executed! All spare change moved to 7.2% Flexi-RD.');
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
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ ...styles.title, fontSize: 36, color: '#006C49' }}>FundKosh</h1>
          <p style={{ ...styles.description, fontSize: 14 }}>Dynamic Cash Management & Sahayak Friction Engine</p>
        </div>

        <div style={styles.card}>
          <h2 style={{ ...styles.cardTitle, fontSize: 18, marginBottom: 6, textAlign: 'center' }}>Choose Your Profile</h2>
          <p style={{ ...styles.description, textAlign: 'center', marginBottom: 20 }}>Select a user account to experience customized daily budgets and auto spare-change sweeps.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entities.filter(e => e.type === 'user' || e.type === 'family').map(user => (
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
                    backgroundColor: '#006C49', 
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
                  <span style={{ ...styles.balanceText, fontSize: 14 }}>₹{user.balance.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedReceiver = entities.find(e => e.upi_id === receiverUpi);

  return (
    <div style={{ ...styles.appShell, background: '#F0FDF4' }}>
      
      {/* Mobile Top Header */}
      <header style={{ ...styles.header, borderBottom: 'none', backgroundColor: '#F0FDF4', padding: '16px 16px 8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User Profile Avatar */}
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: '50%', 
            overflow: 'hidden',
            border: '2px solid #006C49',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ color: '#006C49', fontWeight: 700, fontSize: 16 }}>
              {currentUser.name[0]}
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#006C49', margin: 0 }}>
              Ram Ram, {currentUser.name.split(' ')[0]} Ji!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <MapPin size={12} color="#64748b" />
              <span style={{ fontSize: 11, color: '#64748b' }}>Mansarovar, Jaipur</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...styles.themeStateChip, backgroundColor: themeColors.badgeBg, color: themeColors.textColor, fontSize: 9 }}>
            🛡️ {themeState}
          </span>
          <button style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
            <Bell size={22} color="#006C49" />
          </button>
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

            {/* Scan QR Code Button */}
            <button 
              onClick={handleOpenPaymentModal}
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={handleOpenPaymentModal}>
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

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={handleOpenPaymentModal}>
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

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={handleOpenPaymentModal}>
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
                  <Wallet size={22} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>Self-Transfer</span>
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

            {/* Rider Bachat Deals Section */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#006C49', margin: 0 }}>
                  Rider Bachat Deals
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                  VIEW ALL
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                overflowX: 'auto', 
                gap: 12, 
                paddingBottom: 8,
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
              }}>
                {/* Deal Card 1 */}
                <div style={{ 
                  flex: '0 0 240px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        ₹ 50 Off Engine Oil
                      </h4>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 2 }}>
                        Mansarovar Service Center
                      </span>
                    </div>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 8, 
                      backgroundColor: '#E6F4EA', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#006C49'
                    }}>
                      <Coins size={16} />
                    </div>
                  </div>
                  <button 
                    onClick={() => setStatusMessage('🎟️ Voucher Claimed! Show the code at Mansarovar Service Center.')}
                    style={{
                      width: '100%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Claim Voucher
                  </button>
                </div>

                {/* Deal Card 2 */}
                <div style={{ 
                  flex: '0 0 240px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Free Bike Wash
                      </h4>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 2 }}>
                        Jaipur Moto Cleaners
                      </span>
                    </div>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 8, 
                      backgroundColor: '#E6F4EA', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#006C49'
                    }}>
                      <Coins size={16} />
                    </div>
                  </div>
                  <button 
                    onClick={() => setStatusMessage('🎟️ Wash Voucher Claimed! Present at Jaipur Moto Cleaners.')}
                    style={{
                      width: '100%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Claim Voucher
                  </button>
                </div>
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
                  backgroundColor: '#006C49', 
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
                    <span style={getTypeStyle(currentUser.type)}>{currentUser.type.toUpperCase()}</span>
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
                  <TrendingUp size={20} color="#10b981" />
                  <h2 style={styles.cardTitle}>Daily Budget Engine</h2>
                </div>

                <div style={styles.budgetFormulaGrid}>
                  <div style={styles.budgetBox}>
                    <span style={{ fontSize: 11, color: '#475569' }}>Est. Monthly Income</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#006C49' }}>
                      ₹{budgetMetrics.predictedMonthlyIncome.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.budgetBox}>
                    <span style={{ fontSize: 11, color: '#475569' }}>Fixed Bills (30d)</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>
                      - ₹{budgetMetrics.totalActiveLiabilities.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ ...styles.budgetBox, borderColor: '#16a34a' }}>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Daily Limit</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
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
                      backgroundColor: budgetMetrics.remainingDailyBudget > 0 ? '#16a34a' : '#dc2626'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: budgetMetrics.remainingDailyBudget > 0 ? '#16a34a' : '#dc2626', display: 'block', marginTop: 6, fontWeight: 600 }}>
                    Remaining Budget Buffer: ₹{budgetMetrics.remainingDailyBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Active Liabilities Table */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Calendar size={20} color="#d97706" />
                <h2 style={styles.cardTitle}>Upcoming Fixed Obligations</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {liabilities.map(liab => (
                  <div key={liab.id} style={styles.liabItem}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{liab.title}</span>
                      <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>Due in {liab.due_in_days} days</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>₹{liab.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: VAULT & FLEXI-RD MICRO-SAVINGS */}
        {activeTab === 'vault' && (
          <div style={styles.tabContainer}>
            
            {/* Vault Metrics */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <PiggyBank size={20} color="#16a34a" />
                <h2 style={styles.cardTitle}>Automated Round-Up Vault</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ ...styles.budgetBox, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Spare Change Vault</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#006C49' }}>
                    ₹{(vaultData?.balance || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Auto-Sweep Target: ₹{vaultData?.target_threshold}</span>
                </div>

                <div style={{ ...styles.budgetBox, backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
                  <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Flexi-RD Savings (7.2%)</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>
                    ₹{(vaultData?.flexi_rd_balance || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>Sweeps Completed: {vaultData?.total_sweeps_count || 0}</span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 13, color: '#475569' }}>Set Auto-Sweep Threshold:</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {[100, 150, 200, 500].map(val => (
                    <button 
                      key={val}
                      onClick={() => apiClient.updateVaultThreshold(val).then(refreshAppData)}
                      style={vaultData?.target_threshold === val ? styles.activeVectorBtn : styles.vectorBtn}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleManualSweep}
                style={{ ...styles.submitBtn, backgroundColor: '#006C49', marginTop: 16 }}
              >
                Execute Manual Sweep to 7.2% Flexi-RD
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: AUDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div style={styles.tabContainer}>
            
            {/* Counterparties list */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Wallet size={20} color="#006C49" />
                <h2 style={styles.cardTitle}>Registered Counterparties</h2>
              </div>

              <div style={styles.entityList}>
                {entities.map(entity => (
                  <div key={entity.id} style={entity.id === currentUser.id ? { ...styles.entityItem, borderColor: '#006C49', backgroundColor: '#f0fdf4' } : styles.entityItem}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={styles.entityName}>{entity.name}</span>
                        <span style={getTypeStyle(entity.type)}>{entity.type.toUpperCase()}</span>
                      </div>
                      <span style={styles.upiText}>{entity.upi_id}</span>
                    </div>
                    <span style={styles.balanceText}>₹{entity.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Activity size={20} color="#006C49" />
                <h2 style={styles.cardTitle}>Transaction History</h2>
              </div>
              <div style={styles.txList}>
                {transactions.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                    No transactions recorded yet. Initiate a payment to populate ledger.
                  </div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} style={styles.txItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {tx.sender_upi === currentUser.upi_id ? 'You' : tx.sender_upi.split('@')[0]} → {tx.receiver_upi.split('@')[0]}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          ₹{tx.amount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={getStatusBadgeStyle(tx.status)}>{tx.status}</span>
                          <span style={getPredictedCategoryBadge(tx.predicted_category)}>{tx.predicted_category}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: getRiskColor(tx.risk_score) }}>
                            Score: {tx.risk_score}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
          backgroundColor: '#006C49',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 10px rgba(0, 108, 73, 0.3)',
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
              maxWidth: 480,
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
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, position: 'relative', width: '90%', maxWidth: 400, padding: 24 }}>
            
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <XCircle size={22} />
            </button>

            {/* PHASE 3: STATUS SCREENS */}
            {paymentResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {paymentResult.status === 'SUCCESS' ? (
                  /* PAYMENT SUCCESS VIEW */
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
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

                    <button 
                      onClick={() => setIsPaymentModalOpen(false)}
                      style={{ ...styles.submitBtn, backgroundColor: '#006C49', width: '100%', marginTop: 12 }}
                    >
                      Back to Home
                    </button>
                  </div>
                ) : (
                  /* PAYMENT FAILED VIEW */
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
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

                    <button 
                      onClick={() => setPaymentResult(null)}
                      style={{ ...styles.submitBtn, backgroundColor: '#dc2626', width: '100%' }}
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => setIsPaymentModalOpen(false)}
                      style={{ ...styles.submitBtn, backgroundColor: '#64748b', width: '100%', marginTop: -4 }}
                    >
                      Back to Home
                    </button>
                  </div>
                )}
              </div>
            ) : !verifiedRecipient ? (
              /* PHASE 1: VERIFICATION SCREEN */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <ArrowRightLeft size={20} color="#006C49" />
                  <h2 style={{ ...styles.cardTitle, fontSize: 18, color: '#006C49' }}>Pay to Contact</h2>
                </div>

                <div style={{ ...styles.form, marginTop: 12 }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Recipient's UPI ID / Phone Number</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="text" 
                        value={verificationQuery}
                        onChange={e => setVerificationQuery(e.target.value)}
                        placeholder="e.g. sunitadevi@upi or +91 94140 54321"
                        style={{ ...styles.input, flex: 1 }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVerifyRecipient();
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={handleVerifyRecipient}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0 16px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Verify
                      </button>
                    </div>
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

                  <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px dashed #bbf7d0' }}>
                    <span style={{ fontSize: 11, color: '#006C49', fontWeight: 700, display: 'block', marginBottom: 4 }}>💡 Quick Directory Search Hint:</span>
                    <span style={{ fontSize: 11, color: '#475569', lineHeight: '1.4' }}>
                      Try paying <strong>Sunita Devi</strong> via her phone number <code>94140 54321</code> or UPI <code>sunitadevi@upi</code>.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* PHASE 2: STANDARD COMMON PAYMENT PAGE */
              <div>
                {/* Back button and title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button 
                    onClick={() => {
                      setVerifiedRecipient(null);
                      setAmount(0);
                    }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <ArrowLeft size={20} color="#006C49" />
                  </button>
                  <h2 style={{ ...styles.cardTitle, fontSize: 18, color: '#006C49' }}>Pay to UPI ID</h2>
                </div>

                {/* Payee verified badge card */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: 12, 
                  padding: 12, 
                  marginBottom: 16 
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

                {/* Payment form */}
                <form onSubmit={handleSendPayment} style={styles.form}>
                  
                  {/* Currency Amount Display */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0 16px 0', gap: 6 }}>
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

                  {/* Add note section */}
                  <div style={{ ...styles.formGroup, marginBottom: 12 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <FileText size={18} color="#64748b" style={{ position: 'absolute', left: 12 }} />
                      <input 
                        type="text" 
                        value={note} 
                        onChange={e => setNote(e.target.value)}
                        placeholder="Add a note (e.g. Dinner, Rent)"
                        style={{ ...styles.input, paddingLeft: 38, width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Linked Bank details */}
                  <div style={{ marginBottom: 12 }}>
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
                    <div style={{ ...styles.previewBox, borderColor: themeColors.borderColor, padding: 12 }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: '#16a34a' }}>
                          <Coins size={14} />
                          Auto Spare Change Round-Up: <strong>+₹{liveEvaluation.roundUpAmount}</strong> → Vault
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    style={{ ...styles.submitBtn, backgroundColor: '#16a34a', width: '100%', fontSize: 15, padding: 14 }}
                  >
                    Proceed to Pay ➔
                  </button>
                </form>
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
function getTypeStyle(type: string): React.CSSProperties {
  switch (type) {
    case 'user': return { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    case 'family': return { backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    case 'merchant': return { backgroundColor: '#faf5ff', color: '#7c3aed', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    case 'gig_platform': return { backgroundColor: '#f0fdfa', color: '#0d9488', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontSize: 10 };
  }
}

function getPredictedCategoryBadge(category: string): React.CSSProperties {
  switch (category) {
    case 'essential': return { backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    case 'impulsive': return { backgroundColor: '#fff1f2', color: '#e11d48', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    case 'transfers': return { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontSize: 11 };
  }
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'COMPLETED': return { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    case 'SPEED_BUMP_REQUIRED': return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    case 'BLOCKED': return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
  }
}

function getRiskColor(score: number): string {
  if (score >= 60) return '#dc2626';
  if (score >= 35) return '#d97706';
  return '#16a34a';
}

const styles: Record<string, React.CSSProperties> = {
  appShell: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: '#0f172a', paddingBottom: 70 },
  centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px 16px', backgroundColor: 'rgba(240, 253, 244, 0.85)', backdropFilter: 'blur(8px)' },
  title: { fontSize: 22, fontWeight: 800, margin: 0, color: '#006C49' },
  themeStateChip: { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12 },
  description: { fontSize: 12, color: '#475569', margin: '2px 0 0 0' },
  statusChip: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', padding: '4px 10px', borderRadius: 16, fontSize: 11, color: '#475569', border: '1px solid #e2e8f0' },
  mainContent: { flex: 1, padding: 16 },
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
  txList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' },
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
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', maxWidth: 480, width: '100%', height: 60, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 90, borderTop: '1px solid #e2e8f0', boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)' },
  navTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer' }
};
