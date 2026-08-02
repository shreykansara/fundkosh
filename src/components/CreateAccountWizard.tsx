import React from 'react';
import { ArrowLeft, Activity, Sparkles } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';

interface CreateAccountWizardProps {
  wizardStep: number;
  setWizardStep: (s: number) => void;
  newUserName: string;
  setNewUserName: (s: string) => void;
  newUserPhone: string;
  setNewUserPhone: (s: string) => void;
  selectedBank: string;
  setSelectedBank: (s: string) => void;
  otpSent: boolean;
  setOtpSent: (b: boolean) => void;
  otpValue: string;
  setOtpValue: (s: string) => void;
  isOtpVerified: boolean;
  setIsOtpVerified: (b: boolean) => void;
  isSmsVerifying: boolean;
  setIsSmsVerifying: (b: boolean) => void;
  smsVerificationMessage: string;
  setSmsVerificationMessage: (s: string) => void;
  newUserIncome: number;
  setNewUserIncome: (n: number) => void;
  newUserThreshold: number;
  setNewUserThreshold: (n: number) => void;
  customLiabilities: {
    title: string;
    amount: number;
    period_days: number;
    last_paid_date: string;
  }[];
  setCustomLiabilities: React.Dispatch<React.SetStateAction<{
    title: string;
    amount: number;
    period_days: number;
    last_paid_date: string;
  }[]>>;
  handleCreateAccount: () => void;
  setShowCreateAccountWizard: (b: boolean) => void;
  isBlueTheme?: boolean;
}

export const CreateAccountWizard: React.FC<CreateAccountWizardProps> = ({
  wizardStep,
  setWizardStep,
  newUserName,
  setNewUserName,
  newUserPhone,
  setNewUserPhone,
  selectedBank,
  setSelectedBank,
  otpSent,
  setOtpSent,
  otpValue,
  setOtpValue,
  isOtpVerified,
  setIsOtpVerified,
  isSmsVerifying,
  setIsSmsVerifying,
  smsVerificationMessage,
  setSmsVerificationMessage,
  newUserIncome,
  setNewUserIncome,
  newUserThreshold,
  setNewUserThreshold,
  customLiabilities,
  setCustomLiabilities,
  handleCreateAccount,
  setShowCreateAccountWizard,
  isBlueTheme
}) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();
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

  const styles: Record<string, React.CSSProperties> = {
    card: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 16, border: '1px solid ' + themeColors.borderColor, boxShadow: themeColors.glowShadow },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 12, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' },
    input: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, borderRadius: 8, padding: '10px', color: themeColors.bodyText, fontSize: 14, outline: 'none' },
    submitBtn: { color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 },
    description: { fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#475569', margin: '2px 0 0 0' }
  };

  return (
    <div style={styles.card}>
      {/* Header and Back Button */}
      {wizardStep < 5 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button 
            onClick={() => {
              if (wizardStep === 1) {
                setShowCreateAccountWizard(false);
              } else {
                setWizardStep(wizardStep - 1);
              }
            }} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <ArrowLeft size={18} color={themeColors.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: themeColors.textColor }}>
              Step {wizardStep} of 4
            </h3>
            <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
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
                backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', 
                borderRadius: 12, 
                padding: 12, 
                border: '1px solid ' + themeColors.borderColor, 
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
                    <label style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>Title</label>
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
                    <label style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>Amount (₹)</label>
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
                    <label style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>Period (Days)</label>
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
                    <label style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>Last Paid Date</label>
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
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
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

          <div style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid ' + themeColors.borderColor, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.textColor }}>Auto-Sweep Threshold</span>
            <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
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
                    backgroundColor: newUserThreshold === val ? themeColors.badgeBg : (isDarkMode ? '#1e293b' : '#ffffff'),
                    color: newUserThreshold === val ? themeColors.textColor : (isDarkMode ? '#cbd5e1' : '#475569'),
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
          <div style={{ width: '100%', height: 4, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '70%', backgroundColor: themeColors.primary, borderRadius: 2 }} className="animate-bounce" />
          </div>
        </div>
      )}
      
    </div>
  );
};
