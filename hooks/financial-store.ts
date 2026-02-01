import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinancialRecord } from '@/types/financial';

const STORAGE_KEY = '@livestock_app_financial_records';
const ROI_SNAPSHOTS_KEY = '@livestock_app_roi_snapshots';

interface FinancialState {
  records: FinancialRecord[];
  roiSnapshots: { date: string; roi: number }[];
  isLoading: boolean;
  
  // Actions
  loadRecords: () => Promise<void>;
  addRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<FinancialRecord>;
  updateRecord: (id: string, updates: Partial<FinancialRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteRecordsByEventId: (eventId: string) => Promise<void>;
  saveROISnapshot: (roi: number) => Promise<void>;
  loadROISnapshots: () => Promise<void>;
}

const createId = () => `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useFinancialStore = create<FinancialState>((set, get) => ({
  records: [],
  roiSnapshots: [],
  isLoading: false,
  
  loadRecords: async () => {
    set({ isLoading: true });
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        set({ records: JSON.parse(data), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[FinancialStore] Error loading records:', error);
      set({ isLoading: false });
    }
  },
  
  addRecord: async (record) => {
    const newRecord: FinancialRecord = { 
      ...record, 
      id: createId(),
      timestamp: new Date().toISOString()
    };
    const updated = [...get().records, newRecord];
    set({ records: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },
  
  updateRecord: async (id, updates) => {
    const updated = get().records.map(r => r.id === id ? { ...r, ...updates } : r);
    set({ records: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
  
  deleteRecord: async (id) => {
    const updated = get().records.filter(r => r.id !== id);
    set({ records: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
  
  deleteRecordsByEventId: async (eventId) => {
    const updated = get().records.filter(r => r.relatedEventId !== eventId);
    set({ records: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  loadROISnapshots: async () => {
    try {
      const data = await AsyncStorage.getItem(ROI_SNAPSHOTS_KEY);
      if (data) {
        set({ roiSnapshots: JSON.parse(data) });
      }
    } catch (error) {
      console.error('[FinancialStore] Error loading ROI snapshots:', error);
    }
  },

  saveROISnapshot: async (roi) => {
    const today = new Date().toISOString().split('T')[0];
    const snapshots = get().roiSnapshots;
    const existingIndex = snapshots.findIndex(s => s.date === today);
    
    let updated;
    if (existingIndex >= 0) {
      // Update today's snapshot
      updated = [...snapshots];
      updated[existingIndex] = { date: today, roi };
    } else {
      // Add new snapshot
      updated = [...snapshots, { date: today, roi }];
    }
    
    // Sort by date
    updated.sort((a, b) => a.date.localeCompare(b.date));
    
    set({ roiSnapshots: updated });
    await AsyncStorage.setItem(ROI_SNAPSHOTS_KEY, JSON.stringify(updated));
  },
}));
