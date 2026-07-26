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
          bgGradient: 'linear-gradient(180deg, #e0f2e9 0%, #ffffff 100%)',
          cardBg: '#FFFFFF',
          borderColor: 'rgba(0, 108, 73, 0.15)',
          glowShadow: '0 8px 30px rgba(0, 108, 73, 0.06)',
          badgeBg: 'rgba(0, 108, 73, 0.1)',
          textColor: '#006C49'
        };
      case 'AMBER':
        return {
          primary: '#CE943B',
          bgGradient: 'linear-gradient(180deg, #EEE7E3 0%, #FAF6F3 100%)',
          cardBg: '#FFFFFF',
          borderColor: 'rgba(206, 148, 59, 0.2)',
          glowShadow: '0 8px 30px rgba(206, 148, 59, 0.08)',
          badgeBg: 'rgba(206, 148, 59, 0.12)',
          textColor: '#CE943B'
        };
      case 'RED':
        return {
          primary: '#D32F2F',
          bgGradient: 'linear-gradient(180deg, #FBEBE9 0%, #FAF2F1 100%)',
          cardBg: '#FFFFFF',
          borderColor: 'rgba(211, 47, 47, 0.18)',
          glowShadow: '0 8px 30px rgba(211, 47, 47, 0.08)',
          badgeBg: 'rgba(211, 47, 47, 0.12)',
          textColor: '#D32F2F'
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
