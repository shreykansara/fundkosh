import React from 'react';
import { Database, RefreshCw, Sun, CloudRain, Flame } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { WeatherCondition, LocalEventVector, RiskThemeState, Entity } from '../domain/models';

interface SandboxTrayProps {
  mongoConnected: boolean;
  handleSeedDatabase: () => void;
  setCurrentUser: (user: Entity | null) => void;
  setShowSandbox: (show: boolean) => void;
  weather: WeatherCondition;
  setWeather: (w: WeatherCondition) => void;
  eventVector: LocalEventVector;
  setEventVector: (ev: LocalEventVector) => void;
  isBlueTheme: boolean;
}

export const SandboxTray: React.FC<SandboxTrayProps> = ({
  mongoConnected,
  handleSeedDatabase,
  setCurrentUser,
  setShowSandbox,
  weather,
  setWeather,
  eventVector,
  setEventVector,
  isBlueTheme
}) => {
  const { themeState, setThemeState, isDarkMode, getThemeColors } = useRiskTheme();

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

  const styles = {
    cardTitle: { fontSize: 15, fontWeight: 700, color: themeColors.textColor, margin: 0 },
    statusChip: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: '4px 10px', borderRadius: 16, fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#475569', border: '1px solid ' + themeColors.borderColor },
    seedBtn: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, color: themeColors.textColor, borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    label: { fontSize: 12, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#475569' },
    vectorBtn: { backgroundColor: themeColors.cardBg, border: '1px solid ' + themeColors.borderColor, color: isDarkMode ? '#cbd5e1' : '#475569', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    activeVectorBtn: { backgroundColor: themeColors.primary, border: '1px solid ' + themeColors.primary, color: '#ffffff', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }} onClick={() => setShowSandbox(false)}>
      <div 
        style={{
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          width: '100%',
          maxWidth: '100%',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          color: themeColors.bodyText
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} color={themeColors.primary} />
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid ' + themeColors.borderColor, paddingTop: 16 }}>
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

          <div>
            <label style={styles.label}>Presentation Theme Override (Forces Home Page color)</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {(['GREEN', 'AMBER', 'RED'] as const).map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => setThemeState(t)}
                  style={{
                    ...styles.vectorBtn,
                    flex: 1,
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    justifyContent: 'center',
                    ...(themeState === t 
                      ? { 
                          backgroundColor: t === 'GREEN' ? '#006C49' : t === 'AMBER' ? '#CE943B' : '#D32F2F', 
                          borderColor: t === 'GREEN' ? '#006C49' : t === 'AMBER' ? '#CE943B' : '#D32F2F', 
                          color: '#ffffff', 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                        } 
                      : {}
                    )
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
