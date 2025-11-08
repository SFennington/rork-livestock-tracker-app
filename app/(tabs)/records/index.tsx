import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from "react-native";
import { useLivestock } from "@/hooks/livestock-store";
import { useTheme } from "@/hooks/theme-store";
import { Egg, Heart, DollarSign, TrendingUp, ChevronUp, ChevronDown, Filter, Plus } from "lucide-react-native";
import { router } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "@/components/DatePicker";

type SortDirection = "asc" | "desc";

type EggSortKey = "date" | "count" | "notes";

type BreedSortKey = "breedingDate" | "expectedKindlingDate" | "status" | "litterSize";

type MoneySortKey = "date" | "amount" | "description" | "type";

export default function RecordsScreen() {
  const {
    eggProduction,
    breedingRecords,
    expenses,
    income,
    rabbits,
    isLoading,
    updateEggProduction,
    deleteEggProduction,
    updateBreedingRecord,
    deleteBreedingRecord,
    updateExpense,
    deleteExpense,
    updateIncome,
    deleteIncome,
  } = useLivestock();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'eggs' | 'breeding' | 'financial'>('eggs');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [eggForm, setEggForm] = useState<{ date: string; count: string; notes: string } | null>(null);
  const [breedForm, setBreedForm] = useState<{ breedingDate: string; expectedKindlingDate?: string; status?: string; litterSize?: string } | null>(null);
  const [moneyForm, setMoneyForm] = useState<{ date: string; amount: string; description?: string; isIncome: boolean; type?: string } | null>(null);

  const [eggSort, setEggSort] = useState<{ key: EggSortKey; dir: SortDirection }>({ key: "date", dir: "desc" });
  const [breedSort, setBreedSort] = useState<{ key: BreedSortKey; dir: SortDirection }>({ key: "breedingDate", dir: "desc" });
  const [moneySort, setMoneySort] = useState<{ key: MoneySortKey; dir: SortDirection }>({ key: "date", dir: "desc" });

  const [eggFilters, setEggFilters] = useState<{ startDate?: string; endDate?: string; minCount?: string; maxCount?: string; notes?: string }>({});
  const [breedFilters, setBreedFilters] = useState<{ startDate?: string; endDate?: string; status?: string } >({});
  const [moneyFilters, setMoneyFilters] = useState<{ startDate?: string; endDate?: string; minAmount?: string; maxAmount?: string; type?: "income" | "expense" | "all"; text?: string }>({ type: "all" });

  const insets = useSafeAreaInsets();

  const [selectedEggIds, setSelectedEggIds] = useState<Set<string>>(new Set());
  const [selectedBreedingIds, setSelectedBreedingIds] = useState<Set<string>>(new Set());
  const [selectedMoneyKeys, setSelectedMoneyKeys] = useState<Set<string>>(new Set());
  
  const [showEggFilters, setShowEggFilters] = useState(false);
  const [showBreedFilters, setShowBreedFilters] = useState(false);
  const [showMoneyFilters, setShowMoneyFilters] = useState(false);
  const [showEggDatePicker, setShowEggDatePicker] = useState<'start' | 'end' | null>(null);
  const [showBreedDatePicker, setShowBreedDatePicker] = useState<'start' | 'end' | null>(null);
  const [showMoneyDatePicker, setShowMoneyDatePicker] = useState<'start' | 'end' | null>(null);

  const toggleEggSelected = useCallback((id: string) => {
    setSelectedEggIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleBreedingSelected = useCallback((id: string) => {
    setSelectedBreedingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const moneyKey = useCallback((isIncomeRec: boolean, id: string) => `${isIncomeRec ? 'i' : 'e'}-${id}`, []);

  const toggleMoneySelected = useCallback((key: string) => {
    setSelectedMoneyKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedEggIds(new Set());
    setSelectedBreedingIds(new Set());
    setSelectedMoneyKeys(new Set());
  }, []);

  const filteredSortedEggs = useMemo(() => {
    const start = eggFilters.startDate ? new Date(eggFilters.startDate).getTime() : undefined;
    const end = eggFilters.endDate ? new Date(eggFilters.endDate).getTime() : undefined;
    const min = eggFilters.minCount ? Number(eggFilters.minCount) : undefined;
    const max = eggFilters.maxCount ? Number(eggFilters.maxCount) : undefined;
    const notesQ = eggFilters.notes?.toLowerCase() ?? '';

    const filtered = eggProduction.filter(r => {
      const t = new Date(r.date).getTime();
      if (start !== undefined && t < start) return false;
      if (end !== undefined && t > end) return false;
      if (min !== undefined && r.count < min) return false;
      if (max !== undefined && r.count > max) return false;
      if (notesQ && !(r.notes ?? '').toLowerCase().includes(notesQ)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = eggSort.dir === 'asc' ? 1 : -1;
      switch (eggSort.key) {
        case 'date':
          return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'count':
          return dir * (a.count - b.count);
        case 'notes':
          return dir * ((a.notes ?? '').localeCompare(b.notes ?? ''));
      }
    });

    return sorted;
  }, [eggProduction, eggFilters.startDate, eggFilters.endDate, eggFilters.minCount, eggFilters.maxCount, eggFilters.notes, eggSort.key, eggSort.dir]);

  const filteredSortedBreeding = useMemo(() => {
    const start = breedFilters.startDate ? new Date(breedFilters.startDate).getTime() : undefined;
    const end = breedFilters.endDate ? new Date(breedFilters.endDate).getTime() : undefined;
    const statusQ = breedFilters.status?.toLowerCase() ?? '';

    const filtered = breedingRecords.filter(r => {
      const t = new Date(r.breedingDate).getTime();
      if (start !== undefined && t < start) return false;
      if (end !== undefined && t > end) return false;
      if (statusQ && !(r.status ?? '').toLowerCase().includes(statusQ)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = breedSort.dir === 'asc' ? 1 : -1;
      switch (breedSort.key) {
        case 'breedingDate':
          return dir * (new Date(a.breedingDate).getTime() - new Date(b.breedingDate).getTime());
        case 'expectedKindlingDate':
          return dir * (new Date(a.expectedKindlingDate ?? '').getTime() - new Date(b.expectedKindlingDate ?? '').getTime());
        case 'status':
          return dir * ((a.status ?? '').localeCompare(b.status ?? ''));
        case 'litterSize':
          return dir * ((a.litterSize ?? 0) - (b.litterSize ?? 0));
      }
    });

    return sorted;
  }, [breedingRecords, breedFilters.startDate, breedFilters.endDate, breedFilters.status, breedSort.key, breedSort.dir]);

  const unifiedMoney = useMemo(() => {
    return [
      ...income.map(i => ({ ...i, isIncome: true as const, type: 'income' as const })),
      ...expenses.map(e => ({ ...e, isIncome: false as const, type: 'expense' as const })),
    ];
  }, [income, expenses]);

  const filteredSortedMoney = useMemo(() => {
    const start = moneyFilters.startDate ? new Date(moneyFilters.startDate).getTime() : undefined;
    const end = moneyFilters.endDate ? new Date(moneyFilters.endDate).getTime() : undefined;
    const min = moneyFilters.minAmount ? Number(moneyFilters.minAmount) : undefined;
    const max = moneyFilters.maxAmount ? Number(moneyFilters.maxAmount) : undefined;
    const q = moneyFilters.text?.toLowerCase() ?? '';

    const filtered = unifiedMoney.filter(r => {
      const t = new Date(r.date).getTime();
      if (start !== undefined && t < start) return false;
      if (end !== undefined && t > end) return false;
      if (min !== undefined && r.amount < min) return false;
      if (max !== undefined && r.amount > max) return false;
      if (moneyFilters.type && moneyFilters.type !== 'all') {
        if (moneyFilters.type === 'income' && !r.isIncome) return false;
        if (moneyFilters.type === 'expense' && r.isIncome) return false;
      }
      if (q && !(r.description ?? '').toLowerCase().includes(q)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = moneySort.dir === 'asc' ? 1 : -1;
      switch (moneySort.key) {
        case 'date':
          return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'amount':
          return dir * (a.amount - b.amount);
        case 'description':
          return dir * ((a.description ?? '').localeCompare(b.description ?? ''));
        case 'type':
          return dir * ((a.isIncome ? 'income' : 'expense').localeCompare(b.isIncome ? 'income' : 'expense'));
      }
    });

    return sorted;
  }, [unifiedMoney, moneyFilters.startDate, moneyFilters.endDate, moneyFilters.minAmount, moneyFilters.maxAmount, moneyFilters.type, moneyFilters.text, moneySort.key, moneySort.dir]);

  const SortIcon = ({ dir, active }: { dir: SortDirection; active: boolean }) => (
    <View style={styles.sortIconRow}>
      {active && (dir === 'asc' ? <ChevronUp size={14} color="#10b981" /> : <ChevronDown size={14} color="#10b981" />)}
    </View>
  );

  const isAllEggsSelected = selectedEggIds.size > 0 && selectedEggIds.size === filteredSortedEggs.length;
  const isAllBreedingSelected = selectedBreedingIds.size > 0 && selectedBreedingIds.size === filteredSortedBreeding.length;
  const isAllMoneySelected = selectedMoneyKeys.size > 0 && selectedMoneyKeys.size === filteredSortedMoney.length;

  const toggleSort = useCallback(<K extends string>(cur: { key: K; dir: SortDirection }, key: K): { key: K; dir: SortDirection } => {
    if (cur.key === key) {
      return { key, dir: cur.dir === "asc" ? "desc" : "asc" };
    }
    return { key, dir: "asc" };
  }, []);

  const bulkDeleteEggs = useCallback(async () => {
    if (selectedEggIds.size === 0) return;
    const proceed = Platform.OS === 'web' ? ((globalThis as any).confirm ? (globalThis as any).confirm(`Delete ${selectedEggIds.size} selected records?`) : true) : true;
    if (!proceed && Platform.OS === 'web') return;
    const run = async () => {
      const ids = Array.from(selectedEggIds);
      await Promise.all(ids.map(id => deleteEggProduction(id)));
      setSelectedEggIds(new Set());
    };
    if (Platform.OS !== 'web') {
      Alert.alert('Delete selected', `Delete ${selectedEggIds.size} selected records?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { void run(); } }
      ]);
    } else {
      await run();
    }
  }, [selectedEggIds, deleteEggProduction]);

  const bulkDeleteBreeding = useCallback(async () => {
    if (selectedBreedingIds.size === 0) return;
    const proceed = Platform.OS === 'web' ? ((globalThis as any).confirm ? (globalThis as any).confirm(`Delete ${selectedBreedingIds.size} selected records?`) : true) : true;
    if (!proceed && Platform.OS === 'web') return;
    const run = async () => {
      const ids = Array.from(selectedBreedingIds);
      await Promise.all(ids.map(id => deleteBreedingRecord(id)));
      setSelectedBreedingIds(new Set());
    };
    if (Platform.OS !== 'web') {
      Alert.alert('Delete selected', `Delete ${selectedBreedingIds.size} selected records?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { void run(); } }
      ]);
    } else {
      await run();
    }
  }, [selectedBreedingIds, deleteBreedingRecord]);

  const bulkDeleteMoney = useCallback(async () => {
    if (selectedMoneyKeys.size === 0) return;
    const proceed = Platform.OS === 'web' ? ((globalThis as any).confirm ? (globalThis as any).confirm(`Delete ${selectedMoneyKeys.size} selected records?`) : true) : true;
    if (!proceed && Platform.OS === 'web') return;
    const run = async () => {
      const keys = Array.from(selectedMoneyKeys);
      await Promise.all(keys.map(key => {
        const isIncomeKey = key.startsWith('i-');
        const id = key.slice(2);
        return isIncomeKey ? deleteIncome(id) : deleteExpense(id);
      }));
      setSelectedMoneyKeys(new Set());
    };
    if (Platform.OS !== 'web') {
      Alert.alert('Delete selected', `Delete ${selectedMoneyKeys.size} selected records?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { void run(); } }
      ]);
    } else {
      await run();
    }
  }, [selectedMoneyKeys, deleteIncome, deleteExpense]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}
        testID="records-loading">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]} testID="records-root">
        <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'eggs' && styles.activeTab]}
            onPress={() => { setActiveTab('eggs'); clearSelections(); }}
            testID="tab-eggs"
          >
            <Egg size={20} color={activeTab === 'eggs' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'eggs' ? colors.primary : colors.textMuted }]}>Eggs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'breeding' && styles.activeTab]}
            onPress={() => { setActiveTab('breeding'); clearSelections(); }}
            testID="tab-breeding"
          >
            <Heart size={20} color={activeTab === 'breeding' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'breeding' ? colors.primary : colors.textMuted }]}>Breeding</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'financial' && styles.activeTab]}
            onPress={() => { setActiveTab('financial'); clearSelections(); }}
            testID="tab-financial"
          >
            <DollarSign size={20} color={activeTab === 'financial' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'financial' ? colors.primary : colors.textMuted }]}>Financial</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          {activeTab === 'eggs' && (
            <View>
              <TouchableOpacity style={[styles.addRecordButton, { backgroundColor: colors.secondary }]} onPress={() => router.push('/log-eggs')}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addRecordButtonText}>Add Egg Record</Text>
              </TouchableOpacity>
              {filteredSortedEggs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Egg size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No egg production records</Text>
                  <Text style={styles.emptySubtext}>Start logging daily egg collection</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.toolbar}>
                    <View style={styles.toolbarTitleRow}>
                      <TouchableOpacity 
                        style={styles.filterToggleButton}
                        onPress={() => setShowEggFilters(!showEggFilters)}
                        testID="toggle-egg-filters"
                      >
                        <Filter size={16} color="#6b7280" />
                        <Text style={styles.toolbarTitle}>{showEggFilters ? 'Hide' : 'Show'} Filters</Text>
                        {showEggFilters ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                      </TouchableOpacity>
                    </View>
                    {showEggFilters && (<View style={styles.filtersRow}>
                      <TouchableOpacity style={styles.filterItemCompact} onPress={() => setShowEggDatePicker(showEggDatePicker === 'start' ? null : 'start')}>
                        <Text style={styles.filterLabelCompact}>From: {eggFilters.startDate || 'All'}</Text>
                      </TouchableOpacity>
                      {showEggDatePicker === 'start' && (
                        <View style={styles.datePickerOverlay}>
                          <DatePicker value={eggFilters.startDate ?? ''} onChange={(d) => { setEggFilters(prev => ({ ...prev, startDate: d })); setShowEggDatePicker(null); }} label="From" />
                        </View>
                      )}
                      <TouchableOpacity style={styles.filterItemCompact} onPress={() => setShowEggDatePicker(showEggDatePicker === 'end' ? null : 'end')}>
                        <Text style={styles.filterLabelCompact}>To: {eggFilters.endDate || 'All'}</Text>
                      </TouchableOpacity>
                      {showEggDatePicker === 'end' && (
                        <View style={styles.datePickerOverlay}>
                          <DatePicker value={eggFilters.endDate ?? ''} onChange={(d) => { setEggFilters(prev => ({ ...prev, endDate: d })); setShowEggDatePicker(null); }} label="To" />
                        </View>
                      )}
                      <View style={styles.filterItemTiny}> 
                        <Text style={styles.filterLabelCompact}>Min</Text>
                        <TextInput style={styles.filterInputCompact} keyboardType="numeric" value={eggFilters.minCount ?? ''} onChangeText={(t) => setEggFilters(prev => ({ ...prev, minCount: t }))} placeholder="0" />
                      </View>
                      <View style={styles.filterItemTiny}>
                        <Text style={styles.filterLabelCompact}>Max</Text>
                        <TextInput style={styles.filterInputCompact} keyboardType="numeric" value={eggFilters.maxCount ?? ''} onChangeText={(t) => setEggFilters(prev => ({ ...prev, maxCount: t }))} placeholder="999" />
                      </View>
                      <View style={styles.filterItemMedium}>
                        <Text style={styles.filterLabelCompact}>Notes</Text>
                        <TextInput style={styles.filterInputCompact} value={eggFilters.notes ?? ''} onChangeText={(t) => setEggFilters(prev => ({ ...prev, notes: t }))} placeholder="search" />
                      </View>
                      <TouchableOpacity style={styles.clearFiltersBtnCompact} onPress={() => { setEggFilters({}); setShowEggDatePicker(null); }} testID="eggs-clear-filters">
                        <Text style={styles.clearFiltersTextCompact}>Clear</Text>
                      </TouchableOpacity>
                    </View>)}
                    <View style={styles.bulkActionsRow}>
                      <TouchableOpacity accessibilityRole="button" testID="eggs-select-toggle" style={[styles.bulkBtn, isAllEggsSelected ? styles.bulkBtnActive : null]} onPress={() => {
                        if (isAllEggsSelected) setSelectedEggIds(new Set()); else setSelectedEggIds(new Set(filteredSortedEggs.map(r => r.id)));
                      }}>
                        <Text style={styles.bulkBtnText}>{isAllEggsSelected ? 'Unselect all' : 'Select all'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity accessibilityRole="button" testID="eggs-delete-selected" style={[styles.bulkBtn, selectedEggIds.size === 0 && styles.bulkBtnDisabled]} disabled={selectedEggIds.size === 0} onPress={() => { void bulkDeleteEggs(); }}>
                        <Text style={styles.bulkBtnDangerText}>Delete selected</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={[styles.rowHead]}>
                      <View style={[styles.cell, styles.cellXs]}>
                        <TouchableOpacity accessibilityRole="checkbox" testID="eggs-select-all" onPress={() => {
                          if (isAllEggsSelected) setSelectedEggIds(new Set()); else setSelectedEggIds(new Set(filteredSortedEggs.map(r => r.id)));
                        }} style={[styles.checkbox, isAllEggsSelected && styles.checkboxChecked]}>
                          <View style={[styles.checkboxInner, isAllEggsSelected && styles.checkboxInnerChecked]} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={[styles.cell, styles.cellMd]} onPress={() => setEggSort(prev => toggleSort(prev, 'date'))} testID="eggs-sort-date">
                        <Text style={styles.headText}>Date</Text>
                        <SortIcon dir={eggSort.dir} active={eggSort.key === 'date'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellSm]} onPress={() => setEggSort(prev => toggleSort(prev, 'count'))} testID="eggs-sort-count">
                        <Text style={styles.headText}>Laid</Text>
                        <SortIcon dir={eggSort.dir} active={eggSort.key === 'count'} />
                      </TouchableOpacity>
                      <View style={[styles.cell, styles.cellXsm]}>
                        <Text style={styles.headText}>Broken</Text>
                      </View>
                      <View style={[styles.cell, styles.cellXsm]}>
                        <Text style={styles.headText}>Consumed</Text>
                      </View>
                      <TouchableOpacity style={[styles.cell, styles.cellLg]} onPress={() => setEggSort(prev => toggleSort(prev, 'notes'))} testID="eggs-sort-notes">
                        <Text style={styles.headText}>Notes</Text>
                        <SortIcon dir={eggSort.dir} active={eggSort.key === 'notes'} />
                      </TouchableOpacity>
                    </View>

                    {filteredSortedEggs.map((record, index) => (
                      <TouchableOpacity key={record.id} style={[styles.rowBody, index % 2 === 0 ? { backgroundColor: '#fff' } : { backgroundColor: colors.secondary + '0D' }]} testID={`egg-row-${record.id}`} onPress={() => {
                        if (editingId !== record.id) {
                          setEditingId(record.id);
                          setEditingField(null);
                          setEggForm({ date: record.date, count: String(record.count), notes: record.notes ?? '' });
                        }
                      }} activeOpacity={0.7}>
                        <View style={[styles.cell, styles.cellXs]}>
                          <TouchableOpacity accessibilityRole="checkbox" testID={`egg-select-${record.id}`} onPress={(e) => { e.stopPropagation(); toggleEggSelected(record.id); }} style={[styles.checkbox, selectedEggIds.has(record.id) && styles.checkboxChecked]}>
                            <View style={[styles.checkboxInner, selectedEggIds.has(record.id) && styles.checkboxInnerChecked]} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.cell, styles.cellMd]}>
                          <Text style={styles.bodyText}>{record.date}</Text>
                        </View>
                        <View style={[styles.cell, styles.cellSm]}>
                          <Text style={styles.bodyText}>{record.laid ?? record.count}</Text>
                        </View>
                        <View style={[styles.cell, styles.cellXsm]}>
                          <Text style={styles.bodyText}>{record.broken ?? 0}</Text>
                        </View>
                        <View style={[styles.cell, styles.cellXsm]}>
                          <Text style={styles.bodyText}>{record.consumed ?? 0}</Text>
                        </View>
                        <View style={[styles.cell, styles.cellLg]}>
                          {editingId === record.id && editingField === 'notes' ? (

                            <View style={styles.inlineEditContainer}>
                              <TextInput testID={`egg-notes-${record.id}`} style={styles.inlineInputSmall} value={eggForm?.notes ?? (record.notes ?? '')} onChangeText={(t) => setEggForm(prev => ({ ...(prev ?? { date: record.date, count: String(record.count), notes: record.notes ?? '' }), notes: t }))} placeholder="optional" />
                              <TouchableOpacity testID={`egg-save-notes-${record.id}`} style={styles.inlineSaveButton} onPress={async (e) => {
                                e.stopPropagation();
                                try {
                                  const payload = eggForm ?? { date: record.date, count: String(record.count), notes: record.notes ?? '' };
                                  const parsed = parseInt(payload.count, 10);
                                  if (Number.isNaN(parsed)) {
                                    Alert.alert('Invalid', 'Count must be a number');
                                    return;
                                  }
                                  await updateEggProduction(record.id, { date: payload.date, count: parsed, notes: payload.notes?.trim() || undefined });
                                  setEditingId(null);
                                  setEditingField(null);
                                  setEggForm(null);
                                } catch (e) {
                                  Alert.alert('Error', 'Failed to save egg record');
                                  console.log('save egg error', e);
                                }
                              }}>
                                <Text style={styles.inlineSaveText}>✓</Text>
                              </TouchableOpacity>
                              <TouchableOpacity testID={`egg-cancel-notes-${record.id}`} style={styles.inlineCancelButton} onPress={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                                setEditingField(null);
                                setEggForm(null);
                              }}>
                                <Text style={styles.inlineCancelText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={(e) => {
                              e.stopPropagation();
                              setEditingId(record.id);
                              setEditingField('notes');
                              setEggForm({ date: record.date, count: String(record.count), notes: record.notes ?? '' });
                            }}>
                              <Text style={styles.bodyText}>{record.notes ?? ''}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {activeTab === 'breeding' && (
            <View>
              <TouchableOpacity style={styles.addRecordButton} onPress={() => router.push('/add-breeding')}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addRecordButtonText}>Add Breeding Record</Text>
              </TouchableOpacity>
              {filteredSortedBreeding.length === 0 ? (
                <View style={styles.emptyState}>
                  <Heart size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No breeding records</Text>
                  <Text style={styles.emptySubtext}>Record rabbit breeding activities</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.toolbar}>
                    <View style={styles.toolbarTitleRow}>
                      <TouchableOpacity 
                        style={styles.filterToggleButton}
                        onPress={() => setShowBreedFilters(!showBreedFilters)}
                        testID="toggle-breed-filters"
                      >
                        <Filter size={16} color="#6b7280" />
                        <Text style={styles.toolbarTitle}>{showBreedFilters ? 'Hide' : 'Show'} Filters</Text>
                        {showBreedFilters ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                      </TouchableOpacity>
                    </View>
                    {showBreedFilters && (<View style={styles.filtersRow}>
                      <TouchableOpacity style={styles.filterItemCompact} onPress={() => setShowBreedDatePicker(showBreedDatePicker === 'start' ? null : 'start')}>
                        <Text style={styles.filterLabelCompact}>From: {breedFilters.startDate || 'All'}</Text>
                      </TouchableOpacity>
                      {showBreedDatePicker === 'start' && (
                        <View style={styles.datePickerOverlay}>
                          <DatePicker value={breedFilters.startDate ?? ''} onChange={(d) => { setBreedFilters(prev => ({ ...prev, startDate: d })); setShowBreedDatePicker(null); }} label="From" />
                        </View>
                      )}
                      <TouchableOpacity style={styles.filterItemCompact} onPress={() => setShowBreedDatePicker(showBreedDatePicker === 'end' ? null : 'end')}>
                        <Text style={styles.filterLabelCompact}>To: {breedFilters.endDate || 'All'}</Text>
                      </TouchableOpacity>
                      {showBreedDatePicker === 'end' && (
                        <View style={styles.datePickerOverlay}>
                          <DatePicker value={breedFilters.endDate ?? ''} onChange={(d) => { setBreedFilters(prev => ({ ...prev, endDate: d })); setShowBreedDatePicker(null); }} label="To" />
                        </View>
                      )}
                      <View style={styles.filterItemMedium}>
                        <Text style={styles.filterLabelCompact}>Status</Text>
                        <TextInput style={styles.filterInputCompact} value={breedFilters.status ?? ''} onChangeText={(t) => setBreedFilters(prev => ({ ...prev, status: t }))} placeholder="bred/kindled" />
                      </View>
                      <TouchableOpacity style={styles.clearFiltersBtnCompact} onPress={() => { setBreedFilters({}); setShowBreedDatePicker(null); }} testID="breed-clear-filters">
                        <Text style={styles.clearFiltersTextCompact}>Clear</Text>
                      </TouchableOpacity>
                    </View>)}
                    <View style={styles.bulkActionsRow}>
                      <TouchableOpacity accessibilityRole="button" testID="breed-select-toggle" style={[styles.bulkBtn, isAllBreedingSelected ? styles.bulkBtnActive : null]} onPress={() => {
                        if (isAllBreedingSelected) setSelectedBreedingIds(new Set()); else setSelectedBreedingIds(new Set(filteredSortedBreeding.map(r => r.id)));
                      }}>
                        <Text style={styles.bulkBtnText}>{isAllBreedingSelected ? 'Unselect all' : 'Select all'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity accessibilityRole="button" testID="breed-delete-selected" style={[styles.bulkBtn, selectedBreedingIds.size === 0 && styles.bulkBtnDisabled]} disabled={selectedBreedingIds.size === 0} onPress={() => { void bulkDeleteBreeding(); }}>
                        <Text style={styles.bulkBtnDangerText}>Delete selected</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={styles.rowHead}>
                      <View style={[styles.cell, styles.cellXs]}>
                        <TouchableOpacity accessibilityRole="checkbox" testID="breed-select-all" onPress={() => {
                          if (isAllBreedingSelected) setSelectedBreedingIds(new Set()); else setSelectedBreedingIds(new Set(filteredSortedBreeding.map(r => r.id)));
                        }} style={[styles.checkbox, isAllBreedingSelected && styles.checkboxChecked]}>
                          <View style={[styles.checkboxInner, isAllBreedingSelected && styles.checkboxInnerChecked]} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={[styles.cell, styles.cellLg]} onPress={() => setBreedSort(prev => toggleSort(prev, 'breedingDate'))} testID="breed-sort-bred">
                        <Text style={styles.headText}>Bred</Text>
                        <SortIcon dir={breedSort.dir} active={breedSort.key === 'breedingDate'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellLg]} onPress={() => setBreedSort(prev => toggleSort(prev, 'expectedKindlingDate'))} testID="breed-sort-expected">
                        <Text style={styles.headText}>Expected</Text>
                        <SortIcon dir={breedSort.dir} active={breedSort.key === 'expectedKindlingDate'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellMd]} onPress={() => setBreedSort(prev => toggleSort(prev, 'status'))} testID="breed-sort-status">
                        <Text style={styles.headText}>Status</Text>
                        <SortIcon dir={breedSort.dir} active={breedSort.key === 'status'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellSm]} onPress={() => setBreedSort(prev => toggleSort(prev, 'litterSize'))} testID="breed-sort-litter">
                        <Text style={styles.headText}>Litter</Text>
                        <SortIcon dir={breedSort.dir} active={breedSort.key === 'litterSize'} />
                      </TouchableOpacity>
                    </View>

                    {filteredSortedBreeding.map((record, index) => {
                      const buck = rabbits.find(r => r.id === record.buckId);
                      const doe = rabbits.find(r => r.id === record.doeId);
                      return (
                        <TouchableOpacity key={record.id} style={[styles.rowBody, index % 2 === 0 ? { backgroundColor: '#fff' } : { backgroundColor: colors.secondary + '0D' }]} testID={`breed-row-${record.id}`} onPress={() => {
                          if (editingId !== record.id) {
                            setEditingId(record.id);
                            setEditingField(null);
                            setBreedForm({ breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined });
                          }
                        }} activeOpacity={0.7}>
                          <View style={[styles.cell, styles.cellXs]}>
                            <TouchableOpacity accessibilityRole="checkbox" testID={`breed-select-${record.id}`} onPress={(e) => { e.stopPropagation(); toggleBreedingSelected(record.id); }} style={[styles.checkbox, selectedBreedingIds.has(record.id) && styles.checkboxChecked]}>
                              <View style={[styles.checkboxInner, selectedBreedingIds.has(record.id) && styles.checkboxInnerChecked]} />
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.cell, styles.cellLg]}>
                            <Text style={styles.bodyText}>{record.breedingDate}</Text>
                          </View>
                          <View style={[styles.cell, styles.cellLg]}>
                            <Text style={styles.bodyText}>{record.expectedKindlingDate || ''}</Text>
                          </View>
                          <View style={[styles.cell, styles.cellMd]}>
                            {editingId === record.id && editingField === 'status' ? (
                              <View style={styles.inlineEditContainer}>
                                <TextInput testID={`breed-status-${record.id}`} style={styles.inlineInputSmall} value={breedForm?.status ?? (record.status ?? '')} onChangeText={(t) => setBreedForm(prev => ({ ...(prev ?? { breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined }), status: t }))} placeholder="status" />
                                <TouchableOpacity testID={`breed-save-${record.id}`} style={styles.inlineSaveButton} onPress={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const f = breedForm ?? { breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined };
                                    const litter = f.litterSize ? parseInt(f.litterSize, 10) : undefined;
                                    if (f.litterSize && Number.isNaN(litter)) {
                                      Alert.alert('Invalid', 'Litter size must be a number');
                                      return;
                                    }
                                    await updateBreedingRecord(record.id, { breedingDate: f.breedingDate, expectedKindlingDate: f.expectedKindlingDate, status: f.status as any, litterSize: litter });
                                    setEditingId(null);
                                    setEditingField(null);
                                    setBreedForm(null);
                                  } catch (e) {
                                    Alert.alert('Error', 'Failed to save breeding record');
                                    console.log('save breeding error', e);
                                  }
                                }}>
                                  <Text style={styles.inlineSaveText}>✓</Text>
                                </TouchableOpacity>
                                <TouchableOpacity testID={`breed-cancel-${record.id}`} style={styles.inlineCancelButton} onPress={(e) => {
                                  e.stopPropagation();
                                  setEditingId(null);
                                  setEditingField(null);
                                  setBreedForm(null);
                                }}>
                                  <Text style={styles.inlineCancelText}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                setEditingId(record.id);
                                setEditingField('status');
                                setBreedForm({ breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined });
                              }}>
                                <Text style={styles.bodyText}>{record.status}</Text>
                              </TouchableOpacity>
                            )}
                            <Text style={styles.subtleText}>{(buck?.name || 'Unknown') + ' × ' + (doe?.name || 'Unknown')}</Text>
                          </View>
                          <View style={[styles.cell, styles.cellSm]}>
                            {editingId === record.id && editingField === 'litter' ? (
                              <View style={styles.inlineEditContainer}>
                                <TextInput testID={`breed-litter-${record.id}`} style={styles.inlineInputSmall} keyboardType="numeric" value={breedForm?.litterSize ?? (record.litterSize ? String(record.litterSize) : '')} onChangeText={(t) => setBreedForm(prev => ({ ...(prev ?? { breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined }), litterSize: t }))} placeholder="#" />
                                <TouchableOpacity testID={`breed-save-litter-${record.id}`} style={styles.inlineSaveButton} onPress={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const f = breedForm ?? { breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined };
                                    const litter = f.litterSize ? parseInt(f.litterSize, 10) : undefined;
                                    if (f.litterSize && Number.isNaN(litter)) {
                                      Alert.alert('Invalid', 'Litter size must be a number');
                                      return;
                                    }
                                    await updateBreedingRecord(record.id, { breedingDate: f.breedingDate, expectedKindlingDate: f.expectedKindlingDate, status: f.status as any, litterSize: litter });
                                    setEditingId(null);
                                    setEditingField(null);
                                    setBreedForm(null);
                                  } catch (e) {
                                    Alert.alert('Error', 'Failed to save breeding record');
                                    console.log('save breeding error', e);
                                  }
                                }}>
                                  <Text style={styles.inlineSaveText}>✓</Text>
                                </TouchableOpacity>
                                <TouchableOpacity testID={`breed-cancel-litter-${record.id}`} style={styles.inlineCancelButton} onPress={(e) => {
                                  e.stopPropagation();
                                  setEditingId(null);
                                  setEditingField(null);
                                  setBreedForm(null);
                                }}>
                                  <Text style={styles.inlineCancelText}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                setEditingId(record.id);
                                setEditingField('litter');
                                setBreedForm({ breedingDate: record.breedingDate, expectedKindlingDate: record.expectedKindlingDate, status: record.status, litterSize: record.litterSize ? String(record.litterSize) : undefined });
                              }}>
                                <Text style={styles.bodyText}>{record.litterSize ?? ''}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {activeTab === 'financial' && (
            <View>
              <View style={styles.addRecordRow}>
                <TouchableOpacity style={[styles.addRecordButton, styles.addRecordButtonHalf, { backgroundColor: colors.secondary }]} onPress={() => router.push('/add-income')}>
                  <Plus size={20} color="#fff" />
                  <Text style={styles.addRecordButtonText}>Add Income</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addRecordButton, styles.addRecordButtonHalf, { backgroundColor: colors.secondary }]} onPress={() => router.push('/add-expense')}>
                  <Plus size={20} color="#fff" />
                  <Text style={styles.addRecordButtonText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.financialSummary}>
                <View style={styles.summaryCard}>
                  <TrendingUp size={20} color="#10b981" />
                  <Text style={styles.summaryLabel}>Total Income</Text>
                  <Text style={styles.summaryValue}>
                    ${income.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <DollarSign size={20} color="#ef4444" />
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                  <Text style={styles.summaryValue}>
                    ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {filteredSortedMoney.length === 0 ? (
                <View style={styles.emptyState}>
                  <DollarSign size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No financial records</Text>
                  <Text style={styles.emptySubtext}>Track expenses and income</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.toolbar}>
                    <View style={styles.toolbarTitleRow}>
                      <TouchableOpacity 
                        style={styles.filterToggleButton}
                        onPress={() => setShowMoneyFilters(!showMoneyFilters)}
                        testID="toggle-money-filters"
                      >
                        <Filter size={16} color="#6b7280" />
                        <Text style={styles.toolbarTitle}>{showMoneyFilters ? 'Hide' : 'Show'} Filters</Text>
                        {showMoneyFilters ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                      </TouchableOpacity>
                    </View>
                    {showMoneyFilters && (<View style={styles.filtersRow}>
                      <TouchableOpacity style={styles.filterItemCompact} onPress={() => setShowMoneyDatePicker(showMoneyDatePicker === 'start' ? null : 'start')}>
                        <Text style={styles.filterLabelCompact}>From: {moneyFilters.startDate || 'All'}</Text>
                      </TouchableOpacity>
                      {showMoneyDatePicker === 'start' && (
                        <View style={styles.datePickerOverlay}>
                          <DatePicker value={moneyFilters.startDate ?? ''} onChange={(d) => { setMoneyFilters(prev => ({ ...prev, startDate: d })); setShowMoneyDatePicker(null); }} label="From" />
                        </View>
                      )}
                      <TouchableOpacity style={styles.filterItemCompact} onPress={() => setShowMoneyDatePicker(showMoneyDatePicker === 'end' ? null : 'end')}>
                        <Text style={styles.filterLabelCompact}>To: {moneyFilters.endDate || 'All'}</Text>
                      </TouchableOpacity>
                      {showMoneyDatePicker === 'end' && (
                        <View style={styles.datePickerOverlay}>
                          <DatePicker value={moneyFilters.endDate ?? ''} onChange={(d) => { setMoneyFilters(prev => ({ ...prev, endDate: d })); setShowMoneyDatePicker(null); }} label="To" />
                        </View>
                      )}
                      <View style={styles.filterItemTiny}> 
                        <Text style={styles.filterLabelCompact}>Min $</Text>
                        <TextInput style={styles.filterInputCompact} keyboardType="decimal-pad" value={moneyFilters.minAmount ?? ''} onChangeText={(t) => setMoneyFilters(prev => ({ ...prev, minAmount: t }))} placeholder="0" />
                      </View>
                      <View style={styles.filterItemTiny}> 
                        <Text style={styles.filterLabelCompact}>Max $</Text>
                        <TextInput style={styles.filterInputCompact} keyboardType="decimal-pad" value={moneyFilters.maxAmount ?? ''} onChangeText={(t) => setMoneyFilters(prev => ({ ...prev, maxAmount: t }))} placeholder="9999" />
                      </View>
                      <View style={styles.filterItemTiny}>
                        <Text style={styles.filterLabelCompact}>Type</Text>
                        <TextInput style={styles.filterInputCompact} value={(moneyFilters.type ?? 'all').toString()} onChangeText={(t) => setMoneyFilters(prev => ({ ...prev, type: (t === 'income' || t === 'expense' || t === 'all') ? t : 'all' }))} placeholder="all" />
                      </View>
                      <View style={styles.filterItemMedium}>
                        <Text style={styles.filterLabelCompact}>Text</Text>
                        <TextInput style={styles.filterInputCompact} value={moneyFilters.text ?? ''} onChangeText={(t) => setMoneyFilters(prev => ({ ...prev, text: t }))} placeholder="search" />
                      </View>
                      <TouchableOpacity style={styles.clearFiltersBtnCompact} onPress={() => { setMoneyFilters({ type: 'all' }); setShowMoneyDatePicker(null); }} testID="money-clear-filters">
                        <Text style={styles.clearFiltersTextCompact}>Clear</Text>
                      </TouchableOpacity>
                    </View>)}
                    <View style={styles.bulkActionsRow}>
                      <TouchableOpacity accessibilityRole="button" testID="money-select-toggle" style={[styles.bulkBtn, isAllMoneySelected ? styles.bulkBtnActive : null]} onPress={() => {
                        if (isAllMoneySelected) setSelectedMoneyKeys(new Set()); else setSelectedMoneyKeys(new Set(filteredSortedMoney.map(r => moneyKey(r.isIncome, r.id))));
                      }}>
                        <Text style={styles.bulkBtnText}>{isAllMoneySelected ? 'Unselect all' : 'Select all'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity accessibilityRole="button" testID="money-delete-selected" style={[styles.bulkBtn, selectedMoneyKeys.size === 0 && styles.bulkBtnDisabled]} disabled={selectedMoneyKeys.size === 0} onPress={() => { void bulkDeleteMoney(); }}>
                        <Text style={styles.bulkBtnDangerText}>Delete selected</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.table}>
                    <View style={styles.rowHead}>
                      <View style={[styles.cell, styles.cellXs]}>
                        <TouchableOpacity accessibilityRole="checkbox" testID="money-select-all" onPress={() => {
                          if (isAllMoneySelected) setSelectedMoneyKeys(new Set()); else setSelectedMoneyKeys(new Set(filteredSortedMoney.map(r => moneyKey(r.isIncome, r.id))));
                        }} style={[styles.checkbox, isAllMoneySelected && styles.checkboxChecked]}>
                          <View style={[styles.checkboxInner, isAllMoneySelected && styles.checkboxInnerChecked]} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={[styles.cell, styles.cellSm]} onPress={() => setMoneySort(prev => toggleSort(prev, 'type'))} testID="money-sort-type">
                        <Text style={styles.headText}>Type</Text>
                        <SortIcon dir={moneySort.dir} active={moneySort.key === 'type'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellMd]} onPress={() => setMoneySort(prev => toggleSort(prev, 'date'))} testID="money-sort-date">
                        <Text style={styles.headText}>Date</Text>
                        <SortIcon dir={moneySort.dir} active={moneySort.key === 'date'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellSm]} onPress={() => setMoneySort(prev => toggleSort(prev, 'amount'))} testID="money-sort-amount">
                        <Text style={styles.headText}>Amount</Text>
                        <SortIcon dir={moneySort.dir} active={moneySort.key === 'amount'} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.cell, styles.cellLg]} onPress={() => setMoneySort(prev => toggleSort(prev, 'description'))} testID="money-sort-desc">
                        <Text style={styles.headText}>Description</Text>
                        <SortIcon dir={moneySort.dir} active={moneySort.key === 'description'} />
                      </TouchableOpacity>
                    </View>

                    {filteredSortedMoney.map((record, index) => (
                      <TouchableOpacity key={`${record.isIncome ? 'i' : 'e'}-${record.id}`} style={[styles.rowBody, index % 2 === 0 ? { backgroundColor: '#fff' } : { backgroundColor: colors.secondary + '0D' }]} testID={`money-row-${record.isIncome ? 'i' : 'e'}-${record.id}`} onPress={() => {
                        if (editingId !== record.id) {
                          setEditingId(record.id);
                          setEditingField(null);
                          setMoneyForm({ date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome });
                        }
                      }} activeOpacity={0.7}>
                        <View style={[styles.cell, styles.cellXs]}>
                          <TouchableOpacity accessibilityRole="checkbox" testID={`money-select-${record.isIncome ? 'i' : 'e'}-${record.id}`} onPress={(e) => { e.stopPropagation(); toggleMoneySelected(moneyKey(record.isIncome, record.id)); }} style={[styles.checkbox, selectedMoneyKeys.has(moneyKey(record.isIncome, record.id)) && styles.checkboxChecked]}>
                            <View style={[styles.checkboxInner, selectedMoneyKeys.has(moneyKey(record.isIncome, record.id)) && styles.checkboxInnerChecked]} />
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.cell, styles.cellSm]}>
                          <Text style={[styles.bodyText, record.isIncome ? styles.incomeText : styles.expenseText]}>{record.isIncome ? 'income' : 'expense'}</Text>
                        </View>
                        <View style={[styles.cell, styles.cellMd]}>
                          <Text style={styles.bodyText}>{record.date}</Text>
                        </View>
                        <View style={[styles.cell, styles.cellSm]}>
                          {editingId === record.id && editingField === 'amount' ? (
                            <View style={styles.inlineEditContainer}>
                              <TextInput testID={`money-amount-${record.id}`} style={styles.inlineInputSmall} keyboardType="decimal-pad" value={moneyForm?.amount ?? String(record.amount)} onChangeText={(t) => setMoneyForm(prev => ({ ...(prev ?? { date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome }), amount: t }))} />
                              <TouchableOpacity testID={`money-save-${record.id}`} style={styles.inlineSaveButton} onPress={async (e) => {
                                e.stopPropagation();
                                try {
                                  const f = moneyForm ?? { date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome };
                                  const amt = Number(f.amount);
                                  if (Number.isNaN(amt)) {
                                    Alert.alert('Invalid', 'Amount must be a number');
                                    return;
                                  }
                                  if (record.isIncome) {
                                    await updateIncome(record.id, { date: f.date, amount: amt, description: f.description });
                                  } else {
                                    await updateExpense(record.id, { date: f.date, amount: amt, description: f.description });
                                  }
                                  setEditingId(null);
                                  setEditingField(null);
                                  setMoneyForm(null);
                                } catch (e) {
                                  Alert.alert('Error', 'Failed to save record');
                                  console.log('save money error', e);
                                }
                              }}>
                                <Text style={styles.inlineSaveText}>✓</Text>
                              </TouchableOpacity>
                              <TouchableOpacity testID={`money-cancel-${record.id}`} style={styles.inlineCancelButton} onPress={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                                setEditingField(null);
                                setMoneyForm(null);
                              }}>
                                <Text style={styles.inlineCancelText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={(e) => {
                              e.stopPropagation();
                              setEditingId(record.id);
                              setEditingField('amount');
                              setMoneyForm({ date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome });
                            }}>
                              <Text style={styles.bodyText}>{(record.isIncome ? '+' : '-')}${record.amount.toFixed(2)}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={[styles.cell, styles.cellLg]}>
                          {editingId === record.id && editingField === 'description' ? (
                            <View style={styles.inlineEditContainer}>
                              <TextInput testID={`money-desc-${record.id}`} style={styles.inlineInputSmall} value={moneyForm?.description ?? (record.description ?? '')} onChangeText={(t) => setMoneyForm(prev => ({ ...(prev ?? { date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome }), description: t }))} placeholder="optional" />
                              <TouchableOpacity testID={`money-save-desc-${record.id}`} style={styles.inlineSaveButton} onPress={async (e) => {
                                e.stopPropagation();
                                try {
                                  const f = moneyForm ?? { date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome };
                                  const amt = Number(f.amount);
                                  if (Number.isNaN(amt)) {
                                    Alert.alert('Invalid', 'Amount must be a number');
                                    return;
                                  }
                                  if (record.isIncome) {
                                    await updateIncome(record.id, { date: f.date, amount: amt, description: f.description });
                                  } else {
                                    await updateExpense(record.id, { date: f.date, amount: amt, description: f.description });
                                  }
                                  setEditingId(null);
                                  setEditingField(null);
                                  setMoneyForm(null);
                                } catch (e) {
                                  Alert.alert('Error', 'Failed to save record');
                                  console.log('save money error', e);
                                }
                              }}>
                                <Text style={styles.inlineSaveText}>✓</Text>
                              </TouchableOpacity>
                              <TouchableOpacity testID={`money-cancel-desc-${record.id}`} style={styles.inlineCancelButton} onPress={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                                setEditingField(null);
                                setMoneyForm(null);
                              }}>
                                <Text style={styles.inlineCancelText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={(e) => {
                              e.stopPropagation();
                              setEditingId(record.id);
                              setEditingField('description');
                              setMoneyForm({ date: record.date, amount: String(record.amount), description: record.description, isIncome: record.isIncome });
                            }}>
                              <Text style={styles.bodyText}>{record.description ?? ''}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#10b981",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  toolbar: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  toolbarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  toolbarTitle: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  filterItem: {
    minWidth: 180,
    flexGrow: 1,
  },
  filterItemSmall: {
    minWidth: 100,
    maxWidth: 140,
    flexGrow: 1,
  },
  filterItemNotes: {
    minWidth: 200,
    flexGrow: 2,
  },
  filterItemCompact: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  filterItemTiny: {
    minWidth: 60,
    maxWidth: 80,
  },
  filterItemMedium: {
    minWidth: 100,
    maxWidth: 140,
  },
  filterLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  filterLabelCompact: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 3,
    fontWeight: "500",
  },
  filterInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
  filterInputCompact: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    color: "#111827",
  },
  clearFiltersBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  clearFiltersText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 13,
  },
  clearFiltersBtnCompact: {
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
  },
  clearFiltersTextCompact: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 11,
  },
  datePickerOverlay: {
    position: "absolute",
    top: 30,
    left: 0,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  table: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 800,
  },
  rowHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  rowBody: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cellXs: {
    width: 50,
    paddingHorizontal: 8,
  },
  cellXsm: {
    minWidth: 70,
    maxWidth: 80,
  },
  cellSm: {
    minWidth: 90,
    maxWidth: 110,
  },
  cellMd: {
    minWidth: 100,
    maxWidth: 120,
  },
  cellLg: {
    minWidth: 120,
    flex: 1,
  },
  cellActions: {
    width: 160,
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
  },

  headText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 14,
    color: "#111827",
  },
  subtleText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  inlineInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: "#111827",
    width: "100%",
  },
  inlineEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "100%",
  },
  inlineInputSmall: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 14,
    color: "#111827",
    flex: 1,
    minWidth: 40,
  },
  inlineSaveButton: {
    backgroundColor: "#10b981",
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineCancelButton: {
    backgroundColor: "#f3f4f6",
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineSaveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  inlineCancelText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  sortIconRow: {
    marginLeft: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  checkboxInnerChecked: {
    backgroundColor: "#10b981",
  },
  bulkActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 6,
  },
  bulkBtn: {
    backgroundColor: "#eef2ff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1,
  },
  bulkBtnDisabled: {
    opacity: 0.5,
  },
  bulkBtnActive: {
    backgroundColor: "#d1fae5",
  },
  bulkBtnText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  bulkBtnDangerText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  incomeText: {
    color: "#047857",
    fontWeight: "600",
  },
  expenseText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  financialSummary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  addRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  addRecordButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  addRecordRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  addRecordButtonHalf: {
    flex: 1,
    marginBottom: 0,
  },
  saveIconButton: {
    backgroundColor: "#10b981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelIconButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  cancelButtonTextSmall: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
