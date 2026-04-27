import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'themeMode';

const palette = {
  light: {
    mode: 'light' as const,
    background: '#f3f4f6',
    surface: '#ffffff',
    surfaceMuted: '#f9fafb',
    card: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    primary: '#1f2d4d',
    accent: '#f61cc7',
    input: '#ffffff',
    inputBorder: '#e5e7eb',
    tabInactive: '#9ca3af',
  },
  dark: {
    mode: 'dark' as const,
    background: '#0b1020',
    surface: '#131a2b',
    surfaceMuted: '#1a2236',
    card: '#131a2b',
    text: '#f3f4f6',
    textMuted: '#9ca3af',
    border: '#25304a',
    primary: '#d7def5',
    accent: '#ff66d9',
    input: '#111827',
    inputBorder: '#374151',
    tabInactive: '#6b7280',
  },
};

type ThemeContextValue = {
  theme: typeof palette.light;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
    });
  }, []);

  const resolvedMode = themeMode === 'system'
    ? systemScheme === 'dark' ? 'dark' : 'light'
    : themeMode;

  const theme = resolvedMode === 'dark' ? palette.dark : palette.light;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const toggleTheme = async () => {
    const next = resolvedMode === 'dark' ? 'light' : 'dark';
    await setThemeMode(next);
  };

  const value = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}
