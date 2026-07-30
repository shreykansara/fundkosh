import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity, DailyBudgetMetrics, Liability } from '../domain/models';

interface BudgetTabProps {
  currentUser: Entity;
  setCurrentUser: (user: Entity | null) => void;
  budgetMetrics: DailyBudgetMetrics | null;
  liabilities: Liability[];
  isBlueTheme: boolean;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  currentUser,
  setCurrentUser,
  budgetMetrics,
  liabilities,
  isBlueTheme
}) => {
  const { isDarkMode, setIsDarkMode, getThemeColors } = useRiskTheme();

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
    tabContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 16, border: '1px solid ' + themeColors.borderColor, boxShadow: themeColors.glowShadow },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: themeColors.textColor, margin: 0 },
    progressBarBg: { height: 6, width: '100%', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', transition: 'width 0.3s ease, background-color 0.3s ease' },
    budgetFormulaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid ' + themeColors.borderColor },
    budgetBox: { display: 'flex', flexDirection: 'column', gap: 2, padding: 8, backgroundColor: themeColors.cardBg, borderRadius: 8, border: '1px solid ' + themeColors.borderColor },
    liabItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: themeColors.cardBg, padding: '8px 12px', borderRadius: 8, border: '1px solid ' + themeColors.borderColor }
  };

  return (
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
            <h3 style={{ ...styles.cardTitle, fontSize: 16, marginBottom: 4, color: themeColors.textColor }}>{currentUser.name}</h3>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={getTypeStyle(currentUser.type, isBlueTheme, isDarkMode)}>{currentUser.type === 0 ? 'USER' : 'MERCHANT'}</span>
              <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{currentUser.upi_id}</span>
            </div>
          </div>
        </div>

        {/* Dark Mode Toggle Switch */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          margin: '12px 0 16px 0', 
          padding: '10px 12px', 
          border: '1px solid ' + themeColors.borderColor, 
          borderRadius: 10, 
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' 
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: themeColors.textColor }}>Theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              backgroundColor: isDarkMode ? themeColors.primary : '#e2e8f0',
              border: 'none',
              borderRadius: 16,
              width: 50,
              height: 26,
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              padding: 0
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: 3,
              left: isDarkMode ? 27 : 3,
              transition: 'left 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              {isDarkMode ? '🌙' : '☀️'}
            </div>
          </button>
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
            <div style={{ ...styles.budgetBox, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: themeColors.borderColor }}>
              <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#475569' }}>Est. Monthly Income</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: themeColors.primary }}>
                ₹{budgetMetrics.predictedMonthlyIncome.toLocaleString()}
              </span>
            </div>
            <div style={{ ...styles.budgetBox, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: themeColors.borderColor }}>
              <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#475569' }}>Fixed Bills (30d)</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: themeColors.primary }}>
                - ₹{budgetMetrics.totalActiveLiabilities.toLocaleString()}
              </span>
            </div>
            <div style={{ ...styles.budgetBox, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: themeColors.borderColor }}>
              <span style={{ fontSize: 11, color: themeColors.textColor, fontWeight: 600 }}>Daily Limit</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: themeColors.primary }}>
                ₹{budgetMetrics.dailySpendableLimit.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>Today's Total Spend:</span>
              <span style={{ fontWeight: 700, color: themeColors.bodyText }}>
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
            <div key={liab.id} style={{ ...styles.liabItem, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: themeColors.borderColor }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: themeColors.bodyText }}>{liab.title}</span>
                <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#475569', marginLeft: 8 }}>Due in {liab.due_in_days} days</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: themeColors.primary }}>₹{liab.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// Helper Badge Style
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
