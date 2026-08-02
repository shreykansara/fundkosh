import React from 'react';
import { ArrowLeft, Check, CheckCircle2, XCircle, Home, Award, X, User, Info, Sparkles } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity, EmbeddedLiability, SpeedBumpEvaluationResult } from '../domain/models';

interface PaymentModalProps {
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (b: boolean) => void;
  paymentMode: 'PHONE' | 'UPI';
  setPaymentMode: (mode: 'PHONE' | 'UPI') => void;
  isEnteringUpiPin: boolean;
  setIsEnteringUpiPin: (b: boolean) => void;
  upiPin: string;
  setUpiPin: React.Dispatch<React.SetStateAction<string>>;
  bypassSpeedBump: boolean;
  setBypassSpeedBump: (b: boolean) => void;
  optInRoundUp: boolean;
  setOptInRoundUp: (b: boolean) => void;
  showEmiPopup: boolean;
  setShowEmiPopup: (b: boolean) => void;
  selectedLiabilityId: string;
  setSelectedLiabilityId: (s: string) => void;
  currentEmiLiability: EmbeddedLiability | null;
  setCurrentEmiLiability: (l: EmbeddedLiability | null) => void;
  verificationQuery: string;
  setVerificationQuery: (s: string) => void;
  verifiedRecipient: Entity | null;
  setVerifiedRecipient: (e: Entity | null) => void;
  verificationError: string | null;
  setVerificationError: (s: string | null) => void;
  paymentResult: {
    status: 'SUCCESS' | 'FAILED';
    txId: string;
    amount: number;
    payeeName: string;
    payeeUpi: string;
    timestamp: number;
    errorMessage?: string;
  } | null;
  setPaymentResult: (res: any) => void;
  amount: number;
  setAmount: (n: number) => void;
  note: 'essential' | 'impulsive' | 'other' | 'emi';
  setNote: (n: 'essential' | 'impulsive' | 'other' | 'emi') => void;
  entities: Entity[];
  senderUpi: string;
  receiverUpi: string;
  setReceiverUpi: (s: string) => void;
  currentUser: Entity;
  liveEvaluation: SpeedBumpEvaluationResult | null;
  handleVerifyRecipient: () => void;
  handleSendPayment: (e?: React.FormEvent) => Promise<void>;
  handleKeypadPress: (key: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  paymentMode,
  setPaymentMode,
  isEnteringUpiPin,
  setIsEnteringUpiPin,
  upiPin,
  setUpiPin,
  bypassSpeedBump,
  setBypassSpeedBump,
  optInRoundUp,
  setOptInRoundUp,
  showEmiPopup,
  setShowEmiPopup,
  selectedLiabilityId,
  setSelectedLiabilityId,
  currentEmiLiability,
  setCurrentEmiLiability,
  verificationQuery,
  setVerificationQuery,
  verifiedRecipient,
  setVerifiedRecipient,
  verificationError,
  setVerificationError,
  paymentResult,
  setPaymentResult,
  amount,
  setAmount,
  note,
  setNote,
  entities,
  senderUpi,
  receiverUpi,
  setReceiverUpi,
  currentUser,
  liveEvaluation,
  handleVerifyRecipient,
  handleSendPayment,
  handleKeypadPress
}) => {
  const { isDarkMode } = useRiskTheme();
  const themeColors = isDarkMode ? {
    primary: '#38bdf8',
    cardBg: '#1e293b',
    borderColor: 'rgba(56, 189, 248, 0.2)',
    glowShadow: '0 8px 30px rgba(56, 189, 248, 0.08)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    textColor: '#38bdf8',
    bodyText: '#f8fafc'
  } : {
    primary: '#0284c7',
    cardBg: '#ffffff',
    borderColor: 'rgba(2, 132, 199, 0.15)',
    glowShadow: '0 8px 30px rgba(2, 132, 199, 0.06)',
    badgeBg: 'rgba(2, 132, 199, 0.1)',
    textColor: '#0284c7',
    bodyText: '#0f172a'
  };

  if (!isPaymentModalOpen) return null;

  const styles: Record<string, React.CSSProperties> = {
    form: { display: 'flex', flexDirection: 'column', gap: 12 },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 12, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' },
    input: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, borderRadius: 8, padding: '10px', color: themeColors.bodyText, fontSize: 14, outline: 'none' },
    submitBtn: { color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 },
    previewBox: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 10, border: '1px dashed ' + themeColors.borderColor },
    progressBarBg: { height: 6, width: '100%', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', transition: 'width 0.3s ease, background-color 0.3s ease' },
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
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
        borderBottom: '1px solid ' + themeColors.borderColor, 
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
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
            color: themeColors.primary
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: themeColors.textColor, marginLeft: 12 }}>
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
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: 0 }}>Payment Successful</h2>
                  <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Transaction ID: {paymentResult.txId}</span>

                  <span style={{ fontSize: 32, fontWeight: 800, color: themeColors.textColor, margin: '8px 0' }}>
                    ₹{paymentResult.amount.toLocaleString()}
                  </span>

                  <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                    📅 {new Date(paymentResult.timestamp).toLocaleString()}
                  </span>

                  {/* Recipient info */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', 
                    border: '1px solid ' + themeColors.borderColor, 
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
                      backgroundColor: themeColors.primary, 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      {paymentResult.payeeName[0]}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: themeColors.textColor }}>{paymentResult.payeeName}</h4>
                      <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>{paymentResult.payeeUpi}</span>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#16a34a' }}>
                      <CheckCircle2 size={16} />
                    </div>
                  </div>

                  {/* Source details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                    <Home size={14} />
                    <span>Paid from Small Finance Bank •••• 8829</span>
                  </div>

                  {/* Reward Card */}
                  <div style={{ 
                    width: '100%', 
                    background: isDarkMode ? 'linear-gradient(135deg, #06110c 0%, #101c16 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                    border: '1px solid ' + themeColors.borderColor,
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
                      <h5 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>New Reward Earned!</h5>
                      <span style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#16a34a' }}>Tap to scratch and reveal coupon</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{ ...styles.submitBtn, backgroundColor: themeColors.primary, width: '100%', marginTop: 'auto' }}
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
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', margin: 0 }}>Payment Failed</h2>
                  <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Transaction ID: {paymentResult.txId}</span>

                  <span style={{ fontSize: 32, fontWeight: 800, color: themeColors.textColor, margin: '8px 0' }}>
                    ₹{paymentResult.amount.toLocaleString()}
                  </span>

                  <div style={{ 
                    backgroundColor: isDarkMode ? '#311212' : '#fff1f2', 
                    border: '1px solid #fecaca', 
                    color: '#ef4444', 
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
                    style={{ ...styles.submitBtn, backgroundColor: '#ef4444', width: '100%', margin: 0 }}
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
            <p style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : '#475569', marginBottom: 16 }}>
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
                  backgroundColor: isDarkMode ? '#311212' : '#fff1f2', 
                  border: '1px solid #fecaca', 
                  color: '#ef4444', 
                  padding: 10, 
                  borderRadius: 8, 
                  fontSize: 12,
                  marginTop: 4,
                  fontWeight: 600
                }}>
                  ⚠️ {verificationError}
                </div>
              )}

              {/* DISPLAY AVAILABLE CREDENTIALS */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: themeColors.primary, display: 'block', marginBottom: 8 }}>
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
                          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                          border: '1px solid ' + themeColors.borderColor,
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 12,
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: themeColors.bodyText }}>{ent.name}</span>
                        <span style={{ color: themeColors.primary, fontFamily: 'monospace', fontWeight: 600 }}>
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
                  backgroundColor: themeColors.primary,
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
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#f3f4f6', overflow: 'hidden', color: themeColors.bodyText }}>
            
            {/* Top Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px 8px 20px', 
              backgroundColor: 'transparent' 
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.5px' }}>
                <span style={{ color: isDarkMode ? '#94a3b8' : '#4b5563' }}>U</span>
                <span style={{ color: '#059669' }}>P</span>
                <span style={{ color: '#3b82f6' }}>I</span>
              </span>
              <button 
                onClick={() => setIsEnteringUpiPin(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#cbd5e1' : '#4b5563', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Source Bank details */}
            <div style={{ padding: '0 20px', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SAVINGS · Small Finance Bank ···· 8829
              </span>
            </div>

            {/* Payment summary card */}
            <div style={{ 
              margin: '0 20px 24px 20px', 
              padding: '16px 20px', 
              backgroundColor: isDarkMode ? '#1e293b' : '#fffdf4', 
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #fef08a', 
              borderRadius: 16, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#6b7280', textTransform: 'uppercase' }}>To: {verifiedRecipient ? verifiedRecipient.name : ''}</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: themeColors.textColor }}>Pay ₹{amount.toFixed(2)}</span>
              </div>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 10, 
                backgroundColor: themeColors.primary, 
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
              <span style={{ fontSize: 15, fontWeight: 700, color: themeColors.textColor, marginBottom: 16 }}>Enter your PIN</span>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                {[0, 1, 2, 3, 4, 5].map(idx => {
                  const hasDigit = idx < upiPin.length;
                  return (
                    <div key={idx} style={{ 
                      width: 14, 
                      height: 14, 
                      borderRadius: '50%', 
                      border: hasDigit ? (isDarkMode ? '2px solid #f8fafc' : '2px solid #1f2937') : '2px solid #9ca3af',
                      backgroundColor: hasDigit ? (isDarkMode ? '#f8fafc' : '#1f2937') : 'transparent',
                      transition: 'all 0.1s ease-in-out'
                    }} />
                  );
                })}
              </div>
            </div>

            {/* Warning note */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 6, 
              marginBottom: 20, 
              fontSize: 11, 
              fontWeight: 600, 
              color: isDarkMode ? '#94a3b8' : '#6b7280' 
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

            {/* Custom Numeric Keypad */}
            <div style={{ backgroundColor: isDarkMode ? '#111827' : '#eef2f6', padding: '20px 24px 28px 24px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 16,
                maxWidth: 340,
                margin: '0 auto'
              }}>
                <button type="button" onClick={() => handleKeypadPress('1')} style={styles.keypadNum}>1</button>
                <button type="button" onClick={() => handleKeypadPress('2')} style={styles.keypadNum}>2</button>
                <button type="button" onClick={() => handleKeypadPress('3')} style={styles.keypadNum}>3</button>

                <button type="button" onClick={() => handleKeypadPress('4')} style={styles.keypadNum}>4</button>
                <button type="button" onClick={() => handleKeypadPress('5')} style={styles.keypadNum}>5</button>
                <button type="button" onClick={() => handleKeypadPress('6')} style={styles.keypadNum}>6</button>

                <button type="button" onClick={() => handleKeypadPress('7')} style={styles.keypadNum}>7</button>
                <button type="button" onClick={() => handleKeypadPress('8')} style={styles.keypadNum}>8</button>
                <button type="button" onClick={() => handleKeypadPress('9')} style={styles.keypadNum}>9</button>

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
                    color: themeColors.bodyText
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
            
            <form onSubmit={handleSendPayment} style={{ ...styles.form, display: 'flex', flexDirection: 'column', flex: 1 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 'auto 0' }}>
                
                {/* Payee verified badge card */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.08)', 
                  border: '1px solid ' + themeColors.borderColor, 
                  borderRadius: 12, 
                  padding: 12,
                  marginBottom: 4
                }}>
                  <div style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: '50%', 
                    backgroundColor: themeColors.primary, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#ffffff' 
                  }}>
                    <Check size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: themeColors.textColor }}>
                      {verifiedRecipient.name}
                    </h4>
                    <span style={{ fontSize: 10, color: themeColors.primary, fontWeight: 700 }}>
                      Verified Name: {verifiedRecipient.name.toUpperCase()}
                    </span>
                  </div>
                  <Info size={18} color="#64748b" />
                </div>

                {/* Currency Amount Display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 12px 0', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary }}>₹</span>
                    <input 
                      type="number" 
                      value={amount === 0 ? '' : amount} 
                      onChange={e => setAmount(Number(e.target.value))}
                      style={{
                        border: 'none',
                        borderBottom: '2px solid #cbd5e1',
                        fontSize: 36,
                        fontWeight: 800,
                        color: themeColors.textColor,
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
                  <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>Enter amount you want to transfer</span>
                </div>

                {/* Select note category selection */}
                <div style={{ ...styles.formGroup, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#64748b', display: 'block', marginBottom: 6 }}>Transaction Category (Note)</span>
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
                              ? '2px solid ' + themeColors.primary 
                              : '1px solid #cbd5e1',
                            backgroundColor: hasNoLiabilities 
                              ? (isDarkMode ? '#1e293b' : '#f1f5f9') 
                              : (note === option ? themeColors.badgeBg : (isDarkMode ? '#1e293b' : '#ffffff')),
                            color: hasNoLiabilities 
                              ? '#94a3b8' 
                              : (note === option ? themeColors.textColor : (isDarkMode ? '#cbd5e1' : '#475569')),
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
                  <span style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#64748b', display: 'block', marginBottom: 6 }}>Linked Bank Account</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', border: '1px solid ' + themeColors.borderColor, borderRadius: 12, padding: 12 }}>
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 8, 
                      backgroundColor: themeColors.badgeBg, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: themeColors.textColor 
                    }}>
                      <Home size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: themeColors.textColor }}>Small Finance Bank •••• 8829</h5>
                      <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
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
                        <span style={{ fontSize: 12, fontWeight: 700, color: themeColors.textColor }}>
                          Sahayak Assistant Guard:
                        </span>
                      </div>
                      <span style={getPredictedCategoryBadge(liveEvaluation.predictedCategory)}>
                        {liveEvaluation.predictedCategory.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '6px 0 2px 0' }}>
                      <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Impulse Risk Score:</span>
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
                        color: themeColors.primary, 
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontWeight: 600
                      }}>
                        <input 
                          type="checkbox" 
                          checked={optInRoundUp} 
                          onChange={e => setOptInRoundUp(e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: themeColors.primary }}
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
                  backgroundColor: themeColors.primary, 
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
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  maxWidth: 360,
                  width: '100%',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  color: themeColors.bodyText
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: themeColors.textColor }}>Select Periodic Liability</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Select one active liability to pay this EMI</p>
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
                            border: isSelected ? '2px solid ' + themeColors.primary : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? themeColors.badgeBg : (isDarkMode ? '#1e293b' : '#ffffff'),
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.1s'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.textColor }}>{liab.title}</span>
                            <span style={{ fontSize: 10, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Period: {liab.period_days} days · Last paid: {liab.last_paid_date}</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: themeColors.primary }}>₹{liab.amount.toLocaleString()}</span>
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
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        color: isDarkMode ? '#cbd5e1' : '#475569',
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
                        backgroundColor: themeColors.primary,
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
  );
};

// Helper badge function
function getPredictedCategoryBadge(category: string, isDark?: boolean): React.CSSProperties {
  if (isDark) {
    switch (category) {
      case 'essential': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
      case 'impulsive': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
      case 'transfers': return { backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
      default: return { backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11 };
    }
  }
  switch (category) {
    case 'essential': return { backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    case 'impulsive': return { backgroundColor: '#fff1f2', color: '#e11d48', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    case 'transfers': return { backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 };
    default: return { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontSize: 11 };
  }
}
