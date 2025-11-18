import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemePalette, type ThemeMode } from "@/hooks/theme-store";
import { useLivestock } from "@/hooks/livestock-store";
import { Palette, Check, Download, Upload, Database, FileSpreadsheet, Sun, Moon } from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const insets = useSafeAreaInsets();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  const handlePaletteChange = (newPalette: ThemePalette) => {
    if (!newPalette || typeof newPalette !== 'string' || newPalette.length > 20) return;
    changePalette(newPalette);
  };

  const exportData = async () => {
    try {
      setIsExporting(true);
      console.log('Starting data export...');

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
          csvContent = 'date,laid,sold,broken,consumed,notes\n2025-01-01,12,10,1,1,"Good production"\n2025-01-02,10,8,0,2,""';
          fileName = 'egg-production-template.csv';
          break;
        case 'expenses':
          csvContent = 'date,category,amount,livestockType,description,recurring\n2025-01-01,feed,50.00,chicken,"Chicken feed purchase",false\n2025-01-02,medical,25.00,rabbit,"Vet visit",false';
          fileName = 'expenses-template.csv';
          break;
        case 'income':
          csvContent = 'date,type,amount,livestockType,quantity,description\n2025-01-01,eggs,30.00,chicken,24,"Sold 2 dozen eggs"\n2025-01-02,livestock,100.00,rabbit,1,"Sold rabbit"';
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

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('Headers:', headers);
      const rows = lines.slice(1);
      console.log('Data rows:', rows.length);

      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const values = rows[i].match(/(?:"([^"]*)"|([^,]+)|(?=,))/g)?.map(v => 
            v ? v.replace(/^"|"$/g, '').replace(/^,/, '').trim() : ''
          ) || [];
          
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          console.log(`Row ${i + 1}:`, row);

          switch (type) {
            case 'eggs':
              if (!row.date) {
                console.warn('Skipping row - missing date:', row);
                break;
              }
              
              const laid = parseInt(row.laid || '0') || 0;
              const sold = parseInt(row.sold || '0') || 0;
              const broken = parseInt(row.broken || '0') || 0;
              const consumed = parseInt(row.consumed || '0') || 0;
              const totalCount = laid + sold + broken + consumed;
              
              if (totalCount > 0) {
                const normalizedDate = new Date(row.date).toISOString().split('T')[0];
                const existingRecord = livestock.eggProduction.find(
                  e => e.date === normalizedDate
                );
                if (existingRecord) {
                  console.log('Skipping duplicate egg production for date:', normalizedDate);
                } else {
                  console.log('Adding egg production:', normalizedDate, 'laid:', laid, 'sold:', sold, 'broken:', broken, 'consumed:', consumed);
                  await livestock.addEggProduction({
                    date: normalizedDate,
                    count: totalCount,
                    laid,
                    sold,
                    broken,
                    consumed,
                    notes: row.notes || '',
                  });
                  importedCount++;
                  console.log('Successfully added egg production');
                }
              } else {
                console.warn('Skipping row - no egg data:', row);
              }
              break;
            case 'expenses':
              if (row.date && row.category && row.amount && row.livestockType) {
                const normalizedDate = new Date(row.date).toISOString().split('T')[0];
                const parsedAmount = parseFloat(row.amount) || 0;
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
              } else {
                console.warn('Skipping row - missing required fields:', row);
              }
              break;
            case 'income':
              if (row.date && row.type && row.amount && row.livestockType) {
                const normalizedDate = new Date(row.date).toISOString().split('T')[0];
                const parsedAmount = parseFloat(row.amount) || 0;
                const existingIncome = livestock.income.find(
                  i => i.date === normalizedDate && i.amount === parsedAmount && i.type === row.type
                );
                if (existingIncome) {
                  console.log('Skipping duplicate income:', normalizedDate, row.type, parsedAmount);
                } else {
                  console.log('Adding income:', normalizedDate, row.type, parsedAmount);
                  await livestock.addIncome({
                    date: normalizedDate,
                    type: row.type as any,
                    amount: parsedAmount,
                    livestockType: row.livestockType as any,
                    quantity: row.quantity ? parseInt(row.quantity) : undefined,
                    description: row.description || '',
                  });
                  importedCount++;
                  console.log('Successfully added income');
                }
              } else {
                console.warn('Skipping row - missing required fields:', row);
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

      console.log(`Import completed: ${importedCount} records imported`);
      setIsImportingCSV(false);
      
      if (errors.length > 0) {
        Alert.alert(
          'Import Complete',
          `Successfully imported ${importedCount} record(s). ${errors.length} row(s) had errors. Check console for details.`
        );
      } else {
        Alert.alert('Import Complete', `Successfully imported ${importedCount} record(s).`);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      if (error instanceof Error && error.message !== 'Cancelled') {
        Alert.alert('Error', 'Failed to import CSV. Please check the file format.');
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
});