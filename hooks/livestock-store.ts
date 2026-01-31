import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
import type { 
  Chicken, 
  Rabbit, 
  EggProduction, 
  BreedingRecord, 
  Expense, 
  Income,
  VaccinationRecord,
  HealthRecord,
  BreedingPlan,
  WeightRecord,
  FeedRecord,
  ChickenHistoryEvent,
  DuckHistoryEvent,
  IndividualAnimal,
  Duck,
  Group
} from '@/types/livestock';

let __idCounter = 0;
const createId = (): string => {
  __idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${__idCounter}-${rand}`;
};

// Ensure every record has a unique id and fix duplicates in-place before persisting
function ensureUniqueIds<T extends { id?: string }>(items: T[]): (T & { id: string })[] {
  const seen = new Set<string>();
  return items.map((item) => {
    let id = item?.id ? String(item.id) : undefined;
    if (!id || seen.has(id)) {
      id = createId();
    }
    seen.add(id);
    return { ...(item as T), id } as T & { id: string };
  });
}

// Storage wrapper using AsyncStorage for cross-platform compatibility
const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }
};

const STORAGE_KEYS = {
  CHICKENS: 'livestock_chickens',
  DUCKS: 'livestock_ducks',
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
  DUCK_HISTORY: 'livestock_duck_history',
  ANIMALS: 'livestock_animals',
  GROUPS: 'livestock_groups',
  MIGRATION_V2: 'livestock_migration_v2',
  MIGRATION_V3: 'livestock_migration_v3_multibreed_stage',
};

export const [LivestockProvider, useLivestock] = createContextHook(() => {
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [eggProduction, setEggProduction] = useState<EggProduction[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [breedingPlans, setBreedingPlans] = useState<BreedingPlan[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [chickenHistory, setChickenHistory] = useState<ChickenHistoryEvent[]>([]);
  const [duckHistory, setDuckHistory] = useState<DuckHistoryEvent[]>([]);
  const [animals, setAnimals] = useState<IndividualAnimal[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Migration V3: Convert single-breed events to multi-breed structure and add stage support
  const migrateToMultiBreedAndStage = useCallback((
    chickenEvents: ChickenHistoryEvent[],
    duckEvents: DuckHistoryEvent[],
    individualAnimals: IndividualAnimal[]
  ): { 
    chickenHistory: ChickenHistoryEvent[], 
    duckHistory: DuckHistoryEvent[], 
    animals: IndividualAnimal[] 
  } => {
    const migratedChickenHistory = chickenEvents.map(event => {
      // If already has breeds array, skip migration
      if (event.breeds && event.breeds.length > 0) {
        // Check if breeds have roosters/hens or old quantity field
        const needsQuantityMigration = event.breeds.some((b: any) => 'quantity' in b && !('roosters' in b));
        if (needsQuantityMigration) {
          // Migrate quantity to roosters/hens based on event sex
          return {
            ...event,
            breeds: event.breeds.map((b: any) => ({
              breed: b.breed,
              roosters: event.sex === 'M' ? (b.quantity || 0) : 0,
              hens: event.sex === 'F' ? (b.quantity || 0) : 0,
              cost: b.cost,
              notes: b.notes,
            })),
            stage: event.stage || 'mature',
          };
        }
        return event;
      }
      // Convert single breed to breeds array
      if (event.breed) {
        return {
          ...event,
          breeds: [{
            breed: event.breed,
            roosters: event.sex === 'M' ? event.quantity : 0,
            hens: event.sex === 'F' ? event.quantity : 0,
            cost: event.cost,
          }],
          stage: event.stage || 'mature', // Default to mature if not specified
        };
      }
      // If no breed, keep as is but add default stage
      return { ...event, stage: event.stage || 'mature' };
    });

    const migratedDuckHistory = duckEvents.map(event => {
      if (event.breeds && event.breeds.length > 0) {
        return event;
      }
      if (event.breed) {
        return {
          ...event,
          breeds: [{
            breed: event.breed,
            roosters: event.sex === 'M' ? event.quantity : 0,
            hens: event.sex === 'F' ? event.quantity : Math.floor(event.quantity / 2),
            cost: event.cost,
          }],
          stage: event.stage || 'mature',
        };
      }
      return { ...event, stage: event.stage || 'mature' };
    });

    const migratedAnimals = individualAnimals.map(animal => {
      // Add default stage if not present
      if (!animal.stage) {
        return {
          ...animal,
          stage: (animal.type === 'chicken' || animal.type === 'duck') ? 'mature' : 'adult',
        } as IndividualAnimal;
      }
      return animal;
    });

    return {
      chickenHistory: migratedChickenHistory,
      duckHistory: migratedDuckHistory,
      animals: migratedAnimals,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [
        chickensData, 
        ducksData,
        rabbitsData, 
        eggsData, 
        breedingData, 
        breedingPlansData,
        vaccinationsData,
        healthData,
        weightData,
        feedData,
        expensesData, 
        incomeData,
        chickenHistoryData,
        duckHistoryData,
        animalsData,
        groupsData,
        migrationV2Data,
        migrationV3Data
      ] = await Promise.all([
        storage.getItem(STORAGE_KEYS.CHICKENS),
        storage.getItem(STORAGE_KEYS.DUCKS),
        storage.getItem(STORAGE_KEYS.RABBITS),
        storage.getItem(STORAGE_KEYS.EGG_PRODUCTION),
        storage.getItem(STORAGE_KEYS.BREEDING_RECORDS),
        storage.getItem(STORAGE_KEYS.BREEDING_PLANS),
        storage.getItem(STORAGE_KEYS.VACCINATIONS),
        storage.getItem(STORAGE_KEYS.HEALTH_RECORDS),
        storage.getItem(STORAGE_KEYS.WEIGHT_RECORDS),
        storage.getItem(STORAGE_KEYS.FEED_RECORDS),
        storage.getItem(STORAGE_KEYS.EXPENSES),
        storage.getItem(STORAGE_KEYS.INCOME),
        storage.getItem(STORAGE_KEYS.CHICKEN_HISTORY),
        storage.getItem(STORAGE_KEYS.DUCK_HISTORY),
        storage.getItem(STORAGE_KEYS.ANIMALS),
        storage.getItem(STORAGE_KEYS.GROUPS),
        storage.getItem(STORAGE_KEYS.MIGRATION_V2),
        storage.getItem(STORAGE_KEYS.MIGRATION_V3),
      ]);

      if (chickensData) setChickens(JSON.parse(chickensData));
      if (ducksData) setDucks(JSON.parse(ducksData));
      if (rabbitsData) setRabbits(JSON.parse(rabbitsData));
      if (eggsData) setEggProduction(JSON.parse(eggsData));
      if (breedingData) setBreedingRecords(JSON.parse(breedingData));
      if (breedingPlansData) setBreedingPlans(JSON.parse(breedingPlansData));
      if (vaccinationsData) setVaccinations(JSON.parse(vaccinationsData));
      if (healthData) setHealthRecords(JSON.parse(healthData));
      if (weightData) setWeightRecords(JSON.parse(weightData));
      if (feedData) setFeedRecords(JSON.parse(feedData));
      if (expensesData) setExpenses(JSON.parse(expensesData));
      if (incomeData) setIncome(JSON.parse(incomeData));
      if (groupsData) setGroups(JSON.parse(groupsData));
      
      // Parse history data for potential migration
      let loadedChickenHistory: ChickenHistoryEvent[] = chickenHistoryData ? JSON.parse(chickenHistoryData) : [];
      let loadedDuckHistory: DuckHistoryEvent[] = duckHistoryData ? JSON.parse(duckHistoryData) : [];
      let loadedAnimals: IndividualAnimal[] = animalsData ? JSON.parse(animalsData) : [];
      
      // Migration: convert breed counts to individual animals
      const migratedV2 = migrationV2Data === 'true';
      if (!migratedV2 && (chickensData || rabbitsData)) {
        const loadedChickens: Chicken[] = chickensData ? JSON.parse(chickensData) : [];
        const loadedRabbits: Rabbit[] = rabbitsData ? JSON.parse(rabbitsData) : [];
        const generatedAnimals: IndividualAnimal[] = [];
        
        // Convert chickens to individual animals
        for (const chicken of loadedChickens) {
          if (chicken.status === 'active') {
            for (let i = 0; i < chicken.quantity; i++) {
              generatedAnimals.push({
                id: createId(),
                type: 'chicken',
                breed: chicken.breed,
                number: generatedAnimals.filter(a => a.type === 'chicken' && a.breed === chicken.breed).length + 1,
                dateAdded: chicken.dateAcquired,
                status: 'alive',
              });
            }
          }
        }
        
        // Convert rabbits to individual animals
        for (const rabbit of loadedRabbits) {
          if (rabbit.status === 'active') {
            for (let i = 0; i < rabbit.quantity; i++) {
              generatedAnimals.push({
                id: createId(),
                type: 'rabbit',
                breed: rabbit.breed,
                number: generatedAnimals.filter(a => a.type === 'rabbit' && a.breed === rabbit.breed).length + 1,
                dateAdded: rabbit.dateAcquired,
                status: 'alive',
              });
            }
          }
        }
        
        loadedAnimals = generatedAnimals;
        await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(generatedAnimals));
        await storage.setItem(STORAGE_KEYS.MIGRATION_V2, 'true');
      }

      // Migration V3: Multi-breed and stage support
      const migratedV3 = migrationV3Data === 'true';
      if (!migratedV3 && (loadedChickenHistory.length > 0 || loadedDuckHistory.length > 0 || loadedAnimals.length > 0)) {
        const migrated = migrateToMultiBreedAndStage(loadedChickenHistory, loadedDuckHistory, loadedAnimals);
        loadedChickenHistory = migrated.chickenHistory;
        loadedDuckHistory = migrated.duckHistory;
        loadedAnimals = migrated.animals;
        
        await Promise.all([
          storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(loadedChickenHistory)),
          storage.setItem(STORAGE_KEYS.DUCK_HISTORY, JSON.stringify(loadedDuckHistory)),
          storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(loadedAnimals)),
          storage.setItem(STORAGE_KEYS.MIGRATION_V3, 'true'),
        ]);
      }

      // Set migrated data
      setChickenHistory(loadedChickenHistory);
      setDuckHistory(loadedDuckHistory);
      setAnimals(loadedAnimals);

      // After loading, persist any fixed ids
      try {
        await Promise.all([
          chickensData && storage.setItem(STORAGE_KEYS.CHICKENS, JSON.stringify(ensureUniqueIds(JSON.parse(chickensData)))),
          rabbitsData && storage.setItem(STORAGE_KEYS.RABBITS, JSON.stringify(ensureUniqueIds(JSON.parse(rabbitsData)))),
          eggsData && storage.setItem(STORAGE_KEYS.EGG_PRODUCTION, JSON.stringify(ensureUniqueIds(JSON.parse(eggsData)))),
          breedingData && storage.setItem(STORAGE_KEYS.BREEDING_RECORDS, JSON.stringify(ensureUniqueIds(JSON.parse(breedingData)))),
          breedingPlansData && storage.setItem(STORAGE_KEYS.BREEDING_PLANS, JSON.stringify(ensureUniqueIds(JSON.parse(breedingPlansData)))),
          vaccinationsData && storage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(ensureUniqueIds(JSON.parse(vaccinationsData)))),
          healthData && storage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(ensureUniqueIds(JSON.parse(healthData)))),
          weightData && storage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(ensureUniqueIds(JSON.parse(weightData)))),
          feedData && storage.setItem(STORAGE_KEYS.FEED_RECORDS, JSON.stringify(ensureUniqueIds(JSON.parse(feedData)))),
          expensesData && storage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(ensureUniqueIds(JSON.parse(expensesData)))),
          incomeData && storage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(ensureUniqueIds(JSON.parse(incomeData)))),
          chickenHistoryData && storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(ensureUniqueIds(JSON.parse(chickenHistoryData)))),
        ]);
      } catch (persistError) {
        console.log('ensureUniqueIds persist skipped/failed', persistError);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chicken operations
  const addChicken = useCallback(async (chicken: Omit<Chicken, 'id'>) => {
    const newChicken: Chicken = { ...chicken, id: createId() };
    let updatedLocal: Chicken[] = [];
    setChickens(prev => {
      updatedLocal = [...prev, newChicken];
      void storage.setItem(STORAGE_KEYS.CHICKENS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newChicken;
  }, []);

  const updateChicken = useCallback(async (id: string, updates: Partial<Chicken>) => {
    const updated = chickens.map(c => c.id === id ? { ...c, ...updates } : c);
    setChickens(updated);
    await storage.setItem(STORAGE_KEYS.CHICKENS, JSON.stringify(updated));
  }, [chickens]);

  const deleteChicken = useCallback(async (id: string) => {
    const updated = chickens.filter(c => c.id !== id);
    setChickens(updated);
    await storage.setItem(STORAGE_KEYS.CHICKENS, JSON.stringify(updated));
  }, [chickens]);

  // Duck operations
  const addDuck = useCallback(async (duck: Omit<Duck, 'id'>) => {
    const newDuck: Duck = { ...duck, id: createId() };
    let updatedLocal: Duck[] = [];
    setDucks(prev => {
      updatedLocal = [...prev, newDuck];
      void storage.setItem(STORAGE_KEYS.DUCKS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newDuck;
  }, []);

  const updateDuck = useCallback(async (id: string, updates: Partial<Duck>) => {
    const updated = ducks.map(d => d.id === id ? { ...d, ...updates } : d);
    setDucks(updated);
    await storage.setItem(STORAGE_KEYS.DUCKS, JSON.stringify(updated));
  }, [ducks]);

  const deleteDuck = useCallback(async (id: string) => {
    const updated = ducks.filter(d => d.id !== id);
    setDucks(updated);
    await storage.setItem(STORAGE_KEYS.DUCKS, JSON.stringify(updated));
  }, [ducks]);

  // Rabbit operations
  const addRabbit = useCallback(async (rabbit: Omit<Rabbit, 'id'>) => {
    const newRabbit: Rabbit = { ...rabbit, id: createId() };
    let updatedLocal: Rabbit[] = [];
    setRabbits(prev => {
      updatedLocal = [...prev, newRabbit];
      void storage.setItem(STORAGE_KEYS.RABBITS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newRabbit;
  }, []);

  const updateRabbit = useCallback(async (id: string, updates: Partial<Rabbit>) => {
    const updated = rabbits.map(r => r.id === id ? { ...r, ...updates } : r);
    setRabbits(updated);
    await storage.setItem(STORAGE_KEYS.RABBITS, JSON.stringify(updated));
  }, [rabbits]);

  const deleteRabbit = useCallback(async (id: string) => {
    const updated = rabbits.filter(r => r.id !== id);
    setRabbits(updated);
    await storage.setItem(STORAGE_KEYS.RABBITS, JSON.stringify(updated));
  }, [rabbits]);

  // Egg production operations
  const addEggProduction = useCallback(async (production: Omit<EggProduction, 'id'>) => {
    let updatedLocal: EggProduction[] = [];
    setEggProduction(prev => {
      const existing = prev.find(e => e.date === production.date);
      if (existing) {
        updatedLocal = prev.map(e => 
          e.date === production.date 
            ? { 
                ...e, 
                count: production.count,
                laid: production.laid ?? e.laid,
                broken: production.broken ?? e.broken,
                donated: production.donated ?? e.donated,
                notes: production.notes ?? e.notes,
                sold: production.sold ?? e.sold,
              } 
            : e
        );
      } else {
        const newProduction: EggProduction = { ...production, id: createId() };
        updatedLocal = [...prev, newProduction];
      }
      void storage.setItem(STORAGE_KEYS.EGG_PRODUCTION, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return updatedLocal.find(e => e.date === production.date)!;
  }, []);

  const updateEggProduction = useCallback(async (id: string, updates: Partial<EggProduction>) => {
    const updated = eggProduction.map(e => e.id === id ? { ...e, ...updates } : e);
    setEggProduction(updated);
    await storage.setItem(STORAGE_KEYS.EGG_PRODUCTION, JSON.stringify(updated));
  }, [eggProduction]);

  const deleteEggProduction = useCallback(async (id: string) => {
    setEggProduction(prev => {
      const updated = prev.filter(e => e.id !== id);
      void storage.setItem(STORAGE_KEYS.EGG_PRODUCTION, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Breeding record operations
  const addBreedingRecord = useCallback(async (record: Omit<BreedingRecord, 'id'>) => {
    const newRecord: BreedingRecord = { ...record, id: createId() };
    let updatedLocal: BreedingRecord[] = [];
    setBreedingRecords(prev => {
      updatedLocal = [...prev, newRecord];
      void storage.setItem(STORAGE_KEYS.BREEDING_RECORDS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newRecord;
  }, []);

  const updateBreedingRecord = useCallback(async (id: string, updates: Partial<BreedingRecord>) => {
    const updated = breedingRecords.map(b => b.id === id ? { ...b, ...updates } : b);
    setBreedingRecords(updated);
    await storage.setItem(STORAGE_KEYS.BREEDING_RECORDS, JSON.stringify(updated));
  }, [breedingRecords]);

  const deleteBreedingRecord = useCallback(async (id: string) => {
    setBreedingRecords(prev => {
      const updated = prev.filter(b => b.id !== id);
      void storage.setItem(STORAGE_KEYS.BREEDING_RECORDS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Breeding plan operations
  const addBreedingPlan = useCallback(async (plan: Omit<BreedingPlan, 'id'>) => {
    const newPlan: BreedingPlan = { ...plan, id: createId() };
    let updatedLocal: BreedingPlan[] = [];
    setBreedingPlans(prev => {
      updatedLocal = [...prev, newPlan];
      void storage.setItem(STORAGE_KEYS.BREEDING_PLANS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newPlan;
  }, []);

  const updateBreedingPlan = useCallback(async (id: string, updates: Partial<BreedingPlan>) => {
    const updated = breedingPlans.map(p => p.id === id ? { ...p, ...updates } : p);
    setBreedingPlans(updated);
    await storage.setItem(STORAGE_KEYS.BREEDING_PLANS, JSON.stringify(updated));
  }, [breedingPlans]);

  const deleteBreedingPlan = useCallback(async (id: string) => {
    const updated = breedingPlans.filter(p => p.id !== id);
    setBreedingPlans(updated);
    await storage.setItem(STORAGE_KEYS.BREEDING_PLANS, JSON.stringify(updated));
  }, [breedingPlans]);

  // Vaccination operations
  const addVaccination = useCallback(async (vaccination: Omit<VaccinationRecord, 'id'>) => {
    const newVaccination: VaccinationRecord = { ...vaccination, id: createId() };
    let updatedLocal: VaccinationRecord[] = [];
    setVaccinations(prev => {
      updatedLocal = [...prev, newVaccination];
      void storage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newVaccination;
  }, []);

  // Health record operations
  const addHealthRecord = useCallback(async (record: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = { ...record, id: createId() };
    let updatedLocal: HealthRecord[] = [];
    setHealthRecords(prev => {
      updatedLocal = [...prev, newRecord];
      void storage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newRecord;
  }, []);

  // Weight record operations
  const addWeightRecord = useCallback(async (record: Omit<WeightRecord, 'id'>) => {
    const newRecord: WeightRecord = { ...record, id: createId() };
    let updatedLocal: WeightRecord[] = [];
    setWeightRecords(prev => {
      updatedLocal = [...prev, newRecord];
      void storage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newRecord;
  }, []);

  // Feed record operations
  const addFeedRecord = useCallback(async (record: Omit<FeedRecord, 'id'>) => {
    const newRecord: FeedRecord = { ...record, id: createId() };
    let updatedLocal: FeedRecord[] = [];
    setFeedRecords(prev => {
      updatedLocal = [...prev, newRecord];
      void storage.setItem(STORAGE_KEYS.FEED_RECORDS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newRecord;
  }, []);

  // Expense operations
  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: createId() };
    let updatedLocal: Expense[] = [];
    setExpenses(prev => {
      updatedLocal = [...prev, newExpense];
      void storage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newExpense;
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    setExpenses(updated);
    await storage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      void storage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Income operations
  const addIncome = useCallback(async (incomeItem: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...incomeItem, id: createId() };
    let updatedLocal: Income[] = [];
    setIncome(prev => {
      updatedLocal = [...prev, newIncome];
      void storage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newIncome;
  }, []);

  const updateIncome = useCallback(async (id: string, updates: Partial<Income>) => {
    const updated = income.map(i => i.id === id ? { ...i, ...updates } : i);
    setIncome(updated);
    await storage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(updated));
  }, [income]);

  const deleteIncome = useCallback(async (id: string) => {
    setIncome(prev => {
      const updated = prev.filter(i => i.id !== id);
      void storage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Chicken history operations
  const addChickenHistoryEvent = useCallback(async (event: Omit<ChickenHistoryEvent, 'id'>) => {
    const newEvent: ChickenHistoryEvent = { ...event, id: createId() };
    let updatedLocal: ChickenHistoryEvent[] = [];
    setChickenHistory(prev => {
      updatedLocal = [...prev, newEvent];
      void storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    
    // Auto-create individual animals for acquired events
    if (event.type === 'acquired' && event.quantity > 0) {
      console.log('[livestock-store] Creating animals for event:', { breeds: event.breeds, breed: event.breed, sex: event.sex, quantity: event.quantity });
      
      const newAnimals: IndividualAnimal[] = [];
      
      // Support both legacy single-breed and new multi-breed structure
      // Only use fallback if breeds array doesn't exist AND breed field has a valid value
      const breedsToProcess = event.breeds && event.breeds.length > 0 
        ? event.breeds 
        : (event.breed && event.breed.trim() ? [{ breed: event.breed, roosters: event.sex === 'M' ? event.quantity : 0, hens: event.sex === 'F' ? event.quantity : 0, cost: event.cost }] : []);
      
      console.log('[livestock-store] Breeds to process:', JSON.stringify(breedsToProcess, null, 2));
      
      // Process each breed entry
      for (const breedEntry of breedsToProcess) {
        console.log('[livestock-store] Processing breed entry:', JSON.stringify(breedEntry, null, 2));
        
        if (!breedEntry.breed || breedEntry.breed.trim() === '') {
          console.warn('[livestock-store] Skipping breed entry with empty breed name');
          continue;
        }
        
        const existingNumbers = animals
          .filter(a => a.type === 'chicken')
          .map(a => a.number || 0);
        const startNumber = existingNumbers.length === 0 ? 1 : Math.max(...existingNumbers) + 1;
        
        let animalIndex = 0;
        
        // Create roosters
        for (let i = 0; i < breedEntry.roosters; i++) {
          newAnimals.push({
            id: createId(),
            type: 'chicken',
            breed: breedEntry.breed,
            dateAdded: event.date,
            status: 'alive',
            sex: 'M',
            number: startNumber + animalIndex,
            stage: event.stage || 'mature',
            hatchDate: event.hatchDate,
            eventId: newEvent.id,
            groupId: event.groupId,
          });
          animalIndex++;
        }
        
        // Create hens
        for (let i = 0; i < breedEntry.hens; i++) {
          newAnimals.push({
            id: createId(),
            type: 'chicken',
            breed: breedEntry.breed,
            dateAdded: event.date,
            status: 'alive',
            sex: 'F',
            number: startNumber + animalIndex,
            stage: event.stage || 'mature',
            hatchDate: event.hatchDate,
            eventId: newEvent.id,
            groupId: event.groupId,
          });
          animalIndex++;
        }
        
        // Create chicks (unsexed)
        if (breedEntry.chicks) {
          for (let i = 0; i < breedEntry.chicks; i++) {
            newAnimals.push({
              id: createId(),
              type: 'chicken',
              breed: breedEntry.breed,
              dateAdded: event.date,
              status: 'alive',
              sex: undefined,
              number: startNumber + animalIndex,
              stage: 'chick',
              hatchDate: event.hatchDate,
              eventId: newEvent.id,
              groupId: event.groupId,
            });
            animalIndex++;
          }
        }
      }
      
      console.log('[livestock-store] Created animals:', newAnimals.map(a => ({ id: a.id, breed: a.breed, sex: a.sex, number: a.number })));
      
      if (newAnimals.length > 0) {
        setAnimals(prev => {
          const updated = [...prev, ...newAnimals];
          void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
          return updated;
        });
      }
    }
    
    // Auto-create expense/income record if cost is provided
    if (event.cost && event.cost > 0) {
      const description = event.notes || `${event.breed || 'Chickens'}`;
      
      if (event.type === 'sold') {
        await addIncome({
          type: 'livestock',
          amount: event.cost,
          date: event.date,
          livestockType: 'chicken',
          quantity: event.quantity,
          description,
        });
      } else {
        await addExpense({
          category: event.type === 'acquired' ? 'other' : 'other',
          amount: event.cost,
          date: event.date,
          livestockType: 'chicken',
          description,
        });
      }
    }
    
    return newEvent;
  }, [animals, addExpense, addIncome]);

  const updateChickenHistoryEvent = useCallback(async (id: string, updates: Partial<ChickenHistoryEvent>) => {
    const event = chickenHistory.find(e => e.id === id);
    if (!event) return;
    
    const updated = chickenHistory.map(e => e.id === id ? { ...e, ...updates } : e);
    setChickenHistory(updated);
    await storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(updated));
  }, [chickenHistory]);

  const deleteChickenHistoryEvent = useCallback(async (id: string) => {
    const event = chickenHistory.find(e => e.id === id);
    
    setChickenHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      void storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(updated));
      return updated;
    });

    // If deleting an acquired event, remove all chickens linked to this event
    if (event?.type === 'acquired') {
      const associatedChickens = animals.filter(a => 
        a.type === 'chicken' && a.eventId === id
      );

      if (associatedChickens.length > 0) {
        const updatedAnimals = animals.filter(a => a.eventId !== id);
        setAnimals(updatedAnimals);
        await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updatedAnimals));
      }
    }
  }, [chickenHistory, animals]);

  // Duck history operations
  const addDuckHistoryEvent = useCallback(async (event: Omit<DuckHistoryEvent, 'id'>) => {
    const newEvent: DuckHistoryEvent = { ...event, id: createId() };
    let updatedLocal: DuckHistoryEvent[] = [];
    setDuckHistory(prev => {
      updatedLocal = [...prev, newEvent];
      void storage.setItem(STORAGE_KEYS.DUCK_HISTORY, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    
    // Auto-create individual animals for acquired events
    if (event.type === 'acquired' && event.quantity > 0) {
      const newAnimals: IndividualAnimal[] = [];
      
      // Support both legacy single-breed and new multi-breed structure
      const breedsToProcess = event.breeds && event.breeds.length > 0 
        ? event.breeds 
        : [{ breed: event.breed || 'Unknown', quantity: event.quantity, cost: event.cost }];
      
      // Process each breed entry
      for (const breedEntry of breedsToProcess) {
        const existingNumbers = animals
          .filter(a => a.type === 'duck' && a.breed === breedEntry.breed)
          .map(a => a.number || 0);
        const startNumber = existingNumbers.length === 0 ? 1 : Math.max(...existingNumbers) + 1;
        
        const totalQuantity = breedEntry.roosters + breedEntry.hens;
        for (let i = 0; i < totalQuantity; i++) {
          newAnimals.push({
            id: createId(),
            type: 'duck',
            breed: breedEntry.breed,
            dateAdded: event.date,
            status: 'alive',
            sex: event.sex,
            number: startNumber + i,
            stage: event.stage || 'mature',
            hatchDate: event.hatchDate,
            eventId: newEvent.id,
          });
        }
      }
      
      if (newAnimals.length > 0) {
        setAnimals(prev => {
          const updated = [...prev, ...newAnimals];
          void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
          return updated;
        });
      }
    }
    
    // Auto-create expense/income record if cost is provided
    if (event.cost && event.cost > 0) {
      const description = event.notes || `${event.breed || 'Ducks'}`;
      
      if (event.type === 'sold') {
        await addIncome({
          type: 'livestock',
          amount: event.cost,
          date: event.date,
          livestockType: 'duck',
          quantity: event.quantity,
          description,
        });
      } else {
        await addExpense({
          category: event.type === 'acquired' ? 'other' : 'other',
          amount: event.cost,
          date: event.date,
          livestockType: 'duck',
          description,
        });
      }
    }
    
    return newEvent;
  }, [animals, addExpense, addIncome]);

  const updateDuckHistoryEvent = useCallback(async (id: string, updates: Partial<DuckHistoryEvent>) => {
    const event = duckHistory.find(e => e.id === id);
    if (!event) return;
    
    const updated = duckHistory.map(e => e.id === id ? { ...e, ...updates } : e);
    setDuckHistory(updated);
    await storage.setItem(STORAGE_KEYS.DUCK_HISTORY, JSON.stringify(updated));
  }, [duckHistory]);

  const deleteDuckHistoryEvent = useCallback(async (id: string) => {
    const event = duckHistory.find(e => e.id === id);
    
    setDuckHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      void storage.setItem(STORAGE_KEYS.DUCK_HISTORY, JSON.stringify(updated));
      return updated;
    });

    // If deleting an acquired event, remove all ducks linked to this event
    if (event?.type === 'acquired') {
      const associatedDucks = animals.filter(a => 
        a.type === 'duck' && a.eventId === id
      );

      if (associatedDucks.length > 0) {
        const updatedAnimals = animals.filter(a => a.eventId !== id);
        setAnimals(updatedAnimals);
        await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updatedAnimals));
      }
    }
  }, [duckHistory, animals]);

  // Individual animal operations
  const getNextAnimalNumber = useCallback((type: 'chicken' | 'rabbit' | 'goat' | 'duck', breed: string): number => {
    const existingNumbers = animals
      .filter(a => a.type === type && a.breed === breed)
      .map(a => a.number);
    
    if (existingNumbers.length === 0) return 1;
    return Math.max(...existingNumbers) + 1;
  }, [animals]);

  // Group management functions
  const addGroup = useCallback(async (group: Omit<Group, 'id' | 'dateCreated'>) => {
    const newGroup: Group = {
      ...group,
      id: createId(),
      dateCreated: getLocalDateString(),
    };
    setGroups(prev => {
      const updated = [...prev, newGroup];
      void storage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updated));
      return updated;
    });
    return newGroup;
  }, []);

  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    setGroups(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, ...updates } : g);
      void storage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    setGroups(prev => {
      const updated = prev.filter(g => g.id !== id);
      void storage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getGroupsByType = useCallback((type: 'chicken' | 'duck' | 'rabbit') => {
    return groups.filter(g => g.type === type);
  }, [groups]);

  const addAnimal = useCallback(async (animal: Omit<IndividualAnimal, 'id' | 'number'> & { number?: number }) => {
    const number = animal.number ?? getNextAnimalNumber(animal.type, animal.breed);
    const newAnimal: IndividualAnimal = { 
      ...animal, 
      id: createId(), 
      number,
      status: animal.status ?? 'alive'
    };
    let updatedLocal: IndividualAnimal[] = [];
    setAnimals(prev => {
      updatedLocal = [...prev, newAnimal];
      void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updatedLocal));
      return updatedLocal;
    });
    return newAnimal;
  }, [getNextAnimalNumber]);

  const addAnimalsBatch = useCallback(async (type: 'chicken' | 'rabbit' | 'goat' | 'duck', breed: string, count: number, dateAdded: string, sex?: 'M' | 'F', skipEvent?: boolean, eventId?: string) => {
    const startNumber = getNextAnimalNumber(type, breed);
    const newAnimals: IndividualAnimal[] = [];
    
    for (let i = 0; i < count; i++) {
      newAnimals.push({
        id: createId(),
        type,
        breed,
        number: startNumber + i,
        dateAdded,
        status: 'alive',
        sex,
        eventId,
      });
    }
    
    setAnimals(prev => {
      const updated = [...prev, ...newAnimals];
      void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
      return updated;
    });

    // Create a history event for chickens (unless skipEvent is true)
    if (type === 'chicken' && !skipEvent) {
      const newEvent = await addChickenHistoryEvent({
        type: 'acquired',
        quantity: count,
        date: dateAdded,
        breed,
        sex,
      });
      
      // Update the animals with the event ID
      if (newEvent && !eventId) {
        setAnimals(prev => {
          const updated = prev.map(a => 
            newAnimals.some(na => na.id === a.id) ? { ...a, eventId: newEvent.id } : a
          );
          void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
          return updated;
        });
      }
    }
    
    // Create a history event for ducks (unless skipEvent is true)
    if (type === 'duck' && !skipEvent) {
      const newEvent = await addDuckHistoryEvent({
        type: 'acquired',
        quantity: count,
        date: dateAdded,
        breed,
        sex,
      });
      
      // Update the animals with the event ID
      if (newEvent && !eventId) {
        setAnimals(prev => {
          const updated = prev.map(a => 
            newAnimals.some(na => na.id === a.id) ? { ...a, eventId: newEvent.id } : a
          );
          void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
          return updated;
        });
      }
    }
    
    return newAnimals;
  }, [getNextAnimalNumber, addChickenHistoryEvent, addDuckHistoryEvent]);

  const updateAnimal = useCallback(async (id: string, updates: Partial<IndividualAnimal>) => {
    const animal = animals.find(a => a.id === id);
    if (!animal) return;

    const updated = animals.map(a => a.id === id ? { ...a, ...updates } : a);
    setAnimals(updated);
    await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));

    // For chickens with eventId, update the linked event when sex/breed changes
    if (animal.type === 'chicken' && animal.eventId && (updates.sex || updates.breed)) {
      const linkedEvent = chickenHistory.find(e => e.id === animal.eventId);
      
      if (linkedEvent && linkedEvent.type === 'acquired') {
        // If sex or breed changed, we need to move this animal to a different event
        if ((updates.sex && updates.sex !== animal.sex) || (updates.breed && updates.breed !== animal.breed)) {
          setChickenHistory(prev => {
            let updatedHistory = [...prev];
            
            // Decrement or remove old event
            const oldEvent = updatedHistory.find(e => e.id === animal.eventId);
            if (oldEvent) {
              if (oldEvent.quantity > 1) {
                updatedHistory = updatedHistory.map(e => 
                  e.id === oldEvent.id ? { ...e, quantity: e.quantity - 1 } : e
                );
              } else {
                updatedHistory = updatedHistory.filter(e => e.id !== oldEvent.id);
              }
            }
            
            // Find or create new event with updated attributes
            const newBreed = updates.breed || animal.breed;
            const newSex = updates.sex || animal.sex;
            const newEvent = updatedHistory.find(e => 
              e.type === 'acquired' &&
              e.date === animal.dateAdded &&
              e.breed === newBreed &&
              e.sex === newSex
            );
            
            if (newEvent) {
              updatedHistory = updatedHistory.map(e => 
                e.id === newEvent.id ? { ...e, quantity: e.quantity + 1 } : e
              );
              // Update animal's eventId
              setAnimals(prev => {
                const updated = prev.map(a => a.id === id ? { ...a, eventId: newEvent.id } : a);
                void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
                return updated;
              });
            } else {
              const createdEvent = {
                id: createId(),
                type: 'acquired' as const,
                quantity: 1,
                date: animal.dateAdded,
                breed: newBreed,
                sex: newSex,
              };
              updatedHistory.push(createdEvent);
              // Update animal's eventId
              setAnimals(prev => {
                const updated = prev.map(a => a.id === id ? { ...a, eventId: createdEvent.id } : a);
                void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
                return updated;
              });
            }
            
            void storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(updatedHistory));
            return updatedHistory;
          });
        }
      }
    }
  }, [animals, chickenHistory]);

  const removeAnimal = useCallback(async (id: string) => {
    const animal = animals.find(a => a.id === id);
    if (!animal) return;

    const updated = animals.filter(a => a.id !== id);
    setAnimals(updated);
    await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));

    // For chickens, decrement the acquired event that created this animal
    if (animal.type === 'chicken' && animal.eventId) {
      const acquiredEvent = chickenHistory.find(e => e.id === animal.eventId);

      if (acquiredEvent && acquiredEvent.type === 'acquired') {
        if (acquiredEvent.quantity > 1) {
          await updateChickenHistoryEvent(acquiredEvent.id, { 
            quantity: acquiredEvent.quantity - 1 
          });
        } else {
          await deleteChickenHistoryEvent(acquiredEvent.id);
        }
      }
    }
  }, [animals, chickenHistory, updateChickenHistoryEvent, deleteChickenHistoryEvent]);

  // Convert immature animals (chicks/ducklings/kits) to mature stage
  const matureAnimals = useCallback(async (params: {
    animalIds: string[];
    maleCount: number;
    femaleCount: number;
    targetBreed?: string;
  }) => {
    const { animalIds, maleCount, femaleCount, targetBreed } = params;
    
    const totalToMature = maleCount + femaleCount;
    if (totalToMature === 0) return;

    const animalsToMature = animals.filter(a => animalIds.includes(a.id)).slice(0, totalToMature);
    if (animalsToMature.length === 0) return;

    const animalType = animalsToMature[0].type;
    const maturedAnimals: IndividualAnimal[] = [];
    const today = getLocalDateString();

    // Create mature animals with sex assignments
    let maleAssigned = 0;
    let femaleAssigned = 0;

    for (const animal of animalsToMature) {
      const sex = maleAssigned < maleCount ? 'M' : 'F';
      if (sex === 'M') maleAssigned++;
      else femaleAssigned++;

      maturedAnimals.push({
        ...animal,
        stage: (animalType === 'chicken' || animalType === 'duck') ? 'mature' : 'adult',
        sex,
        breed: targetBreed || animal.breed,
      });
    }

    // Update animals in state
    const updatedAnimals = animals.map(a => {
      const matured = maturedAnimals.find(m => m.id === a.id);
      return matured || a;
    });
    
    setAnimals(updatedAnimals);
    await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updatedAnimals));

    // Create history event for the maturation
    if (animalType === 'chicken') {
      const breedGroups: { [breed: string]: { roosters: number; hens: number } } = {};
      maturedAnimals.forEach(a => {
        const breed = a.breed || 'Unknown';
        if (!breedGroups[breed]) breedGroups[breed] = { roosters: 0, hens: 0 };
        if (a.sex === 'M') breedGroups[breed].roosters++;
        else breedGroups[breed].hens++;
      });
      
      await addChickenHistoryEvent({
        type: 'acquired',
        date: today,
        quantity: maturedAnimals.length,
        breeds: Object.entries(breedGroups).map(([breed, counts]) => ({
          breed,
          roosters: counts.roosters,
          hens: counts.hens,
          chicks: 0,
        })),
        stage: 'mature',
        notes: `Matured from chicks`,
      });
    } else if (animalType === 'duck') {
      await addDuckHistoryEvent({
        type: 'acquired',
        date: today,
        quantity: animalsToMature.length,
        breed: targetBreed || animalsToMature[0].breed,
        stage: 'mature',
        notes: `Matured from ducklings: ${maleCount} drakes, ${femaleCount} hens`,
      });
    }

    return maturedAnimals;
  }, [animals, addChickenHistoryEvent, addDuckHistoryEvent]);

  const getAliveAnimals = useCallback((type?: 'chicken' | 'rabbit' | 'goat' | 'duck', breed?: string) => {
    return animals.filter(a => 
      a.status === 'alive' && 
      (!type || a.type === type) && 
      (!breed || a.breed === breed)
    );
  }, [animals]);

  const getAllAnimals = useCallback((type?: 'chicken' | 'rabbit' | 'goat' | 'duck', breed?: string) => {
    return animals.filter(a => 
      (!type || a.type === type) && 
      (!breed || a.breed === breed)
    );
  }, [animals]);

  const getChickenCountOnDate = useCallback((date: string): number => {
    const targetDate = new Date(date).getTime();
    const sortedEvents = [...chickenHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let count = 0;
    for (const event of sortedEvents) {
      const eventDate = new Date(event.date).getTime();
      if (eventDate > targetDate) break;
      
      if (event.type === 'acquired') {
        count += event.quantity;
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        count -= event.quantity;
      }
    }
    
    return Math.max(0, count);
  }, [chickenHistory]);

  const getRoostersAndHensCount = useCallback((date: string): { roosters: number; hens: number } => {
    const targetDate = new Date(date).getTime();
    const sortedEvents = [...chickenHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let roosters = 0;
    let hens = 0;
    
    for (const event of sortedEvents) {
      const eventDate = new Date(event.date).getTime();
      if (eventDate > targetDate) break;
      
      if (event.type === 'acquired') {
        if (event.sex === 'M') {
          roosters += event.quantity;
        } else if (event.sex === 'F') {
          hens += event.quantity;
        }
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        if (event.sex === 'M') {
          roosters = Math.max(0, roosters - event.quantity);
        } else if (event.sex === 'F') {
          hens = Math.max(0, hens - event.quantity);
        }
      }
    }
    
    return { roosters, hens };
  }, [chickenHistory]);

  const getChickenStageCount = useCallback((date: string): { roosters: number; hens: number; chicks: number } => {
    const aliveAnimals = animals.filter(a => a.type === 'chicken' && a.status === 'alive');
    
    const matureRoosters = aliveAnimals.filter(a => a.sex === 'M' && (!a.stage || a.stage === 'mature')).length;
    const matureHens = aliveAnimals.filter(a => a.sex === 'F' && (!a.stage || a.stage === 'mature')).length;
    const chicks = aliveAnimals.filter(a => a.stage === 'chick').length;
    
    return { roosters: matureRoosters, hens: matureHens, chicks };
  }, [animals]);

  const getDuckCountOnDate = useCallback((date: string): number => {
    const targetDate = new Date(date).getTime();
    const sortedEvents = [...duckHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let count = 0;
    for (const event of sortedEvents) {
      const eventDate = new Date(event.date).getTime();
      if (eventDate > targetDate) break;
      
      if (event.type === 'acquired') {
        count += event.quantity;
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        count -= event.quantity;
      }
    }
    
    return Math.max(0, count);
  }, [duckHistory]);

  const getDrakesAndHensCount = useCallback((date: string): { drakes: number; hens: number } => {
    const targetDate = new Date(date).getTime();
    const sortedEvents = [...duckHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let drakes = 0;
    let hens = 0;
    
    for (const event of sortedEvents) {
      const eventDate = new Date(event.date).getTime();
      if (eventDate > targetDate) break;
      
      if (event.type === 'acquired') {
        if (event.sex === 'M') {
          drakes += event.quantity;
        } else if (event.sex === 'F') {
          hens += event.quantity;
        }
      } else if (event.type === 'death' || event.type === 'sold' || event.type === 'consumed') {
        if (event.sex === 'M') {
          drakes = Math.max(0, drakes - event.quantity);
        } else if (event.sex === 'F') {
          hens = Math.max(0, hens - event.quantity);
        }
      }
    }
    
    return { drakes, hens };
  }, [duckHistory]);

  // Helper functions for rabbit breeding
  const getAvailableBucks = useCallback(() => {
    return rabbits.filter(r => r.gender === 'buck' && r.status === 'active');
  }, [rabbits]);

  const getAvailableDoes = useCallback(() => {
    return rabbits.filter(r => r.gender === 'doe' && r.status === 'active');
  }, [rabbits]);

  const getActiveBreedings = useCallback(() => {
    return breedingRecords.filter(b => ['bred', 'confirmed', 'kindled'].includes(b.status));
  }, [breedingRecords]);

  const getRabbitLineage = useCallback((rabbitId: string): Rabbit[] => {
    const rabbit = rabbits.find(r => r.id === rabbitId);
    if (!rabbit) return [];
    
    const lineage: Rabbit[] = [];
    if (rabbit.parentBuckId) {
      const buck = rabbits.find(r => r.id === rabbit.parentBuckId);
      if (buck) lineage.push(buck);
    }
    if (rabbit.parentDoeId) {
      const doe = rabbits.find(r => r.id === rabbit.parentDoeId);
      if (doe) lineage.push(doe);
    }
    return lineage;
  }, [rabbits]);

  const getUpcomingKindlings = useCallback(() => {
    const today = new Date();
    const upcoming = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    
    return breedingRecords.filter(b => {
      if (b.status !== 'bred' && b.status !== 'confirmed') return false;
      const kindlingDate = new Date(b.expectedKindlingDate);
      return kindlingDate >= today && kindlingDate <= upcoming;
    });
  }, [breedingRecords]);

  const getDueVaccinations = useCallback(() => {
    const today = new Date();
    const upcoming = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    return vaccinations.filter(v => {
      if (!v.nextDue) return false;
      const dueDate = new Date(v.nextDue);
      return dueDate >= today && dueDate <= upcoming;
    });
  }, [vaccinations]);

  return useMemo(() => ({
    chickens,
    ducks,
    rabbits,
    eggProduction,
    breedingRecords,
    breedingPlans,
    vaccinations,
    healthRecords,
    weightRecords,
    feedRecords,
    expenses,
    income,
    chickenHistory,
    duckHistory,
    animals,
    groups,
    isLoading,
    addChicken,
    updateChicken,
    deleteChicken,
    addDuck,
    updateDuck,
    deleteDuck,
    addRabbit,
    updateRabbit,
    deleteRabbit,
    addEggProduction,
    updateEggProduction,
    deleteEggProduction,
    addBreedingRecord,
    updateBreedingRecord,
    deleteBreedingRecord,
    addBreedingPlan,
    updateBreedingPlan,
    deleteBreedingPlan,
    addVaccination,
    addHealthRecord,
    addWeightRecord,
    addFeedRecord,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    getAvailableBucks,
    getAvailableDoes,
    getActiveBreedings,
    getRabbitLineage,
    getUpcomingKindlings,
    getDueVaccinations,
    addChickenHistoryEvent,
    updateChickenHistoryEvent,
    deleteChickenHistoryEvent,
    getChickenCountOnDate,
    getRoostersAndHensCount,
    getChickenStageCount,
    addDuckHistoryEvent,
    updateDuckHistoryEvent,
    deleteDuckHistoryEvent,
    getDuckCountOnDate,
    getDrakesAndHensCount,
    addAnimal,
    addAnimalsBatch,
    updateAnimal,
    removeAnimal,
    matureAnimals,
    getAliveAnimals,
    getAllAnimals,
    getNextAnimalNumber,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupsByType,
    reloadData: loadData,
  }), [
    chickens,
    ducks,
    rabbits,
    eggProduction,
    breedingRecords,
    breedingPlans,
    vaccinations,
    healthRecords,
    weightRecords,
    feedRecords,
    expenses,
    income,
    animals,
    groups,
    isLoading,
    addChicken,
    updateChicken,
    deleteChicken,
    addDuck,
    updateDuck,
    deleteDuck,
    addRabbit,
    updateRabbit,
    deleteRabbit,
    addEggProduction,
    updateEggProduction,
    deleteEggProduction,
    addBreedingRecord,
    updateBreedingRecord,
    deleteBreedingRecord,
    addBreedingPlan,
    updateBreedingPlan,
    deleteBreedingPlan,
    addVaccination,
    addHealthRecord,
    addWeightRecord,
    addFeedRecord,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    getAvailableBucks,
    getAvailableDoes,
    getActiveBreedings,
    getRabbitLineage,
    getUpcomingKindlings,
    getDueVaccinations,
    chickenHistory,
    duckHistory,
    addChickenHistoryEvent,
    updateChickenHistoryEvent,
    deleteChickenHistoryEvent,
    getChickenCountOnDate,
    getRoostersAndHensCount,
    getChickenStageCount,
    addDuckHistoryEvent,
    updateDuckHistoryEvent,
    deleteDuckHistoryEvent,
    getDuckCountOnDate,
    getDrakesAndHensCount,
    addAnimal,
    addAnimalsBatch,
    updateAnimal,
    removeAnimal,
    matureAnimals,
    getAliveAnimals,
    getAllAnimals,
    getNextAnimalNumber,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupsByType,
    loadData,
  ]);
});

// Helper hook for rabbit-specific operations
export const useRabbitBreeding = () => {
  const {
    rabbits,
    breedingRecords,
    breedingPlans,
    getAvailableBucks,
    getAvailableDoes,
    getActiveBreedings,
    getRabbitLineage,
    getUpcomingKindlings,
    addBreedingRecord,
    updateBreedingRecord,
    addBreedingPlan,
    updateBreedingPlan,
  } = useLivestock();

  const calculateKindlingDate = useCallback((breedingDate: string) => {
    const breeding = new Date(breedingDate);
    const kindling = new Date(breeding.getTime() + (31 * 24 * 60 * 60 * 1000)); // 31 days gestation
    return kindling.toISOString().split('T')[0];
  }, []);

  const isInbreedingRisk = useCallback((buckId: string, doeId: string) => {
    const buck = rabbits.find(r => r.id === buckId);
    const doe = rabbits.find(r => r.id === doeId);
    
    if (!buck || !doe) return false;
    
    // Check if they share parents
    if (buck.parentBuckId === doe.parentBuckId && buck.parentBuckId) return true;
    if (buck.parentDoeId === doe.parentDoeId && buck.parentDoeId) return true;
    
    // Check if one is parent of the other
    if (buck.id === doe.parentBuckId || doe.id === buck.parentDoeId) return true;
    
    return false;
  }, [rabbits]);

  const getBreedingHistory = useCallback((rabbitId: string) => {
    return breedingRecords.filter(b => b.buckId === rabbitId || b.doeId === rabbitId);
  }, [breedingRecords]);

  return {
    calculateKindlingDate,
    isInbreedingRisk,
    getBreedingHistory,
    availableBucks: getAvailableBucks(),
    availableDoes: getAvailableDoes(),
    activeBreedings: getActiveBreedings(),
    upcomingKindlings: getUpcomingKindlings(),
  };
};

// Helper hook for health tracking
export const useRabbitHealth = () => {
  const {
    rabbits,
    vaccinations,
    healthRecords,
    weightRecords,
    getDueVaccinations,
    addVaccination,
    addHealthRecord,
    addWeightRecord,
  } = useLivestock();

  const getRabbitVaccinations = useCallback((rabbitId: string) => {
    return vaccinations.filter(v => v.rabbitId === rabbitId);
  }, [vaccinations]);

  const getRabbitHealthRecords = useCallback((rabbitId: string) => {
    return healthRecords.filter(h => h.rabbitId === rabbitId);
  }, [healthRecords]);

  const getRabbitWeightHistory = useCallback((rabbitId: string) => {
    return weightRecords
      .filter(w => w.rabbitId === rabbitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [weightRecords]);

  const getActiveHealthIssues = useCallback((rabbitId: string) => {
    return healthRecords.filter(h => h.rabbitId === rabbitId && !h.resolved);
  }, [healthRecords]);

  return {
    getRabbitVaccinations,
    getRabbitHealthRecords,
    getRabbitWeightHistory,
    getActiveHealthIssues,
    dueVaccinations: getDueVaccinations(),
    addVaccination,
    addHealthRecord,
    addWeightRecord,
  };
};