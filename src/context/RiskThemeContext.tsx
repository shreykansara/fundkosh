import React, { createContext, useContext, useState, useEffect } from 'react';
import { RiskThemeState } from '../domain/models';

interface RiskThemeContextType {
  themeState: RiskThemeState;
  setThemeState: (theme: RiskThemeState) => void;
  getThemeColors: () => {
    primary: string;
    bgGradient: string;
    cardBg: string;
    borderColor: string;
    glowShadow: string;
    badgeBg: string;
    textColor: string;
  };
}

const RiskThemeContext = createContext<RiskThemeContextType | undefined>(undefined);

export const RiskThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeState, setThemeState] = useState<RiskThemeState>('GREEN');

  const getThemeColors = () => {
    switch (themeState) {
      case 'GREEN':
        return {
          primary: '#006C49',
          bgGradient: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
          cardBg: '#FFFFFF',
          borderColor: 'rgba(0, 108, 73, 0.15)',
          glowShadow: '0 8px 30px rgba(0, 108, 73, 0.06)',
          badgeBg: 'rgba(0, 108, 73, 0.1)',
          textColor: '#006C49'
        };
      case 'AMBER':
        return {
          primary: '#B45309',
          bgGradient: 'linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%)',
          cardBg: '#FFFFFF',
          borderColor: 'rgba(180, 83, 9, 0.15)',
          glowShadow: '0 8px 30px rgba(180, 83, 9, 0.06)',
          badgeBg: 'rgba(180, 83, 9, 0.1)',
          textColor: '#B45309'
        };
      case 'RED':
        return {
          primary: '#DC2626',
          bgGradient: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)',
          cardBg: '#FFFFFF',
          borderColor: 'rgba(220, 38, 38, 0.15)',
          glowShadow: '0 8px 30px rgba(220, 38, 38, 0.08)',
          badgeBg: 'rgba(220, 38, 38, 0.1)',
          textColor: '#DC2626'
        };
    }
  };

  return (
    <RiskThemeContext.Provider value={{ themeState, setThemeState, getThemeColors }}>
      {children}
    </RiskThemeContext.Provider>
  );
};

export const useRiskTheme = () => {
  const context = useContext(RiskThemeContext);
  if (!context) throw new Error('useRiskTheme must be used within RiskThemeProvider');
  return context;
};
