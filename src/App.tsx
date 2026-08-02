import React, { useEffect, useState, useRef } from 'react';
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
  FlexiRDAccount,
  RiskThemeState
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
  X,
  Mic,
  Volume2,
  MicOff,
  MessageSquare,
  Play,
  VolumeX,
  Trash2,
  Settings,
  Globe
} from 'lucide-react';

import { ReinforcementPredictor, getCurrentContext, PredictionResult } from './engine/ReinforcementModel';
import { bhashiniClient, BhashiniConfig } from './api/bhashiniClient';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { LedgerTab } from './components/LedgerTab';
import { VaultTab } from './components/VaultTab';
import { BudgetTab } from './components/BudgetTab';
import { VoiceTab } from './components/VoiceTab';
import { SandboxTray } from './components/SandboxTray';
import { CreateAccountWizard } from './components/CreateAccountWizard';
import { SpeedBumpModal } from './components/SpeedBumpModal';
import { PaymentModal } from './components/PaymentModal';

const paymentController = new PaymentController();
const speedBumpEvaluator = new SpeedBumpEvaluator();
const statePredictor = new StatePredictor();
const budgetCalculator = new DailyBudgetCalculator();
const reinforcementPredictor = new ReinforcementPredictor();

function AppContent() {
  const { themeState, setThemeState, isDarkMode, setIsDarkMode, getThemeColors } = useRiskTheme();

  const [activeTab, setActiveTab] = useState<'pay' | 'budget' | 'vault' | 'ledger' | 'voice'>('pay');
  const [isDbReady, setIsDbReady] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);

  // Active User Profile Onboarding State
  const [currentUser, setCurrentUser] = useState<Entity | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  // Voice Assistant States
  const [voiceLang, setVoiceLang] = useState<'HI' | 'MR' | 'EN'>('HI');
  const [voiceHistory, setVoiceHistory] = useState<{ id: string; user: string; assistant: string; timestamp: number }[]>([]);

  const [bhashiniConfig, setBhashiniConfig] = useState<BhashiniConfig | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [userQueryText, setUserQueryText] = useState('');
  const [showVoiceSimulator, setShowVoiceSimulator] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load conversation history unique to the selected user profile
  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`fundkosh_voice_history_${currentUser.id}`);
        setVoiceHistory(saved ? JSON.parse(saved) : []);
      } catch {
        setVoiceHistory([]);
      }
    } else {
      setVoiceHistory([]);
    }
  }, [currentUser]);

  // Save conversation history unique to the selected user profile
  useEffect(() => {
    if (currentUser) {
      if (voiceHistory.length > 0) {
        localStorage.setItem(`fundkosh_voice_history_${currentUser.id}`, JSON.stringify(voiceHistory));
      } else {
        localStorage.removeItem(`fundkosh_voice_history_${currentUser.id}`);
      }
    }
  }, [voiceHistory, currentUser]);

  const loadBhashiniConfig = async () => {
    try {
      const config = await bhashiniClient.getPipelineConfig();
      setBhashiniConfig(config);
    } catch (err) {
      console.warn('Failed to load Bhashini pipeline configuration (using offline simulator fallback):', err);
      setBhashiniConfig(null);
    }
  };

  useEffect(() => {
    loadBhashiniConfig();
  }, []);

  const speakText = (text: string, langCode: 'HI' | 'MR' | 'EN') => {
    if (bhashiniConfig) {
      setIsSpeaking(true);
      const bhashiniLang = langCode === 'HI' ? 'hi' : langCode === 'MR' ? 'raj' : 'en';
      bhashiniClient.textToSpeech(text, bhashiniLang, bhashiniConfig)
        .then(base64Audio => {
          const audio = new Audio("data:audio/wav;base64," + base64Audio);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          audio.play();
        })
        .catch(err => {
          console.error("Bhashini TTS error:", err);
          setIsSpeaking(false);
        });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          setIsThinking(true);
          try {
            const bhashiniLang = voiceLang === 'HI' ? 'hi' : voiceLang === 'MR' ? 'raj' : 'en';
            if (bhashiniConfig) {
              const transcribedText = await bhashiniClient.speechToText(base64data, bhashiniLang, bhashiniConfig);
              handleUserQuery(transcribedText);
            } else {
              throw new Error("Bhashini not configured");
            }
          } catch (err: any) {
            console.error("ASR failed:", err);
            setAssistantResponse("Failed to transcribe audio. Please make sure your Bhashini API keys in .env are valid.");
            setIsThinking(false);
          }
        };

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setUserQueryText('');
    } catch (err) {
      console.error("Failed to access microphone:", err);
      // Fallback to simulator if mic access is blocked or rejected
      setShowVoiceSimulator(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const startListening = () => {
    if (isListening) {
      stopRecording();
      return;
    }
    setIsSpeaking(false);

    if (bhashiniConfig) {
      startRecording();
    } else {
      setShowVoiceSimulator(true);
    }
  };

  const generateVoiceResponse = (query: string, lang: 'HI' | 'MR' | 'EN'): { text: string; category: string } => {
    const q = query.toLowerCase();
    
    // 1. Check Compliance / Advice Intent
    const isAdvice = q.includes('advice') || q.includes('invest') || q.includes('stocks') || q.includes('tip') || 
                     q.includes('recommend') || q.includes('सलाह') || q.includes('निवेश') || q.includes('शेयर') ||
                     q.includes('म्यूचुअल') || q.includes('म्युचुअल') || q.includes('फंड');
                     
    if (isAdvice) {
      if (lang === 'EN') {
        return {
          text: "Under SEBI Investment Adviser Regulations, I am a financial information assistant and cannot provide personalized advice or recommendations. I can only display your balance, vault, budgets, and EMIs.",
          category: 'compliance'
        };
      } else if (lang === 'MR') {
        return {
          text: "सेबी (SEBI) नियमां रे मुजब, मैं एक वित्तीय सूचना सहायक हूँ और खुद री कोई निवेश सलाह नी दे सकूँ। पण, मैं थारो बैलेंस, गुल्लक, बजट और ईएमआई दिखा सकूँ।",
          category: 'compliance'
        };
      } else {
        return {
          text: "सेबी (SEBI) निवेश सलाहकार नियमों के तहत, मैं एक वित्तीय सूचना सहायक हूं और व्यक्तिगत निवेश सलाह या सिफारिशें नहीं दे सकता। मैं केवल आपका बैलेंस, गुल्लक, बजट और ईएमआई दिखा सकता हूं।",
          category: 'compliance'
        };
      }
    }

    // 2. Check Balance Intent
    const isBalance = q.includes('balance') || q.includes('money') || q.includes('amount') || q.includes('खाता') || 
                      q.includes('बैलेंस') || q.includes('पैसा') || q.includes('कितना') || q.includes('पिया') || 
                      q.includes('कितरा');
    if (isBalance) {
      const bal = currentUser?.balance || 0;
      if (lang === 'EN') {
        return {
          text: `Your current Small Finance Bank account balance is Rupees ${bal.toLocaleString()}.`,
          category: 'balance'
        };
      } else if (lang === 'MR') {
        return {
          text: `थारो अभी रो खातो बैलेंस ₹${bal.toLocaleString()} है।`,
          category: 'balance'
        };
      } else {
        return {
          text: `आपका वर्तमान खाता बैलेंस ₹${bal.toLocaleString()} है।`,
          category: 'balance'
        };
      }
    }

    // 3. Check Vault Intent
    const isVault = q.includes('vault') || q.includes('savings') || q.includes('save') || q.includes('gulak') || 
                    q.includes('gullak') || q.includes('गुल्लक') || q.includes('बचत') || q.includes('ब्याज');
    if (isVault) {
      const vaultBal = vaultData?.balance || 0;
      const flexiBal = vaultData?.flexi_rd_balance || 0;
      const target = vaultData?.target_threshold || 100;
      const rate = vaultData?.interest_rate || 7.2;
      
      if (lang === 'EN') {
        return {
          text: `You have saved Rupees ${vaultBal} in your vault container. Your sweep target is Rupees ${target}. You also have Rupees ${flexiBal} in your Flexi RD account earning ${rate}% interest.`,
          category: 'vault'
        };
      } else if (lang === 'MR') {
        return {
          text: `थांरी गुल्लक में ₹${vaultBal} बच गया है। थारो स्वीप टारगेट ₹${target} है। थारे कनै फ्लेक्सी आरडी (Flexi RD) में भी ₹${flexiBal} है, जपे ${rate}% ब्याज मिल रह्यो है।`,
          category: 'vault'
        };
      } else {
        return {
          text: `आपने अपने गुल्लक में ₹${vaultBal} बचाए हैं। आपका ऑटो-स्वीप लक्ष्य ₹${target} है। आपके पास फ्लेक्सी आरडी (Flexi RD) में ₹${flexiBal} हैं, जिस पर ${rate}% ब्याज मिल रहा है।`,
          category: 'vault'
        };
      }
    }

    // 4. Check EMI / Liabilities Intent
    const isEMI = q.includes('emi') || q.includes('loan') || q.includes('due') || q.includes('liability') || 
                  q.includes('rent') || q.includes('bill') || q.includes('किस्त') || q.includes('किश्त') || 
                  q.includes('ऋण') || q.includes('देय') || q.includes('दायित्व');
    if (isEMI) {
      const activeLiabs = currentUser?.liabilities?.filter(l => l.is_active) || [];
      if (activeLiabs.length === 0) {
        if (lang === 'EN') return { text: "You do not have any active EMIs or upcoming liabilities.", category: 'emi' };
        if (lang === 'MR') return { text: "थारे कनै कोई एक्टिव ईएमआई या लोन कोनी है।", category: 'emi' };
        return { text: "आपके पास कोई सक्रिय ईएमआई या आगामी देयताएं नहीं हैं।", category: 'emi' };
      }
      
      const totalAmount = activeLiabs.reduce((sum, l) => sum + l.amount, 0);
      const liabDetails = activeLiabs.map(l => `${l.title}: ₹${l.amount}`).join(', ');
      
      if (lang === 'EN') {
        return {
          text: `You have ${activeLiabs.length} active EMIs totaling Rupees ${totalAmount.toLocaleString()}. These are: ${liabDetails}.`,
          category: 'emi'
        };
      } else if (lang === 'MR') {
        return {
          text: `थांरी ${activeLiabs.length} लोन ईएमआई है, जिको कुल रुपिया ₹${totalAmount.toLocaleString()} है। विवरन: ${liabDetails}.`,
          category: 'emi'
        };
      } else {
        return {
          text: `आपकी ${activeLiabs.length} सक्रिय ईएमआई हैं, जिनका कुल मूल्य ₹${totalAmount.toLocaleString()} है। विवरण: ${liabDetails}।`,
          category: 'emi'
        };
      }
    }

    // 5. Check Daily Budget Intent
    const isBudget = q.includes('budget') || q.includes('limit') || q.includes('spend') || q.includes('today') || 
                     q.includes('बजट') || q.includes('खर्च') || q.includes('सीमा');
    if (isBudget) {
      const limit = budgetMetrics?.dailySpendableLimit || 0;
      const spent = budgetMetrics?.todaySpent || 0;
      const remaining = budgetMetrics?.remainingDailyBudget || 0;
      
      if (lang === 'EN') {
        return {
          text: `Your daily spendable limit is Rupees ${limit}. Today you spent Rupees ${spent}. You have Rupees ${remaining} remaining in your daily budget.`,
          category: 'budget'
        };
      } else if (lang === 'MR') {
        return {
          text: `थारो आज रो सीमा ₹${limit} है। आज थें ₹${spent} खरच करिया हो। थारे आज रो बच्योड़ो बजट ₹${remaining} है।`,
          category: 'budget'
        };
      } else {
        return {
          text: `आपकी दैनिक सीमा ₹${limit} है। आज आपने ₹${spent} खर्च किए हैं। आपका आज का बचा हुआ दैनिक बजट ₹${remaining} है।`,
          category: 'budget'
        };
      }
    }

    // Fallback
    if (lang === 'EN') {
      return {
        text: "I didn't quite catch that. Please ask about your account balance, vault savings, upcoming EMIs, or daily budget.",
        category: 'fallback'
      };
    } else if (lang === 'MR') {
      return {
        text: "मने समझ कोनी आयो। थारे बैलेंस, गुल्लक, ईएमआई या बजट रे बारे में पूछो सा।",
        category: 'fallback'
      };
    } else {
      return {
        text: "मुझे ठीक से समझ नहीं आया। कृपया अपने खाता बैलेंस, गुल्लक बचत, आने वाली ईएमआई या दैनिक बजट के बारे में पूछें।",
        category: 'fallback'
      };
    }
  };

  const handleUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    setUserQueryText(queryText);
    setIsThinking(true);
    setTranscriptInput('');
    
    let processedQuery = queryText;
    if (bhashiniConfig && voiceLang !== 'EN') {
      try {
        const sourceLang = voiceLang === 'HI' ? 'hi' : 'raj';
        processedQuery = await bhashiniClient.translate(queryText, sourceLang, 'en', bhashiniConfig);
      } catch (err) {
        console.warn("Bhashini translation failed, matching on original text:", err);
      }
    }
    
    const { text: responseText } = generateVoiceResponse(processedQuery, voiceLang);
    
    setTimeout(() => {
      setIsThinking(false);
      setAssistantResponse(responseText);
      
      const newLog = {
        id: 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        user: queryText,
        assistant: responseText,
        timestamp: Date.now()
      };
      setVoiceHistory(prev => [newLog, ...prev]);
      speakText(responseText, voiceLang);
    }, 800);
  };
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
  const themeColors = isBlueTheme ? (
    isDarkMode ? {
      primary: '#38bdf8',
      bgGradient: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
      cardBg: '#1e293b',
      borderColor: 'rgba(56, 189, 248, 0.2)',
      glowShadow: '0 8px 30px rgba(56, 189, 248, 0.08)',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      textColor: '#38bdf8',
      bodyText: '#f8fafc'
    } : {
      primary: '#0284c7',
      bgGradient: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
      cardBg: '#ffffff',
      borderColor: 'rgba(2, 132, 199, 0.15)',
      glowShadow: '0 8px 30px rgba(2, 132, 199, 0.06)',
      badgeBg: 'rgba(2, 132, 199, 0.1)',
      textColor: '#0284c7',
      bodyText: '#0f172a'
    }
  ) : rawThemeColors;

  const headerBg = isBlueTheme
    ? (isDarkMode ? '#0f172a' : '#F0F9FF')
    : (themeState === 'GREEN' 
        ? (isDarkMode ? '#06110c' : '#e0f2e9') 
        : themeState === 'AMBER' 
          ? (isDarkMode ? '#130f0a' : '#EEE7E3') 
          : (isDarkMode ? '#130909' : '#FBEBE9'));

  const styles: Record<string, React.CSSProperties> = {
    appShell: { width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: themeColors.bodyText, paddingBottom: 80 },
    centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px 16px', backgroundColor: 'transparent' },
    title: { fontSize: 22, fontWeight: 800, margin: 0, color: themeColors.primary },
    themeStateChip: { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12 },
    description: { fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#475569', margin: '2px 0 0 0' },
    statusChip: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: themeColors.cardBg, padding: '4px 10px', borderRadius: 16, fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#475569', border: '1px solid ' + themeColors.borderColor },
    mainContent: { flex: 1, padding: '16px 16px 80px 16px' },
    tabContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 16, border: '1px solid ' + themeColors.borderColor, boxShadow: themeColors.glowShadow },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: themeColors.textColor, margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: 12 },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    formRow: { display: 'flex', gap: 10 },
    label: { fontSize: 12, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' },
    input: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, borderRadius: 8, padding: '10px', color: themeColors.bodyText, fontSize: 14, outline: 'none' },
    previewBox: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 10, border: '1px dashed ' + themeColors.borderColor },
    progressBarBg: { height: 6, width: '100%', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', transition: 'width 0.3s ease, background-color 0.3s ease' },
    submitBtn: { color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 },
    notification: { backgroundColor: themeColors.badgeBg, color: themeColors.textColor, border: '1px solid ' + themeColors.borderColor, padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 },
    vectorBtn: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, color: isDarkMode ? '#cbd5e1' : '#475569', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    activeVectorBtn: { backgroundColor: themeColors.primary, border: '1px solid ' + themeColors.primary, color: '#ffffff', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    budgetFormulaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid ' + themeColors.borderColor },
    budgetBox: { display: 'flex', flexDirection: 'column', gap: 2, padding: 8, backgroundColor: themeColors.cardBg, borderRadius: 8, border: '1px solid ' + themeColors.borderColor },
    liabItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: themeColors.cardBg, padding: '8px 12px', borderRadius: 8, border: '1px solid ' + themeColors.borderColor },
    entityList: { display: 'flex', flexDirection: 'column', gap: 8 },
    entityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: themeColors.cardBg, borderRadius: 8, border: '1px solid ' + themeColors.borderColor },
    entityName: { fontWeight: 600, fontSize: 13, color: themeColors.bodyText },
    upiText: { fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block', marginTop: 2 },
    balanceText: { fontWeight: 700, fontSize: 13, color: themeColors.textColor },
    txList: { display: 'flex', flexDirection: 'column', gap: 8 },
    txItem: { backgroundColor: themeColors.cardBg, padding: 10, borderRadius: 8, border: '1px solid ' + themeColors.borderColor },
    seedBtn: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, color: themeColors.textColor, borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modalContent: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 20, maxWidth: 400, width: '100%', border: '1px solid ' + themeColors.borderColor, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)' },
    modalIconBg: { width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
    modalSummary: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid ' + themeColors.borderColor, marginBottom: 12 },
    reasonsBox: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 },
    cooldownNotice: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', color: '#d97706', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 },
    cooldownDoneNotice: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', color: '#16a34a', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 },
    modalActions: { display: 'flex', gap: 10 },
    cancelBtn: { flex: 1, backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
    confirmBtn: { flex: 1, backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: isDarkMode ? themeColors.cardBg : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 90, borderTop: '1px solid ' + themeColors.borderColor, boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)' },
    navTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, cursor: 'pointer' },
    keypadNum: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      color: themeColors.bodyText,
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
      <div style={{ ...styles.appShell, background: themeColors.bgGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20, color: themeColors.bodyText }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ ...styles.title, fontSize: 36, color: themeColors.primary }}>FundKosh</h1>
          <p style={{ ...styles.description, fontSize: 14, color: isDarkMode ? '#94a3b8' : '#475569' }}>Dynamic Cash Management & Sahayak Friction Engine</p>
        </div>

        {!showCreateAccountWizard ? (
          /* PROFILE SELECTION SCREEN */
          <div style={{ ...styles.card, backgroundColor: themeColors.cardBg, borderColor: themeColors.borderColor }}>
            {/* Theme Toggle Button on Profile Selection Page */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button 
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: themeColors.textColor,
                  fontWeight: 700,
                  fontSize: 12
                }}
              >
                {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
            </div>

            <h2 style={{ ...styles.cardTitle, fontSize: 18, marginBottom: 6, textAlign: 'center', color: themeColors.textColor }}>Choose Your Profile</h2>
            <p style={{ ...styles.description, textAlign: 'center', marginBottom: 20, color: isDarkMode ? '#94a3b8' : '#475569' }}>Select a user account to experience customized daily budgets and auto spare-change sweeps.</p>
            
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
                    border: '1px solid ' + themeColors.borderColor, 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
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
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ ...styles.entityName, fontSize: 14, color: themeColors.bodyText }}>{user.name}</span>
                      <span style={{ ...styles.upiText, fontSize: 11, marginTop: 2, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{user.upi_id}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>Balance</span>
                    <span style={{ ...styles.balanceText, fontSize: 14, color: themeColors.primary }}>₹{user.balance.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid ' + themeColors.borderColor, marginTop: 16, paddingTop: 16 }}>
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
          <CreateAccountWizard
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            newUserName={newUserName}
            setNewUserName={setNewUserName}
            newUserPhone={newUserPhone}
            setNewUserPhone={setNewUserPhone}
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
            otpSent={otpSent}
            setOtpSent={setOtpSent}
            otpValue={otpValue}
            setOtpValue={setOtpValue}
            isOtpVerified={isOtpVerified}
            setIsOtpVerified={setIsOtpVerified}
            isSmsVerifying={isSmsVerifying}
            setIsSmsVerifying={setIsSmsVerifying}
            smsVerificationMessage={smsVerificationMessage}
            setSmsVerificationMessage={setSmsVerificationMessage}
            newUserIncome={newUserIncome}
            setNewUserIncome={setNewUserIncome}
            newUserThreshold={newUserThreshold}
            setNewUserThreshold={setNewUserThreshold}
            customLiabilities={customLiabilities}
            setCustomLiabilities={setCustomLiabilities}
            handleCreateAccount={handleCreateAccount}
            setShowCreateAccountWizard={setShowCreateAccountWizard}
            isBlueTheme={isBlueTheme}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ ...styles.appShell, background: themeColors.bgGradient, color: themeColors.bodyText }}>
      <Header currentUser={currentUser} isBlueTheme={isBlueTheme} />

      <main style={styles.mainContent}>
        {activeTab === 'pay' && (
          <HomeTab
            currentUser={currentUser}
            showBalance={showBalance}
            setShowBalance={setShowBalance}
            vaultData={vaultData}
            handleOpenPaymentModal={handleOpenPaymentModal}
            statusMessage={statusMessage}
            isBlueTheme={isBlueTheme}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerTab
            currentUser={currentUser}
            transactions={transactions}
            isBlueTheme={isBlueTheme}
          />
        )}

        {activeTab === 'vault' && (
          <VaultTab
            currentUser={currentUser}
            vaultData={vaultData}
            senderUpi={senderUpi}
            handleManualSweep={handleManualSweep}
            refreshAppData={refreshAppData}
            isBlueTheme={isBlueTheme}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            budgetMetrics={budgetMetrics}
            liabilities={liabilities}
            isBlueTheme={isBlueTheme}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceTab
            voiceLang={voiceLang}
            setVoiceLang={setVoiceLang}
            voiceHistory={voiceHistory}
            setVoiceHistory={setVoiceHistory}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
            transcriptInput={transcriptInput}
            setTranscriptInput={setTranscriptInput}
            assistantResponse={assistantResponse}
            setAssistantResponse={setAssistantResponse}
            userQueryText={userQueryText}
            setUserQueryText={setUserQueryText}
            startListening={startListening}
            speakText={speakText}
            handleUserQuery={handleUserQuery}
            isBlueTheme={isBlueTheme}
          />
        )}
      </main>

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
          boxShadow: themeColors.glowShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        <HelpCircle size={22} />
      </button>

      {showSandbox && (
        <SandboxTray
          mongoConnected={mongoConnected}
          handleSeedDatabase={handleSeedDatabase}
          setCurrentUser={setCurrentUser}
          setShowSandbox={setShowSandbox}
          weather={weather}
          setWeather={setWeather}
          eventVector={eventVector}
          setEventVector={setEventVector}
          isBlueTheme={isBlueTheme}
        />
      )}

      <PaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        isEnteringUpiPin={isEnteringUpiPin}
        setIsEnteringUpiPin={setIsEnteringUpiPin}
        upiPin={upiPin}
        setUpiPin={setUpiPin}
        bypassSpeedBump={bypassSpeedBump}
        setBypassSpeedBump={setBypassSpeedBump}
        optInRoundUp={optInRoundUp}
        setOptInRoundUp={setOptInRoundUp}
        showEmiPopup={showEmiPopup}
        setShowEmiPopup={setShowEmiPopup}
        selectedLiabilityId={selectedLiabilityId}
        setSelectedLiabilityId={setSelectedLiabilityId}
        currentEmiLiability={currentEmiLiability}
        setCurrentEmiLiability={setCurrentEmiLiability}
        verificationQuery={verificationQuery}
        setVerificationQuery={setVerificationQuery}
        verifiedRecipient={verifiedRecipient}
        setVerifiedRecipient={setVerifiedRecipient}
        verificationError={verificationError}
        setVerificationError={setVerificationError}
        paymentResult={paymentResult}
        setPaymentResult={setPaymentResult}
        amount={amount}
        setAmount={setAmount}
        note={note}
        setNote={setNote}
        entities={entities}
        senderUpi={senderUpi}
        receiverUpi={receiverUpi}
        setReceiverUpi={setReceiverUpi}
        currentUser={currentUser}
        liveEvaluation={liveEvaluation}
        handleVerifyRecipient={handleVerifyRecipient}
        handleSendPayment={handleSendPayment}
        handleKeypadPress={handleKeypadPress}
      />

      {activeSpeedBump && (
        <SpeedBumpModal
          activeSpeedBump={activeSpeedBump}
          cooldownLeft={cooldownLeft}
          handleResolveSpeedBump={handleResolveSpeedBump}
        />
      )}

      {showVoiceSimulator && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.primary, display: 'flex', alignItems: 'center', gap: 6 }}>
                🎤 Voice Demo Simulator
              </span>
              <button 
                onClick={() => setShowVoiceSimulator(false)}
                style={{ background: 'none', border: 'none', color: isDarkMode ? '#cbd5e1' : '#475569', cursor: 'pointer', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ ...styles.description, fontSize: 11, marginBottom: 16, lineHeight: '1.4' }}>
              Select a phrase to simulate speaking into the microphone for the demonstration:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(voiceLang === 'EN' ? [
                'What is my account balance?',
                'Check my vault savings',
                'What is my daily budget?',
                'Show upcoming EMIs',
                'Give investment advice'
              ] : voiceLang === 'MR' ? [
                'खाते में कितरा पिया है?',
                'गुल्लक री बचत कतरी है?',
                'म्हारो आज रो बजट कितरो है?',
                'लोन री EMI दिखाओ',
                'कमाई कटे निवेश करां?'
              ] : [
                'खाता बैलेंस कितना है?',
                'गुल्लक में कितनी बचत है?',
                'मेरा आज का बजट क्या है?',
                'आने वाली EMI दिखाओ',
                'पैसे कहां निवेश करें?'
              ]).map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setShowVoiceSimulator(false);
                    setIsListening(true);
                    setUserQueryText(phrase);
                    setTimeout(() => {
                      setIsListening(false);
                      handleUserQuery(phrase);
                    }, 1500);
                  }}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: `1px solid ${themeColors.borderColor}`,
                    color: themeColors.bodyText,
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  " {phrase} "
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav style={{ 
        ...styles.bottomNav, 
        backgroundColor: isDarkMode ? themeColors.cardBg : 'rgba(255, 255, 255, 0.95)',
        borderTop: `1px solid ${themeColors.borderColor}` 
      }}>
        <button 
          onClick={() => setActiveTab('pay')}
          style={activeTab === 'pay' 
            ? { ...styles.navTab, color: themeColors.textColor } 
            : { ...styles.navTab, color: isDarkMode ? '#94a3b8' : '#64748b' }
          }
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          style={activeTab === 'ledger' 
            ? { ...styles.navTab, color: themeColors.textColor } 
            : { ...styles.navTab, color: isDarkMode ? '#94a3b8' : '#64748b' }
          }
        >
          <FileText size={20} />
          <span>Transactions</span>
        </button>
        <button 
          onClick={() => setActiveTab('vault')}
          style={activeTab === 'vault' 
            ? { ...styles.navTab, color: themeColors.textColor } 
            : { ...styles.navTab, color: isDarkMode ? '#94a3b8' : '#64748b' }
          }
        >
          <PiggyBank size={20} />
          <span>Vault</span>
        </button>
        <button 
          onClick={() => setActiveTab('voice')}
          style={activeTab === 'voice' 
            ? { ...styles.navTab, color: themeColors.textColor } 
            : { ...styles.navTab, color: isDarkMode ? '#94a3b8' : '#64748b' }
          }
        >
          <Mic size={20} />
          <span>Voice</span>
        </button>
        <button 
          onClick={() => setActiveTab('budget')}
          style={activeTab === 'budget' 
            ? { ...styles.navTab, color: themeColors.textColor } 
            : { ...styles.navTab, color: isDarkMode ? '#94a3b8' : '#64748b' }
          }
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
function getTypeStyle(type: number, isBlueTheme?: boolean, isDark?: boolean): React.CSSProperties {
  if (isDark) {
    if (isBlueTheme) return { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    switch (type) {
      case 0: return { backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
      case 1: return { backgroundColor: 'rgba(124, 58, 237, 0.15)', color: '#c084fc', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
      default: return { backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontSize: 10 };
    }
  }
  if (isBlueTheme) {
    return { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
  }
  switch (type) {
    case 0: return { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    case 1: return { backgroundColor: '#faf5ff', color: '#7c3aed', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontSize: 10 };
  }
}

function getPredictedCategoryBadge(category: string, isBlueTheme?: boolean, isDark?: boolean): React.CSSProperties {
  if (isDark) {
    if (isBlueTheme) return { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    switch (category) {
      case 'essential': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
      case 'impulsive': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
      case 'transfers': return { backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
      default: return { backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11 };
    }
  }
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

function getStatusBadgeStyle(status: string, isBlueTheme?: boolean, isDark?: boolean): React.CSSProperties {
  if (isDark) {
    if (isBlueTheme) return { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    switch (status) {
      case 'COMPLETED': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
      case 'SPEED_BUMP_REQUIRED': return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
      case 'BLOCKED': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
      default: return { backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 };
    }
  }
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

function getRiskColor(score: number, isBlueTheme?: boolean, isDark?: boolean): string {
  if (isDark) {
    if (isBlueTheme) return '#38bdf8';
    if (score >= 60) return '#f87171';
    if (score >= 35) return '#fbbf24';
    return '#34d399';
  }
  if (isBlueTheme) return '#0284c7';
  if (score >= 60) return '#dc2626';
  if (score >= 35) return '#d97706';
  return '#16a34a';
}

// styles object is now dynamically declared inside the AppContent component for context themes support.
