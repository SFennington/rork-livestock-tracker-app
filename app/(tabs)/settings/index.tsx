import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemePalette, type ThemeMode } from "@/hooks/theme-store";
import { useLivestock } from "@/hooks/livestock-store";
import { useAppSettings } from "@/hooks/app-settings-store";
import { useBackup, type BackupSchedule } from "@/hooks/backup-store";
import { Palette, Check, Download, Upload, Database, FileSpreadsheet, Sun, Moon, FolderOpen, CloudUpload, Clock, Settings as SettingsIcon, Egg as EggIcon } from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Check if Storage Access Framework is available
const StorageAccessFramework = FileSystem.StorageAccessFramework;
import { router } from "expo-router";

const PALETTE_NAMES: Record<ThemePalette, string> = {
  emerald: "Emerald Green",
  blue: "Ocean Blue", 
  purple: "Royal Purple",
  orange: "Sunset Orange",
  rose: "Rose Pink",
};

const PALETTE_DESCRIPTIONS: Record<ThemePalette, string> = {
  emerald: "Fresh and natural, perfect for farming",
  blue: "Calm and professional",
  purple: "Creative and modern",
  orange: "Warm and energetic", 
  rose: "Elegant and vibrant",
};

export default function SettingsScreen() {
  const { colors, palette, mode, availablePalettes, changePalette, changeMode } = useTheme();
  const livestock = useLivestock();
  const { settings, updateEggsOnHand, updateEggValuePerDozen } = useAppSettings();
  const backup = useBackup();
  const insets = useSafeAreaInsets();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [eggsOnHandInput, setEggsOnHandInput] = useState(Math.round(settings.eggsOnHand / 12).toString());
  const [eggValueInput, setEggValueInput] = useState(settings.eggValuePerDozen.toString());

  const handlePaletteChange = (newPalette: ThemePalette) => {
    if (!newPalette || typeof newPalette !== 'string' || newPalette.length > 20) return;
    changePalette(newPalette);
  };

  // Check if backup is due on mount
  useEffect(() => {
    const performAutoBackup = async () => {
      if (backup.isBackupDue()) {
        console.log('Auto-backup is due, performing backup...');
        await performBackup(true);
      }
    };
    performAutoBackup();
  }, []);

  const pickBackupFolder = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Web Platform',
          'On web, backups will automatically download to your Downloads folder. Set up your browser to auto-sync Downloads with Google Drive.',
          [{ text: 'OK' }]
        );
        await backup.setBackupFolder('web-downloads');
        return;
      }

      if (Platform.OS !== 'android') {
        Alert.alert(
          'Platform Not Supported',
          'Custom backup folders are currently only supported on Android. On iOS, backups will be saved to your app documents folder.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Requesting directory permissions...');
      console.log('FileSystem.StorageAccessFramework available:', !!FileSystem.StorageAccessFramework);
      
      // Use Storage Access Framework on Android for directory selection
      if (!FileSystem.StorageAccessFramework) {
        console.error('StorageAccessFramework is undefined');
        Alert.alert(
          'Feature Unavailable',
          'Storage Access Framework is not available. Backups will be saved to the app folder and can be exported via the backup/restore buttons.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      console.log('Permissions result:', permissions);
      
      if (permissions.granted) {
        const uri = permissions.directoryUri;
        console.log('Selected folder URI:', uri);
        await backup.setBackupFolder(uri);
        Alert.alert('Success', 'Backup folder selected successfully!');
      } else {
        console.log('Permissions denied');
        Alert.alert('Permission Denied', 'Storage access permission is required to save backups.');
      }
    } catch (error) {
      console.error('Folder picker error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to select folder: ${errorMessage}\n\nPlease try again.`);
    }
  };

  const exportAllBackups = async () => {
    try {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      
      if (!dirInfo.exists) {
        Alert.alert('No Backups', 'No automatic backups found. Enable auto-backup to create them.');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
      
      if (backupFiles.length === 0) {
        Alert.alert('No Backups', 'No backup files found.');
        return;
      }

      // Share the most recent backup
      const sortedFiles = backupFiles.sort().reverse();
      const latestBackup = `${backupDir}${sortedFiles[0]}`;
      
      await Sharing.shareAsync(latestBackup, {
        mimeType: 'application/json',
        dialogTitle: `Export Backup (${backupFiles.length} total backups available)`,
        UTI: 'public.json'
      });
    } catch (error) {
      console.error('Export backups error:', error);
      Alert.alert('Error', 'Failed to export backups');
    }
  };

  const performBackup = async (isAuto = false) => {
    try {
      setIsBackingUp(true);
      console.log('Performing backup...');

      const allData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          chickens: livestock.chickens,
          rabbits: livestock.rabbits,
          eggProduction: livestock.eggProduction,
          breedingRecords: livestock.breedingRecords,
          breedingPlans: livestock.breedingPlans,
          vaccinations: livestock.vaccinations,
          healthRecords: livestock.healthRecords,
          weightRecords: livestock.weightRecords,
          feedRecords: livestock.feedRecords,
          expenses: livestock.expenses,
          income: livestock.income,
          chickenHistory: livestock.chickenHistory,
        }
      };

      const jsonString = JSON.stringify(allData, null, 2);
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const fileName = `backup-${timestamp}.json`;

      // Save to app's backup directory
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      }

      const filePath = `${backupDir}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, jsonString);
      console.log('Backup saved to:', filePath);

      await backup.updateLastBackupDate(new Date().toISOString());
      
      if (!isAuto) {
        Alert.alert('Success', `Backup saved! Use "Export All Backups" to access it.`);
      }
      console.log('Backup completed');
    } catch (error) {
      console.error('Backup error:', error);
      if (!isAuto) {
        Alert.alert('Error', 'Failed to create backup. Please try again.');
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const getScheduleLabel = (schedule: BackupSchedule): string => {
    switch (schedule) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'off': return 'Off';
      default: return 'Off';
    }
  };

  const getLastBackupText = (): string => {
    if (!backup.settings.lastBackupDate) return 'Never';
    const lastBackup = new Date(backup.settings.lastBackupDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 1) return 'Less than 1 hour ago';
    if (hoursDiff < 24) return `${Math.floor(hoursDiff)} hours ago`;
    const daysDiff = Math.floor(hoursDiff / 24);
    return `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
  };

  const exportData = async () => {
    try {
      setIsExporting(true);
      console.log('Starting data export...');

      const allData = {
        version: '1.2.0',
        exportDate: new Date().toISOString(),
        _UNITS_GUIDE: {
          income_quantity: 'EGGS (individual eggs, not dozens). Example: 144 eggs = 12 dozen',
          eggProduction_count: 'EGGS (individual eggs)',
          eggProduction_laid: 'EGGS (individual eggs)',
        },
        data: {
          chickens: livestock.chickens,
          rabbits: livestock.rabbits,
          eggProduction: livestock.eggProduction,
          breedingRecords: livestock.breedingRecords,
          breedingPlans: livestock.breedingPlans,
          vaccinations: livestock.vaccinations,
          healthRecords: livestock.healthRecords,
          weightRecords: livestock.weightRecords,
          feedRecords: livestock.feedRecords,
          expenses: livestock.expenses,
          income: livestock.income,
          chickenHistory: livestock.chickenHistory,
          animals: livestock.animals,
        }
      };

      const jsonString = JSON.stringify(allData, null, 2);
      console.log('Data prepared, size:', jsonString.length);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `livestock-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Web export completed');
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        const fileName = `livestock-backup-${new Date().toISOString().split('T')[0]}.json`;
        const directory = new FileSystem.Directory(FileSystem.Paths.document!);
        const file = new FileSystem.File(directory, fileName);
        await file.write(jsonString);
        console.log('File written to:', file.uri);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri);
          console.log('Mobile export completed');
        } else {
          Alert.alert('Success', `Data saved to ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async () => {
    try {
      setIsImporting(true);
      console.log('Starting data import...');

      let jsonString: string;

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        const filePromise = new Promise<string>((resolve, reject) => {
          input.onchange = async (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }
            const text = await file.text();
            resolve(text);
          };
          input.oncancel = () => reject(new Error('Cancelled'));
        });

        input.click();
        jsonString = await filePromise;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('Import cancelled');
          setIsImporting(false);
          return;
        }

        const fileUri = result.assets[0].uri;
        const file = new FileSystem.File(fileUri);
        jsonString = await file.text();
      }

      console.log('File read, parsing JSON...');
      const importedData = JSON.parse(jsonString);

      if (!importedData.version || !importedData.data) {
        throw new Error('Invalid backup file format');
      }

      if (Platform.OS === 'web') {
        const confirmed = window.confirm('This will replace all your current data. Are you sure?');
        if (!confirmed) {
          setIsImporting(false);
        } else {
          try {
            console.log('Importing data to AsyncStorage (web)...');
            const STORAGE_KEYS = {
              CHICKENS: 'livestock_chickens',
              RABBITS: 'livestock_rabbits',
              EGG_PRODUCTION: 'livestock_egg_production',
              BREEDING_RECORDS: 'livestock_breeding_records',
              BREEDING_PLANS: 'livestock_breeding_plans',
              VACCINATIONS: 'livestock_vaccinations',
              HEALTH_RECORDS: 'livestock_health_records',
              WEIGHT_RECORDS: 'livestock_weight_records',
              FEED_RECORDS: 'livestock_feed_records',
              EXPENSES: 'livestock_expenses',
              INCOME: 'livestock_income',
              CHICKEN_HISTORY: 'livestock_chicken_history',
              ANIMALS: 'livestock_animals',
            } as const;

            await Promise.all([
              AsyncStorage.setItem(STORAGE_KEYS.CHICKENS, JSON.stringify(importedData.data.chickens ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.RABBITS, JSON.stringify(importedData.data.rabbits ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.EGG_PRODUCTION, JSON.stringify(importedData.data.eggProduction ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.BREEDING_RECORDS, JSON.stringify(importedData.data.breedingRecords ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.BREEDING_PLANS, JSON.stringify(importedData.data.breedingPlans ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(importedData.data.vaccinations ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(importedData.data.healthRecords ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(importedData.data.weightRecords ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.FEED_RECORDS, JSON.stringify(importedData.data.feedRecords ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(importedData.data.expenses ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(importedData.data.income ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(importedData.data.chickenHistory ?? [])),
              AsyncStorage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(importedData.data.animals ?? [])),
            ]);

            console.log('Import completed successfully (web)');
            setIsImporting(false);
            window.alert('Data imported successfully! The app will now reload.');
            window.location.reload();
          } catch (error) {
            console.error('Import save error (web):', error);
            setIsImporting(false);
            window.alert('Failed to save imported data.');
          }
        }
      } else {
        Alert.alert(
          'Confirm Import',
          'This will replace all your current data. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsImporting(false) },
            {
              text: 'Import',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('Importing data to AsyncStorage...');
                  const STORAGE_KEYS = {
                    CHICKENS: 'livestock_chickens',
                    RABBITS: 'livestock_rabbits',
                    EGG_PRODUCTION: 'livestock_egg_production',
                    BREEDING_RECORDS: 'livestock_breeding_records',
                    BREEDING_PLANS: 'livestock_breeding_plans',
                    VACCINATIONS: 'livestock_vaccinations',
                    HEALTH_RECORDS: 'livestock_health_records',
                    WEIGHT_RECORDS: 'livestock_weight_records',
                    FEED_RECORDS: 'livestock_feed_records',
                    EXPENSES: 'livestock_expenses',
                    INCOME: 'livestock_income',
                    CHICKEN_HISTORY: 'livestock_chicken_history',
                    ANIMALS: 'livestock_animals',
                  } as const;

                  await Promise.all([
                    AsyncStorage.setItem(STORAGE_KEYS.CHICKENS, JSON.stringify(importedData.data.chickens ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.RABBITS, JSON.stringify(importedData.data.rabbits ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.EGG_PRODUCTION, JSON.stringify(importedData.data.eggProduction ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.BREEDING_RECORDS, JSON.stringify(importedData.data.breedingRecords ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.BREEDING_PLANS, JSON.stringify(importedData.data.breedingPlans ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(importedData.data.vaccinations ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(importedData.data.healthRecords ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(importedData.data.weightRecords ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.FEED_RECORDS, JSON.stringify(importedData.data.feedRecords ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(importedData.data.expenses ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(importedData.data.income ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(importedData.data.chickenHistory ?? [])),
                    AsyncStorage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(importedData.data.animals ?? [])),
                  ]);

                  console.log('Import completed successfully');
                  Alert.alert(
                    'Success',
                    'Data imported successfully! Please reload the app to see the changes.',
                    [
                      {
                        text: 'Reload Now',
                        onPress: () => {
                          // No-op on native; user can reopen the app
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('Import save error:', error);
                  Alert.alert('Error', 'Failed to save imported data.');
                } finally {
                  setIsImporting(false);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof Error && error.message !== 'Cancelled') {
        Alert.alert('Error', 'Failed to import data. Please check the file format.');
      }
      setIsImporting(false);
    }
  };

  const downloadCSVTemplate = async (type: 'eggs' | 'expenses' | 'income' | 'breeding') => {
    try {
      setIsDownloadingTemplate(true);
      console.log('Downloading CSV template:', type);

      let csvContent = '';
      let fileName = '';

      switch (type) {
        case 'eggs':
          csvContent = 'date,laid,sold,broken,donated,notes\n2025-01-01,12,10,1,1,"Good production"\n2025-01-02,10,8,0,2,""';
          fileName = 'egg-production-template.csv';
          break;
        case 'expenses':
          csvContent = 'date,category,amount,livestockType,description,recurring\n2025-01-01,feed,50.00,chicken,"Chicken feed purchase",false\n2025-01-02,medical,25.00,rabbit,"Vet visit",false';
          fileName = 'expenses-template.csv';
          break;
        case 'income':
          csvContent = 'date,type,amount,livestockType,quantity,description\n2025-01-01,eggs,30.00,chicken,2,"Sold 2 dozen eggs"\n2025-01-02,eggs,0,chicken,1,"Donated 1 dozen eggs"\n2025-01-03,livestock,100.00,rabbit,1,"Sold rabbit"';
          fileName = 'income-template.csv';
          break;
        case 'breeding':
          csvContent = 'breedingDate,buckName,doeName,expectedKindlingDate,litterSize,status,notes\n2025-01-01,"Buck 1","Doe 1",2025-02-01,8,kindled,"Successful breeding"';
          fileName = 'breeding-template.csv';
          break;
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Web template download completed');
        Alert.alert('Success', 'Template downloaded successfully!');
      } else {
        const directory = new FileSystem.Directory(FileSystem.Paths.document!);
        const file = new FileSystem.File(directory, fileName);
        await file.write(csvContent);
        console.log('File written to:', file.uri);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri);
          console.log('Mobile template download completed');
        } else {
          Alert.alert('Success', `Template saved to ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('Template download error:', error);
      Alert.alert('Error', 'Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const importCSV = async (type: 'eggs' | 'expenses' | 'income' | 'breeding') => {
    try {
      setIsImportingCSV(true);
      console.log('Starting CSV import:', type);

      let csvString: string;

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,text/csv';
        
        const filePromise = new Promise<string>((resolve, reject) => {
          input.onchange = async (e: any) => {
            try {
              console.log('File selected, reading...');
              const file = e.target?.files?.[0];
              if (!file) {
                reject(new Error('No file selected'));
                return;
              }
              console.log('File name:', file.name, 'Size:', file.size, 'Type:', file.type);
              const text = await file.text();
              console.log('File read successfully, length:', text.length);
              resolve(text);
            } catch (error) {
              console.error('Error reading file:', error);
              reject(error);
            }
          };
          input.oncancel = () => {
            console.log('File selection cancelled');
            reject(new Error('Cancelled'));
          };
        });

        input.click();
        csvString = await filePromise;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('Import cancelled');
          setIsImportingCSV(false);
          return;
        }

        const fileUri = result.assets[0].uri;
        console.log('Reading file from:', fileUri);
        const file = new FileSystem.File(fileUri);
        csvString = await file.text();
        console.log('File read successfully, length:', csvString.length);
      }

      console.log('CSV file read, parsing...');
      console.log('First 200 chars:', csvString.substring(0, 200));
      const lines = csvString.split('\n').filter(line => line.trim());
      console.log('Total lines:', lines.length);
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace(/^\uFEFF/, ''));
      console.log('Headers:', headers);
      console.log('Header names:', headers.map((h, i) => `[${i}]: "${h}" (${h.length} chars)`));
      const rows = lines.slice(1);
      console.log('Data rows:', rows.length);

      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          // Parse CSV with proper comma handling - split by commas, respecting quotes
          const values: string[] = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let j = 0; j < rows[i].length; j++) {
            const char = rows[i][j];
            
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Push the last value
          
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          console.log(`Row ${i + 1}:`, row);

          switch (type) {
            case 'eggs':
              if (!row.date) {
                console.warn('Skipping row - missing date:', row);
                errors.push(`Row ${i + 2}: Missing date field`);
                break;
              }
              
              const laid = parseInt(row.laid || '0') || 0;
              const sold = parseInt(row.sold || '0') || 0;
              const broken = parseInt(row.broken || '0') || 0;
              const donated = parseInt(row.donated || '0') || 0;
              const totalCount = laid + sold + broken + donated;
              
              if (totalCount > 0) {
                try {
                  // Parse date and normalize to YYYY-MM-DD format
                  const dateObj = new Date(row.date);
                  if (isNaN(dateObj.getTime())) {
                    throw new Error(`Invalid date: "${row.date}"`);
                  }
                  const normalizedDate = dateObj.toISOString().split('T')[0];
                  const existingRecord = livestock.eggProduction.find(
                    e => e.date === normalizedDate
                  );
                  if (existingRecord) {
                    console.log('Skipping duplicate egg production for date:', normalizedDate);
                  } else {
                    console.log('Adding egg production:', normalizedDate, 'laid:', laid, 'sold:', sold, 'broken:', broken, 'donated:', donated);
                    await livestock.addEggProduction({
                      date: normalizedDate,
                      count: totalCount,
                      laid,
                      sold,
                      broken,
                      donated,
                      notes: row.notes || '',
                    });
                    importedCount++;
                    console.log('Successfully added egg production');
                  }
                } catch (dateError) {
                  const errMsg = dateError instanceof Error ? dateError.message : 'Date parsing failed';
                  console.error('Date error:', errMsg);
                  errors.push(`Row ${i + 2}: ${errMsg}`);
                }
              } else {
                console.warn('Skipping row - no egg data:', row);
                errors.push(`Row ${i + 2}: All egg counts are 0`);
              }
              break;
            case 'expenses':
              if (!row.date || !row.category || !row.amount || !row.livestockType) {
                console.warn('Skipping row - missing required fields:', row);
                errors.push(`Row ${i + 2}: Missing required field (date, category, amount, or livestockType)`);
                break;
              }
              
              try {
                const dateObj = new Date(row.date);
                if (isNaN(dateObj.getTime())) {
                  throw new Error(`Invalid date: "${row.date}"`);
                }
                const normalizedDate = dateObj.toISOString().split('T')[0];
                const parsedAmount = parseFloat(row.amount);
                if (isNaN(parsedAmount)) {
                  throw new Error(`Invalid amount: "${row.amount}"`);
                }
                
                const existingExpense = livestock.expenses.find(
                  e => e.date === normalizedDate && e.amount === parsedAmount && e.category === row.category
                );
                if (existingExpense) {
                  console.log('Skipping duplicate expense:', normalizedDate, row.category, parsedAmount);
                } else {
                  console.log('Adding expense:', normalizedDate, row.category, parsedAmount);
                  await livestock.addExpense({
                    date: normalizedDate,
                    category: row.category as any,
                    amount: parsedAmount,
                    livestockType: row.livestockType as any,
                    description: row.description || '',
                    recurring: row.recurring === 'true',
                  });
                  importedCount++;
                  console.log('Successfully added expense');
                }
              } catch (expenseError) {
                const errMsg = expenseError instanceof Error ? expenseError.message : 'Invalid data';
                console.error('Expense import error:', errMsg);
                errors.push(`Row ${i + 2}: ${errMsg}`);
              }
              break;
            case 'income':
              console.log(`Validating income row ${i + 2}:`, { date: row.date, type: row.type, amount: row.amount, livestockType: row.livestockType });
              console.log('Available fields:', Object.keys(row));
              if (!row.date) {
                errors.push(`Row ${i + 2}: Missing required field 'date'`);
                break;
              }
              if (!row.type) {
                errors.push(`Row ${i + 2}: Missing required field 'type'`);
                break;
              }
              if (!row.amount) {
                errors.push(`Row ${i + 2}: Missing required field 'amount'`);
                break;
              }
              if (!row.livestockType) {
                errors.push(`Row ${i + 2}: Missing required field 'livestockType'`);
                break;
              }
              
              try {
                const dateObj = new Date(row.date);
                if (isNaN(dateObj.getTime())) {
                  throw new Error(`Invalid date: "${row.date}"`);
                }
                const normalizedDate = dateObj.toISOString().split('T')[0];
                const parsedAmount = parseFloat(row.amount);
                if (isNaN(parsedAmount)) {
                  throw new Error(`Invalid amount: "${row.amount}"`);
                }
                
                const existingIncome = livestock.income.find(
                  i => i.date === normalizedDate && i.amount === parsedAmount && i.type === row.type
                );
                if (existingIncome) {
                  console.log('Skipping duplicate income:', normalizedDate, row.type, parsedAmount);
                } else {
                  console.log('Adding income:', normalizedDate, row.type, parsedAmount);
                  const parsedQuantity = row.quantity ? parseInt(row.quantity) : undefined;
                  // Convert dozens to eggs for egg-related income
                  const finalQuantity = (row.type === 'eggs' && parsedQuantity) ? parsedQuantity * 12 : parsedQuantity;
                  await livestock.addIncome({
                    date: normalizedDate,
                    type: row.type as any,
                    amount: parsedAmount,
                    livestockType: row.livestockType as any,
                    quantity: finalQuantity,
                    description: row.description || '',
                  });
                  importedCount++;
                  console.log('Successfully added income');
                }
              } catch (incomeError) {
                const errMsg = incomeError instanceof Error ? incomeError.message : 'Invalid data';
                console.error('Income import error:', errMsg);
                errors.push(`Row ${i + 2}: ${errMsg}`);
              }
              break;
            case 'breeding':
              if (row.breedingDate && row.buckName && row.doeName) {
                console.log('Looking for buck:', row.buckName, 'and doe:', row.doeName);
                const buck = livestock.rabbits.find(r => r.name === row.buckName && r.gender === 'buck');
                const doe = livestock.rabbits.find(r => r.name === row.doeName && r.gender === 'doe');
                
                if (buck && doe) {
                  const normalizedDate = new Date(row.breedingDate).toISOString().split('T')[0];
                  const existingBreeding = livestock.breedingRecords.find(
                    b => b.buckId === buck.id && b.doeId === doe.id && b.breedingDate === normalizedDate
                  );
                  if (existingBreeding) {
                    console.log('Skipping duplicate breeding record:', normalizedDate, buck.name, doe.name);
                  } else {
                    console.log('Adding breeding record');
                    await livestock.addBreedingRecord({
                      buckId: buck.id,
                      doeId: doe.id,
                      breedingDate: normalizedDate,
                      expectedKindlingDate: row.expectedKindlingDate ? new Date(row.expectedKindlingDate).toISOString().split('T')[0] : '',
                      litterSize: row.litterSize ? parseInt(row.litterSize) : undefined,
                      status: (row.status as any) || 'bred',
                      notes: row.notes || '',
                    });
                    importedCount++;
                    console.log('Successfully added breeding record');
                  }
                } else {
                  const errorMsg = `Row ${i + 2}: Could not find buck "${row.buckName}" or doe "${row.doeName}"`;
                  console.warn(errorMsg);
                  errors.push(errorMsg);
                }
              } else {
                console.warn('Skipping row - missing required fields:', row);
              }
              break;
          }
        } catch (error) {
          console.error(`Error importing row ${i + 2}:`, error);
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`Import completed: ${importedCount} records imported, ${errors.length} errors`);
      setIsImportingCSV(false);
      
      if (importedCount > 0) {
        if (errors.length > 0) {
          const errorSummary = errors.slice(0, 3).join('\n');
          const moreErrors = errors.length > 3 ? `\n...and ${errors.length - 3} more errors` : '';
          Alert.alert(
            'Import Complete',
            `Successfully imported ${importedCount} record(s).\n\n${errors.length} row(s) skipped:\n${errorSummary}${moreErrors}`
          );
        } else {
          Alert.alert('Import Complete', `Successfully imported ${importedCount} record(s).`);
        }
      } else {
        if (errors.length > 0) {
          const errorSummary = errors.slice(0, 3).join('\n');
          const moreErrors = errors.length > 3 ? `\n...and ${errors.length - 3} more errors` : '';
          Alert.alert(
            'Import Failed',
            `No records imported.\n\nErrors found:\n${errorSummary}${moreErrors}\n\nPlease check your CSV file format.`
          );
        } else {
          Alert.alert('Import Failed', 'No valid records found in CSV file. Please check the file format.');
        }
      }
    } catch (error) {
      console.error('CSV import error:', error);
      if (error instanceof Error && error.message !== 'Cancelled') {
        Alert.alert('Error', `Failed to import CSV: ${error.message}\n\nPlease check the file format.`);
      }
    } finally {
      setIsImportingCSV(false);
    }
  };

  return (
    <View style={[styles.backgroundContainer, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Customize your app experience
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {mode === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Customize your app theme
          </Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { 
                  backgroundColor: mode === 'light' ? colors.primary : colors.card,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => changeMode('light')}
              testID="mode-light"
            >
              <Sun size={20} color={mode === 'light' ? '#fff' : colors.textMuted} />
              <Text style={[styles.modeButtonText, { color: mode === 'light' ? '#fff' : colors.textMuted }]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { 
                  backgroundColor: mode === 'dark' ? colors.primary : colors.card,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => changeMode('dark')}
              testID="mode-dark"
            >
              <Moon size={20} color={mode === 'dark' ? '#fff' : colors.textMuted} />
              <Text style={[styles.modeButtonText, { color: mode === 'dark' ? '#fff' : colors.textMuted }]}>Dark</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subsectionTitle, { color: colors.text }]}>Color Palette</Text>

          <View style={styles.paletteGrid}>
            {availablePalettes.map((paletteOption) => (
              <TouchableOpacity
                key={paletteOption}
                style={[
                  styles.paletteCard,
                  { 
                    backgroundColor: colors.card,
                    borderColor: palette === paletteOption ? colors.primary : colors.border,
                    borderWidth: palette === paletteOption ? 2 : 1,
                  }
                ]}
                onPress={() => {
                  if (paletteOption && typeof paletteOption === 'string' && paletteOption.length <= 20) {
                    handlePaletteChange(paletteOption);
                  }
                }}
                testID={`palette-${paletteOption}`}
              >
                <View style={styles.palettePreview}>
                  <View 
                    style={[
                      styles.colorSwatch, 
                      styles.primarySwatch,
                      { backgroundColor: paletteOption === 'emerald' ? '#10b981' : 
                                        paletteOption === 'blue' ? '#3b82f6' :
                                        paletteOption === 'purple' ? '#8b5cf6' :
                                        paletteOption === 'orange' ? '#f97316' : '#f43f5e' }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: paletteOption === 'emerald' ? '#f59e0b' : 
                                        paletteOption === 'blue' ? '#8b5cf6' :
                                        paletteOption === 'purple' ? '#ec4899' :
                                        paletteOption === 'orange' ? '#8b5cf6' : '#8b5cf6' }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: paletteOption === 'emerald' ? '#6366f1' : 
                                        paletteOption === 'blue' ? '#06b6d4' :
                                        paletteOption === 'purple' ? '#f59e0b' :
                                        paletteOption === 'orange' ? '#06b6d4' : '#06b6d4' }
                    ]} 
                  />
                </View>
                
                <View style={styles.paletteInfo}>
                  <View style={styles.paletteHeader}>
                    <Text style={[styles.paletteName, { color: colors.text }]}>
                      {PALETTE_NAMES[paletteOption]}
                    </Text>
                    {palette === paletteOption && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.paletteDescription, { color: colors.textMuted }]}>
                    {PALETTE_DESCRIPTIONS[paletteOption]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App Configuration</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Customize categories, quick selects, and field options
          </Text>

          <TouchableOpacity
            style={[styles.dataButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/app-configuration')}
          >
            <SettingsIcon size={20} color="#fff" />
            <Text style={styles.dataButtonText}>Configure App Fields</Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Edit expense/income categories, quick select presets, and event types to match your farm's needs.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <EggIcon size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Egg Inventory</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Track eggs on hand and calculate consumption savings
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Eggs on Hand (Dozens)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={eggsOnHandInput}
                onChangeText={setEggsOnHandInput}
                onBlur={() => {
                  const num = parseInt(eggsOnHandInput) || 0;
                  updateEggsOnHand(num * 12);
                  setEggsOnHandInput(num.toString());
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Value per Dozen ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={eggValueInput}
                onChangeText={setEggValueInput}
                onBlur={() => {
                  const num = parseFloat(eggValueInput) || 4.00;
                  updateEggValuePerDozen(num);
                  setEggValueInput(num.toFixed(2));
                }}
                keyboardType="decimal-pad"
                placeholder="4.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Consumed eggs = Total laid - Sold - On hand - Broken - Donated. This calculates the value of eggs your household consumed, adding to your total income as savings.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Backup and restore your farm data
          </Text>

          <View style={styles.dataButtons}>
            <TouchableOpacity
              style={[
                styles.dataButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={exportData}
              disabled={isExporting}
              testID="export-data-button"
            >
              <Download size={20} color="#fff" />
              <Text style={styles.dataButtonText}>
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dataButton,
                { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary }
              ]}
              onPress={importData}
              disabled={isImporting}
              testID="import-data-button"
            >
              <Upload size={20} color={colors.primary} />
              <Text style={[styles.dataButtonText, { color: colors.primary }]}>
                {isImporting ? 'Importing...' : 'Import Data'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Export your data regularly to keep a backup. You can import it later to restore your information.
            </Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b', marginTop: 12 }]}>
            <Text style={[styles.infoText, { color: '#92400e', fontWeight: '600' }]}>
              📋 IMPORT UNITS GUIDE
            </Text>
            <Text style={[styles.infoText, { color: '#92400e', marginTop: 4 }]}>
              • Income quantity: Individual EGGS (not dozens){'\n'}
              • Example: 144 eggs = 12 dozen{'\n'}
              • Egg production counts: Individual EGGS{'\n'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.dataButton,
              { backgroundColor: colors.error, marginTop: 12 }
            ]}
            onPress={async () => {
              if (Platform.OS === 'web') {
                const confirmed = window.confirm('This will remove duplicate egg production records (keeping only one entry per date). Continue?');
                if (!confirmed) return;
                try {
                  setIsCleaningDuplicates(true);
                  console.log('Starting duplicate removal (web)...');
                  console.log('Current records:', livestock.eggProduction.length);
                  const uniqueRecords = new Map<string, typeof livestock.eggProduction[0]>();
                  livestock.eggProduction.forEach(record => {
                    if (!uniqueRecords.has(record.date)) {
                      uniqueRecords.set(record.date, record);
                    }
                  });
                  const cleaned = Array.from(uniqueRecords.values());
                  const removed = livestock.eggProduction.length - cleaned.length;
                  console.log('Cleaned records:', cleaned.length);
                  console.log('Removed:', removed);
                  await AsyncStorage.setItem('livestock_egg_production', JSON.stringify(cleaned));
                  console.log('Saved to storage');
                  if (livestock.reloadData) {
                    await livestock.reloadData();
                  }
                  alert(`Removed ${removed} duplicate record(s).`);
                } catch (error) {
                  console.error('Error cleaning duplicates (web):', error);
                  alert('Failed to remove duplicates.');
                } finally {
                  setIsCleaningDuplicates(false);
                }
                return;
              }

              Alert.alert(
                'Remove Duplicates',
                'This will remove duplicate egg production records (keeping only one entry per date). Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        setIsCleaningDuplicates(true);
                        console.log('Starting duplicate removal...');
                        console.log('Current records:', livestock.eggProduction.length);
                        const uniqueRecords = new Map<string, typeof livestock.eggProduction[0]>();
                        livestock.eggProduction.forEach(record => {
                          if (!uniqueRecords.has(record.date)) {
                            uniqueRecords.set(record.date, record);
                          }
                        });
                        const cleaned = Array.from(uniqueRecords.values());
                        const removed = livestock.eggProduction.length - cleaned.length;
                        console.log('Cleaned records:', cleaned.length);
                        console.log('Removed:', removed);
                        await AsyncStorage.setItem('livestock_egg_production', JSON.stringify(cleaned));
                        console.log('Saved to storage');
                        if (livestock.reloadData) {
                          await livestock.reloadData();
                        }
                        Alert.alert('Success', `Removed ${removed} duplicate record(s).`);
                      } catch (error) {
                        console.error('Error cleaning duplicates:', error);
                        Alert.alert('Error', 'Failed to remove duplicates.');
                      } finally {
                        setIsCleaningDuplicates(false);
                      }
                    }
                  }
                ]
              );
            }}
            disabled={isCleaningDuplicates}
            testID="clean-duplicates-button"
          >
            <Text style={styles.dataButtonText}>
              {isCleaningDuplicates ? 'Cleaning...' : 'Remove Duplicate Eggs'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CloudUpload size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Automatic Backups</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Automatically save backups to your chosen location
          </Text>

          <View style={[styles.backupStatusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.backupStatusRow}>
              <Text style={[styles.backupStatusLabel, { color: colors.textMuted }]}>Backup Location:</Text>
              <Text style={[styles.backupStatusValue, { color: colors.text }]}>
                App Storage
              </Text>
            </View>
            <View style={styles.backupStatusRow}>
              <Text style={[styles.backupStatusLabel, { color: colors.textMuted }]}>Schedule:</Text>
              <Text style={[styles.backupStatusValue, { color: colors.text }]}>
                {getScheduleLabel(backup.settings.schedule)}
              </Text>
            </View>
            <View style={styles.backupStatusRow}>
              <Text style={[styles.backupStatusLabel, { color: colors.textMuted }]}>Last Backup:</Text>
              <Text style={[styles.backupStatusValue, { color: colors.text }]}>
                {getLastBackupText()}
              </Text>
            </View>
          </View>

          <Text style={[styles.subsectionTitle, { color: colors.text, marginTop: 20 }]}>Backup Schedule</Text>
          <View style={styles.scheduleButtons}>
            {(['off', 'daily', 'weekly'] as BackupSchedule[]).map((schedule) => (
              <TouchableOpacity
                key={schedule}
                style={[
                  styles.scheduleButton,
                  {
                    backgroundColor: backup.settings.schedule === schedule ? colors.primary : colors.card,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => backup.setSchedule(schedule)}
              >
                <Clock size={16} color={backup.settings.schedule === schedule ? '#fff' : colors.textMuted} />
                <Text style={[
                  styles.scheduleButtonText,
                  { color: backup.settings.schedule === schedule ? '#fff' : colors.text }
                ]}>
                  {getScheduleLabel(schedule)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.dataButton, { backgroundColor: colors.primary, marginTop: 12 }]}
            onPress={exportAllBackups}
          >
            <FolderOpen size={20} color="#fff" />
            <Text style={styles.dataButtonText}>
              Export All Backups
            </Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Auto backups are saved to app storage. Use "Export All Backups" to access and transfer them to Google Drive or other storage.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileSpreadsheet size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CSV Import/Export</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Import data from spreadsheets or download templates
          </Text>

          <View style={styles.csvSection}>
            <Text style={[styles.csvSectionTitle, { color: colors.text }]}>Egg Production</Text>
            <View style={styles.csvButtons}>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => downloadCSVTemplate('eggs')}
                disabled={isDownloadingTemplate}
              >
                <Download size={16} color={colors.primary} />
                <Text style={[styles.csvButtonText, { color: colors.primary }]}>Template</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.primary }]}
                onPress={() => importCSV('eggs')}
                disabled={isImportingCSV}
              >
                <Upload size={16} color="#fff" />
                <Text style={[styles.csvButtonText, { color: "#fff" }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.csvSection}>
            <Text style={[styles.csvSectionTitle, { color: colors.text }]}>Expenses</Text>
            <View style={styles.csvButtons}>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => downloadCSVTemplate('expenses')}
                disabled={isDownloadingTemplate}
              >
                <Download size={16} color={colors.primary} />
                <Text style={[styles.csvButtonText, { color: colors.primary }]}>Template</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.primary }]}
                onPress={() => importCSV('expenses')}
                disabled={isImportingCSV}
              >
                <Upload size={16} color="#fff" />
                <Text style={[styles.csvButtonText, { color: "#fff" }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.csvSection}>
            <Text style={[styles.csvSectionTitle, { color: colors.text }]}>Income</Text>
            <View style={styles.csvButtons}>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => downloadCSVTemplate('income')}
                disabled={isDownloadingTemplate}
              >
                <Download size={16} color={colors.primary} />
                <Text style={[styles.csvButtonText, { color: colors.primary }]}>Template</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.primary }]}
                onPress={() => importCSV('income')}
                disabled={isImportingCSV}
              >
                <Upload size={16} color="#fff" />
                <Text style={[styles.csvButtonText, { color: "#fff" }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.csvSection}>
            <Text style={[styles.csvSectionTitle, { color: colors.text }]}>Breeding Records</Text>
            <View style={styles.csvButtons}>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => downloadCSVTemplate('breeding')}
                disabled={isDownloadingTemplate}
              >
                <Download size={16} color={colors.primary} />
                <Text style={[styles.csvButtonText, { color: colors.primary }]}>Template</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.csvButton, { backgroundColor: colors.primary }]}
                onPress={() => importCSV('breeding')}
                disabled={isImportingCSV}
              >
                <Upload size={16} color="#fff" />
                <Text style={[styles.csvButtonText, { color: "#fff" }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Download a template to see the required format. Fill it with your data and import it back.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              Livestock Tracker helps you manage your farm animals, track production, 
              monitor breeding cycles, and analyze your farm&apos;s performance.
            </Text>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>
              Version 1.0.5
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginTop: 20,
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  paletteGrid: {
    gap: 12,
  },
  paletteCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  palettePreview: {
    flexDirection: "row",
    gap: 4,
  },
  colorSwatch: {
    width: 12,
    height: 32,
    borderRadius: 6,
  },
  primarySwatch: {
    width: 16,
  },
  paletteInfo: {
    flex: 1,
  },
  paletteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  paletteName: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  paletteDescription: {
    fontSize: 12,
  },
  aboutCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
  },
  bottomSpacing: {
    height: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dataButtons: {
    gap: 12,
    marginBottom: 16,
  },
  dataButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  dataButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  csvSection: {
    marginBottom: 16,
  },
  csvSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  csvButtons: {
    flexDirection: "row",
    gap: 8,
  },
  csvButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  csvButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  backupStatusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  backupStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backupStatusLabel: {
    fontSize: 14,
  },
  backupStatusValue: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scheduleButtons: {
    flexDirection: "row",
    gap: 8,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  scheduleButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});