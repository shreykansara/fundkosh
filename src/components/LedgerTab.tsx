import React from 'react';
import { Activity } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity, Transaction } from '../domain/models';

interface LedgerTabProps {
  currentUser: Entity;
  transactions: Transaction[];
  isBlueTheme: boolean;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({ currentUser, transactions, isBlueTheme }) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();

  const rawThemeColors = getThemeColors();
  const themeColors = isBlueTheme ? (
    isDarkMode ? {
      primary: '#38bdf8',
      cardBg: '#1e293b',
      borderColor: 'rgba(56, 189, 248, 0.2)',
      glowShadow: '0 8px 30px rgba(56, 189, 248, 0.08)',
      bodyText: '#f8fafc'
    } : {
      primary: '#0284c7',
      cardBg: '#ffffff',
      borderColor: 'rgba(2, 132, 199, 0.15)',
      glowShadow: '0 8px 30px rgba(2, 132, 199, 0.06)',
      bodyText: '#0f172a'
    }
  ) : rawThemeColors;

  const styles: Record<string, React.CSSProperties> = {
    tabContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    card: { backgroundColor: themeColors.cardBg, borderRadius: 16, padding: 16, border: '1px solid ' + themeColors.borderColor, boxShadow: themeColors.glowShadow },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#0f172a', margin: 0 },
    txList: { display: 'flex', flexDirection: 'column', gap: 8 },
    txItem: { backgroundColor: themeColors.cardBg, padding: 10, borderRadius: 8, border: '1px solid ' + themeColors.borderColor }
  };

  const filteredTxs = transactions.filter(tx => tx.sender_upi === currentUser.upi_id);

  return (
    <div style={styles.tabContainer}>
      
      {/* Audit Log */}
      <div style={{ ...styles.card, borderColor: themeColors.borderColor }}>
        <div style={styles.cardHeader}>
          <Activity size={20} color={themeColors.primary} />
          <h2 style={styles.cardTitle}>Transaction History</h2>
        </div>
        <div style={styles.txList}>
          {filteredTxs.length === 0 ? (
            <div style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 13, fontStyle: 'italic' }}>
              No transactions recorded yet. Initiate a payment to populate ledger.
            </div>
          ) : (
            filteredTxs.map(tx => (
              <div key={tx.id} style={{ ...styles.txItem, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: themeColors.borderColor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: themeColors.bodyText }}>
                    You → {tx.receiver_upi.split('@')[0]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: themeColors.bodyText }}>
                    ₹{tx.amount.toLocaleString()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={getStatusBadgeStyle(tx.status, isBlueTheme, isDarkMode)}>{tx.status}</span>
                    <span style={getPredictedCategoryBadge(tx.note === 'other' ? 'transfers' : (tx.note || 'essential'), isBlueTheme, isDarkMode)}>
                      {tx.note === 'other' ? 'transfers' : (tx.note || 'essential')}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: getRiskColor(tx.risk_score, isBlueTheme, isDarkMode) }}>
                      Score: {tx.risk_score}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                    {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},{' '}
                    {new Date(tx.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Helper badge functions
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
