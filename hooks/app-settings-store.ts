import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuickSelectOption {
  label: string;
  amount: string;
  category?: string;
  type?: string;
  description: string;
}

export interface AppSettings {
  expenseCategories: string[];
  incomeTypes: string[];
  chickenEventTypes: string[];
  expenseQuickSelects: QuickSelectOption[];
  incomeQuickSelects: QuickSelectOption[];
  enabledAnimals: {
    chickens: boolean;
    rabbits: boolean;
    goats: boolean;
    ducks: boolean;
  };
}

const STORAGE_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  expenseCategories: ['feed', 'bedding', 'medical', 'equipment', 'other'],
  incomeTypes: ['eggs', 'meat', 'livestock', 'breeding', 'other'],
  chickenEventTypes: ['acquired', 'death', 'sold', 'consumed'],
  expenseQuickSelects: [
    { label: 'Feed - $50', amount: '50', category: 'feed', description: 'Feed purchase' },
    { label: 'Bedding - $30', amount: '30', category: 'bedding', description: 'Bedding material' },
    { label: 'Medical - $75', amount: '75', category: 'medical', description: 'Medical supplies' },
  ],
  incomeQuickSelects: [
    { label: 'Egg Sales - $25', amount: '25', type: 'eggs', description: 'Egg sales' },
    { label: 'Meat Sales - $100', amount: '100', type: 'meat', description: 'Meat sales' },
    { label: 'Livestock Sales - $150', amount: '150', type: 'livestock', description: 'Livestock sales' },
  ],
  enabledAnimals: {
    chickens: true,
    rabbits: true,
    goats: false,
    ducks: false,
  },
};

export const [AppSettingsProvider, useAppSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to ensure all fields exist
          setSettings({
            ...defaultSettings,
            ...parsed,
          });
        }
      } catch (error) {
        console.error('Failed to load app settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }, []);

  const updateExpenseCategories = useCallback(async (categories: string[]) => {
    await saveSettings({ ...settings, expenseCategories: categories });
  }, [settings, saveSettings]);

  const updateIncomeTypes = useCallback(async (types: string[]) => {
    await saveSettings({ ...settings, incomeTypes: types });
  }, [settings, saveSettings]);

  const updateChickenEventTypes = useCallback(async (types: string[]) => {
    await saveSettings({ ...settings, chickenEventTypes: types });
  }, [settings, saveSettings]);

  const updateExpenseQuickSelects = useCallback(async (quickSelects: QuickSelectOption[]) => {
    await saveSettings({ ...settings, expenseQuickSelects: quickSelects });
  }, [settings, saveSettings]);

  const updateIncomeQuickSelects = useCallback(async (quickSelects: QuickSelectOption[]) => {
    await saveSettings({ ...settings, incomeQuickSelects: quickSelects });
  }, [settings, saveSettings]);

  const updateEnabledAnimals = useCallback(async (enabledAnimals: AppSettings['enabledAnimals']) => {
    await saveSettings({ ...settings, enabledAnimals });
  }, [settings, saveSettings]);

  const resetToDefaults = useCallback(async () => {
    await saveSettings(defaultSettings);
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    updateExpenseCategories,
    updateEnabledAnimals,
    updateIncomeTypes,
    updateChickenEventTypes,
    updateExpenseQuickSelects,
    updateIncomeQuickSelects,
    resetToDefaults,
  };
});
