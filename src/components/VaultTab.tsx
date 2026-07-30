import React from 'react';
import { PiggyBank } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity, VaultState } from '../domain/models';
import { apiClient } from '../api/apiClient';

interface VaultTabProps {
  currentUser: Entity;
  vaultData: VaultState | null;
  senderUpi: string;
  handleManualSweep: () => void;
  refreshAppData: () => Promise<void>;
  isBlueTheme: boolean;
}

export const VaultTab: React.FC<VaultTabProps> = ({
  currentUser,
  vaultData,
  senderUpi,
  handleManualSweep,
  refreshAppData,
  isBlueTheme
}) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();

  const rawThemeColors = getThemeColors();
  const themeColors = isBlueTheme ? (
    isDarkMode ? {
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
    }
  ) : rawThemeColors;

  const styles: Record<string, React.CSSProperties> = {
    tabContainer: { display: 'flex', flexDirection: 'column', gap: 16, flex: 1 },
    card: { 
      backgroundColor: themeColors.cardBg, 
      borderRadius: 16, 
      padding: '24px 20px', 
      border: '1px solid ' + themeColors.borderColor, 
      boxShadow: themeColors.glowShadow,
      display: 'flex', 
      flexDirection: 'column', 
      flex: 1, 
      minHeight: 'calc(100vh - 220px)', 
      boxSizing: 'border-box' 
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: 700, color: themeColors.textColor, margin: 0 },
    budgetBox: { display: 'flex', flexDirection: 'column', gap: 2, padding: 8, backgroundColor: themeColors.cardBg, borderRadius: 8, border: '1px solid ' + themeColors.borderColor },
    vectorBtn: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, color: isDarkMode ? '#cbd5e1' : '#475569', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    submitBtn: { color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }
  };

  const threshold = vaultData?.target_threshold || 100;
  const balance = vaultData?.balance || 0;
  const percent = Math.min(100, Math.floor((balance / threshold) * 100));

  const handleUpdateThreshold = async (val: number) => {
    await apiClient.updateVaultThreshold(currentUser?.upi_id || senderUpi, val);
    await refreshAppData();
  };

  return (
    <div style={styles.tabContainer}>
      
      {/* Vault Metrics */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <PiggyBank size={22} color={themeColors.primary} />
          <h2 style={styles.cardTitle}>Automated Round-Up Vault</h2>
        </div>
        
        <p style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b', margin: '-4px 0 20px 0', lineHeight: '1.4' }}>
          Your spare change from transactions is saved here automatically. Once the threshold is met, it auto-sweeps into your 7.2% Flexi-RD account.
        </p>

        {/* Grid of micro-savings cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
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
          <span style={{ fontSize: 13, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#475569', display: 'block', marginBottom: 8 }}>Set Auto-Sweep Threshold</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[100, 150, 200, 500].map(val => (
              <button 
                key={val}
                type="button"
                onClick={() => handleUpdateThreshold(val)}
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
                    : { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: themeColors.borderColor, color: themeColors.bodyText }
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
            boxShadow: themeColors.glowShadow
          }}
        >
          <PiggyBank size={18} /> Execute Manual Sweep to 7.2% Flexi-RD
        </button>
      </div>

    </div>
  );
};
