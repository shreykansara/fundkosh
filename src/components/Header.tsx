import React from 'react';
import { MapPin } from 'lucide-react';
import { useRiskTheme } from '../context/RiskThemeContext';
import { Entity } from '../domain/models';

interface HeaderProps {
  currentUser: Entity;
}

export const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  const { isDarkMode, getThemeColors } = useRiskTheme();
  const themeColors = getThemeColors();

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
