import React from 'react';
import { MapPin } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity } from '../domain/models';

interface HeaderProps {
  currentUser: Entity;
  isBlueTheme?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, isBlueTheme }) => {
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

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px 16px', backgroundColor: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* User Profile Avatar */}
        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: '50%', 
          overflow: 'hidden',
          border: '2px solid ' + themeColors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeColors.cardBg
        }}>
          <div style={{ color: themeColors.primary, fontWeight: 700, fontSize: 16 }}>
            {currentUser.name[0]}
          </div>
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: themeColors.textColor, margin: 0 }}>
            Namaste, {currentUser.name.split(' ')[0]} Ji!
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <MapPin size={12} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            <span style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Mansarovar, Jaipur</span>
          </div>
        </div>
      </div>
    </header>
  );
};
