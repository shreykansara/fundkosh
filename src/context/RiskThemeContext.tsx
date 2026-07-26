import React, { createContext, useContext, useState, useEffect } from 'react';
import { RiskThemeState } from '../domain/models';

interface RiskThemeContextType {
  themeState: RiskThemeState;
  setThemeState: (theme: RiskThemeState) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  getThemeColors: () => {
    primary: string;
    bgGradient: string;
    cardBg: string;
    borderColor: string;
    glowShadow: string;
    badgeBg: string;
    textColor: string;
    bodyText: string;
  };
}

const RiskThemeContext = createContext<RiskThemeContextType | undefined>(undefined);

export const RiskThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeState, setThemeState] = useState<RiskThemeState>('GREEN');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fundkosh_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('fundkosh_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const getThemeColors = () => {
    if (isDarkMode) {
      switch (themeState) {
        case 'GREEN':
          return {
            primary: '#10b981',
            bgGradient: 'linear-gradient(180deg, #06110c 0%, #090e0b 100%)',
            cardBg: '#101c16',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            glowShadow: '0 8px 30px rgba(16, 185, 129, 0.08)',
            badgeBg: 'rgba(16, 185, 129, 0.15)',
            textColor: '#34d399',
            bodyText: '#f8fafc'
          };
        case 'AMBER':
          return {
            primary: '#fbbf24',
            bgGradient: 'linear-gradient(180deg, #130f0a 0%, #0e0c0a 100%)',
            cardBg: '#1b140f',
            borderColor: 'rgba(251, 191, 36, 0.25)',
            glowShadow: '0 8px 30px rgba(251, 191, 36, 0.08)',
            badgeBg: 'rgba(251, 191, 36, 0.15)',
            textColor: '#fbbf24',
            bodyText: '#f8fafc'
          };
        case 'RED':
          return {
            primary: '#f87171',
            bgGradient: 'linear-gradient(180deg, #130909 0%, #0e0707 100%)',
            cardBg: '#1b1010',
            borderColor: 'rgba(248, 113, 113, 0.25)',
            glowShadow: '0 8px 30px rgba(248, 113, 113, 0.08)',
            badgeBg: 'rgba(248, 113, 113, 0.15)',
            textColor: '#f87171',
            bodyText: '#f8fafc'
          };
      }
    } else {
      switch (themeState) {
        case 'GREEN':
          return {
            primary: '#006C49',
            bgGradient: 'linear-gradient(180deg, #e0f2e9 0%, #ffffff 100%)',
            cardBg: '#FFFFFF',
            borderColor: 'rgba(0, 108, 73, 0.15)',
            glowShadow: '0 8px 30px rgba(0, 108, 73, 0.06)',
            badgeBg: 'rgba(0, 108, 73, 0.1)',
            textColor: '#006C49',
            bodyText: '#0f172a'
          };
        case 'AMBER':
          return {
            primary: '#CE943B',
            bgGradient: 'linear-gradient(180deg, #EEE7E3 0%, #FAF6F3 100%)',
            cardBg: '#FFFFFF',
            borderColor: 'rgba(206, 148, 59, 0.2)',
            glowShadow: '0 8px 30px rgba(206, 148, 59, 0.08)',
            badgeBg: 'rgba(206, 148, 59, 0.12)',
            textColor: '#CE943B',
            bodyText: '#0f172a'
          };
        case 'RED':
          return {
            primary: '#D32F2F',
            bgGradient: 'linear-gradient(180deg, #FBEBE9 0%, #FAF2F1 100%)',
            cardBg: '#FFFFFF',
            borderColor: 'rgba(211, 47, 47, 0.18)',
            glowShadow: '0 8px 30px rgba(211, 47, 47, 0.08)',
            badgeBg: 'rgba(211, 47, 47, 0.12)',
            textColor: '#D32F2F',
            bodyText: '#0f172a'
          };
      }
    }
  };

  return (
    <RiskThemeContext.Provider value={{ themeState, setThemeState, isDarkMode, setIsDarkMode, getThemeColors }}>
      {children}
    </RiskThemeContext.Provider>
  );
};

export const useRiskTheme = () => {
  const context = useContext(RiskThemeContext);
  if (!context) throw new Error('useRiskTheme must be used within RiskThemeProvider');
  return context;
};
