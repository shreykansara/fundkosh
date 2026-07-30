import React from 'react';
import { ShieldAlert, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Transaction, SpeedBumpEvaluationResult } from '../domain/models';

interface SpeedBumpModalProps {
  activeSpeedBump: {
    tx: Transaction;
    evalResult: SpeedBumpEvaluationResult;
  };
  cooldownLeft: number;
  handleResolveSpeedBump: (choice: 'CONFIRM' | 'CANCEL') => void;
}

export const SpeedBumpModal: React.FC<SpeedBumpModalProps> = ({
  activeSpeedBump,
  cooldownLeft,
  handleResolveSpeedBump
}) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();
  const themeColors = getThemeColors();

  const styles = {
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modalContent: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 20, maxWidth: 400, width: '100%', border: '1px solid ' + themeColors.borderColor, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)', color: themeColors.bodyText },
    modalIconBg: { width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
    modalSummary: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid ' + themeColors.borderColor, marginBottom: 12 },
    reasonsBox: { backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 },
    cooldownNotice: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', color: '#d97706', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 },
    cooldownDoneNotice: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', color: '#16a34a', padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 },
    modalActions: { display: 'flex', gap: 10 },
    cancelBtn: { flex: 1, backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
    confirmBtn: { flex: 1, backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ ...styles.modalIconBg, backgroundColor: activeSpeedBump.evalResult.themeState === 'RED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)' }}>
            <ShieldAlert size={36} color={activeSpeedBump.evalResult.themeState === 'RED' ? '#ef4444' : '#f59e0b'} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: themeColors.textColor, margin: '12px 0 4px 0' }}>
            Speed-Bump Reflection Intercept
          </h2>
          <p style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : '#475569', margin: 0 }}>
            {activeSpeedBump.evalResult.themeState === 'RED'
              ? 'Critical Speed-Bump! High impulse risk exceeding budget limits.'
              : 'Warning Speed-Bump! Take a breath before spending.'}
          </p>
        </div>

        <div style={styles.modalSummary}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13 }}>Amount:</span>
            <span style={{ color: themeColors.textColor, fontWeight: 700, fontSize: 16 }}>₹{activeSpeedBump.tx.amount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13 }}>Payee:</span>
            <span style={{ color: themeColors.textColor, fontWeight: 600, fontSize: 13 }}>{activeSpeedBump.tx.receiver_upi}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13 }}>Risk Score:</span>
            <span style={{ color: activeSpeedBump.evalResult.themeState === 'RED' ? '#f87171' : '#fbbf24', fontWeight: 700, fontSize: 14 }}>
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
  );
};
