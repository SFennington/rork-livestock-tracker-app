import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BackupSchedule = 'off' | 'daily' | 'weekly';

interface BackupSettings {
  folderUri: string | null;
  schedule: BackupSchedule;
  lastBackupDate: string | null; // ISO date string
}

const STORAGE_KEY = 'backup_settings';

const defaultSettings: BackupSettings = {
  folderUri: null,
  schedule: 'off',
  lastBackupDate: null,
};

export const [BackupProvider, useBackup] = createContextHook(() => {
  const [settings, setSettings] = useState<BackupSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Failed to load backup settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: BackupSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save backup settings:', error);
    }
  }, []);

  const setBackupFolder = useCallback(async (folderUri: string | null) => {
    await saveSettings({ ...settings, folderUri });
  }, [settings, saveSettings]);

  const setSchedule = useCallback(async (schedule: BackupSchedule) => {
    await saveSettings({ ...settings, schedule });
  }, [settings, saveSettings]);

  const updateLastBackupDate = useCallback(async (date: string) => {
    await saveSettings({ ...settings, lastBackupDate: date });
  }, [settings, saveSettings]);

  const isBackupDue = useCallback((): boolean => {
    if (settings.schedule === 'off' || !settings.folderUri) {
      return false;
    }

    if (!settings.lastBackupDate) {
      return true; // Never backed up
    }

    const lastBackup = new Date(settings.lastBackupDate);
    const now = new Date();
    const hoursSinceBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

    if (settings.schedule === 'daily') {
      return hoursSinceBackup >= 24;
    } else if (settings.schedule === 'weekly') {
      return hoursSinceBackup >= 24 * 7;
    }

    return false;
  }, [settings]);

  return {
    settings,
    isLoading,
    setBackupFolder,
    setSchedule,
    updateLastBackupDate,
    isBackupDue,
  };
});
