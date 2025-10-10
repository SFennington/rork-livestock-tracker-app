import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePalette = 'emerald' | 'blue' | 'purple' | 'orange' | 'rose';
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const DARK_PALETTES: Record<ThemePalette, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    secondary: '#6366f1',
    accent: '#f59e0b',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    border: '#475569',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  blue: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    border: '#475569',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    secondary: '#ec4899',
    accent: '#f59e0b',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    border: '#475569',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  orange: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    border: '#475569',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  rose: {
    primary: '#f43f5e',
    primaryDark: '#e11d48',
    primaryLight: '#fb7185',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    border: '#475569',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

const LIGHT_PALETTES: Record<ThemePalette, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    secondary: '#6366f1',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  blue: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    secondary: '#ec4899',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  orange: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  rose: {
    primary: '#f43f5e',
    primaryDark: '#e11d48',
    primaryLight: '#fb7185',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

// Storage wrapper using AsyncStorage for cross-platform compatibility
const storage = {
  getItem: async (key: string) => {
    if (!key?.trim() || key.length > 100) return null;
    try {
      return await AsyncStorage.getItem(key.trim());
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (!key?.trim() || key.length > 100) return;
    if (!value || value.length > 1000) return;
    try {
      await AsyncStorage.setItem(key.trim(), value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }
};

const STORAGE_KEY_PALETTE = 'livestock_theme_palette';
const STORAGE_KEY_MODE = 'livestock_theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [palette, setPalette] = useState<ThemePalette>('blue');
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedPalette = await storage.getItem(STORAGE_KEY_PALETTE);
        if (savedPalette && savedPalette in DARK_PALETTES) {
          setPalette(savedPalette as ThemePalette);
        }
        const savedMode = await storage.getItem(STORAGE_KEY_MODE);
        if (savedMode === 'light' || savedMode === 'dark') {
          setMode(savedMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const changePalette = useCallback(async (newPalette: ThemePalette) => {
    if (!newPalette || typeof newPalette !== 'string' || !(newPalette in DARK_PALETTES)) return;
    setPalette(newPalette);
    await storage.setItem(STORAGE_KEY_PALETTE, newPalette);
  }, []);

  const changeMode = useCallback(async (newMode: ThemeMode) => {
    if (newMode !== 'light' && newMode !== 'dark') return;
    setMode(newMode);
    await storage.setItem(STORAGE_KEY_MODE, newMode);
  }, []);

  const colors = useMemo(() => {
    const palettes = mode === 'dark' ? DARK_PALETTES : LIGHT_PALETTES;
    return palettes[palette];
  }, [palette, mode]);

  const availablePalettes = useMemo(() => Object.keys(DARK_PALETTES) as ThemePalette[], []);

  return useMemo(() => ({
    palette,
    mode,
    colors,
    availablePalettes,
    changePalette,
    changeMode,
    isLoading,
  }), [palette, mode, colors, availablePalettes, changePalette, changeMode, isLoading]);
});