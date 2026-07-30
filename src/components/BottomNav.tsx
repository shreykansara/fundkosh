import React from 'react';
import { Home, FileText, PiggyBank, Mic, User } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';

interface BottomNavProps {
  activeTab: 'pay' | 'budget' | 'vault' | 'ledger' | 'voice';
  setActiveTab: (tab: 'pay' | 'budget' | 'vault' | 'ledger' | 'voice') => void;
  isBlueTheme: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isBlueTheme }) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();
  
  const rawThemeColors = getThemeColors();
  const themeColors = isBlueTheme ? (
    isDarkMode ? {
      primary: '#38bdf8',
      cardBg: '#1e293b',
      borderColor: 'rgba(56, 189, 248, 0.2)',
    } : {
      primary: '#0284c7',
      cardBg: '#ffffff',
      borderColor: 'rgba(2, 132, 199, 0.15)',
    }
  ) : rawThemeColors;

  const styles = {
    bottomNav: { 
      position: 'fixed' as const, 
      bottom: 0, 
      left: 0, 
      right: 0, 
      height: 60, 
      backgroundColor: isDarkMode ? themeColors.cardBg : 'rgba(255, 255, 255, 0.95)', 
      backdropFilter: 'blur(10px)', 
      display: 'flex', 
      justifyContent: 'space-around', 
      alignItems: 'center', 
      zIndex: 90, 
      borderTop: '1px solid ' + themeColors.borderColor, 
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)' 
    },
    navTab: (tab: typeof activeTab) => ({ 
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'center', 
      gap: 2, 
      background: 'none', 
      border: 'none', 
      color: activeTab === tab ? themeColors.primary : (isDarkMode ? '#94a3b8' : '#64748b'), 
      fontSize: 11, 
      cursor: 'pointer' 
    })
  };

  return (
    <nav style={styles.bottomNav}>
      <button onClick={() => setActiveTab('pay')} style={styles.navTab('pay')}>
        <Home size={20} />
        <span>Home</span>
      </button>
      <button onClick={() => setActiveTab('ledger')} style={styles.navTab('ledger')}>
        <FileText size={20} />
        <span>Transactions</span>
      </button>
      <button onClick={() => setActiveTab('vault')} style={styles.navTab('vault')}>
        <PiggyBank size={20} />
        <span>Vault</span>
      </button>
      <button onClick={() => setActiveTab('voice')} style={styles.navTab('voice')}>
        <Mic size={20} />
        <span>Voice</span>
      </button>
      <button onClick={() => setActiveTab('budget')} style={styles.navTab('budget')}>
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
};
