import React from 'react';
import { QrCode, Phone, AtSign, Wallet, PiggyBank, Info } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity, VaultState } from '../domain/models';

interface HomeTabProps {
  currentUser: Entity;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  vaultData: VaultState | null;
  handleOpenPaymentModal: (mode: 'PHONE' | 'UPI') => void;
  statusMessage: string | null;
  isBlueTheme: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  currentUser,
  showBalance,
  setShowBalance,
  vaultData,
  handleOpenPaymentModal,
  statusMessage,
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
    tabContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 16, border: '1px solid ' + themeColors.borderColor, boxShadow: themeColors.glowShadow },
    progressBarBg: { height: 6, width: '100%', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', transition: 'width 0.3s ease, background-color 0.3s ease' },
    notification: { backgroundColor: themeColors.badgeBg, color: themeColors.textColor, border: '1px solid ' + themeColors.borderColor, padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 },
  };

  return (
    <div style={styles.tabContainer}>
      
      {/* Primary Account Balance Card */}
      <div style={{ 
        ...styles.card, 
        borderLeft: '4px solid ' + themeColors.primary, 
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
            color: themeColors.textColor, 
            backgroundColor: themeColors.badgeBg, 
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
          <span style={{ fontSize: 20, fontWeight: 800, color: themeColors.textColor }}>
            {showBalance ? `₹${currentUser.balance.toLocaleString()}` : '■■■■■■'}
          </span>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            style={{ 
              backgroundColor: themeColors.badgeBg, 
              color: themeColors.textColor, 
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
        onClick={() => handleOpenPaymentModal('UPI')}
        style={{
          width: '100%',
          backgroundColor: themeColors.primary,
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
          boxShadow: themeColors.glowShadow,
          marginBottom: 4
        }}
      >
        <QrCode size={20} />
        SCAN ANY QR CODE
      </button>

      {/* Quick Actions Icon Row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '8px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => handleOpenPaymentModal('PHONE')}>
          <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: '50%', 
            backgroundColor: themeColors.primary, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#ffffff',
            boxShadow: themeColors.glowShadow
          }}>
            <Phone size={22} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#0f172a' }}>To Contact</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => handleOpenPaymentModal('UPI')}>
          <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: '50%', 
            backgroundColor: themeColors.primary, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#ffffff',
            boxShadow: themeColors.glowShadow
          }}>
            <AtSign size={22} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#0f172a' }}>To UPI ID</span>
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
      <div style={{ ...styles.card, padding: 16, marginBottom: 4, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 10, top: 10, opacity: 0.04, pointerEvents: 'none' }}>
          <PiggyBank size={90} color={themeColors.primary} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ 
            width: 38, 
            height: 38, 
            borderRadius: '50%', 
            backgroundColor: themeColors.badgeBg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: themeColors.textColor
          }}>
            <PiggyBank size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: themeColors.textColor, margin: 0 }}>
            Chillar Vault
          </h3>
        </div>

        <p style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#475569', lineHeight: '1.4', margin: '0 0 16px 0' }}>
          Your loose change from scanned transactions is cached securely on this phone.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          <span style={{ color: themeColors.textColor }}>
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
            backgroundColor: themeColors.primary,
            borderRadius: 4
          }} />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 8, 
          backgroundColor: themeColors.badgeBg, 
          border: '1px solid ' + themeColors.borderColor, 
          borderRadius: 8, 
          padding: '10px', 
          fontSize: 11, 
          color: themeColors.textColor, 
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
  );
};
