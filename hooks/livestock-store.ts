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
  IndividualAnimal
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
  MIGRATION_V2: 'livestock_migration_v2',
};

export const [LivestockProvider, useLivestock] = createContextHook(() => {
  const [chickens, setChickens] = useState<Chicken[]>([]);
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
  const [animals, setAnimals] = useState<IndividualAnimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [
        chickensData, 
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
        animalsData,
        migrationV2Data
      ] = await Promise.all([
        storage.getItem(STORAGE_KEYS.CHICKENS),
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
        storage.getItem(STORAGE_KEYS.ANIMALS),
        storage.getItem(STORAGE_KEYS.MIGRATION_V2),
      ]);

      if (chickensData) setChickens(JSON.parse(chickensData));
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
      if (chickenHistoryData) setChickenHistory(JSON.parse(chickenHistoryData));
      
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
        
        setAnimals(generatedAnimals);
        await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(generatedAnimals));
        await storage.setItem(STORAGE_KEYS.MIGRATION_V2, 'true');
      } else if (animalsData) {
        setAnimals(JSON.parse(animalsData));
      }
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
                consumed: production.consumed ?? e.consumed,
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
    return newEvent;
  }, []);

  const updateChickenHistoryEvent = useCallback(async (id: string, updates: Partial<ChickenHistoryEvent>) => {
    const updated = chickenHistory.map(e => e.id === id ? { ...e, ...updates } : e);
    setChickenHistory(updated);
    await storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(updated));
  }, [chickenHistory]);

  const deleteChickenHistoryEvent = useCallback(async (id: string) => {
    setChickenHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      void storage.setItem(STORAGE_KEYS.CHICKEN_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Individual animal operations
  const getNextAnimalNumber = useCallback((type: 'chicken' | 'rabbit' | 'goat' | 'duck', breed: string): number => {
    const existingNumbers = animals
      .filter(a => a.type === type && a.breed === breed)
      .map(a => a.number);
    
    if (existingNumbers.length === 0) return 1;
    return Math.max(...existingNumbers) + 1;
  }, [animals]);

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

  const addAnimalsBatch = useCallback(async (type: 'chicken' | 'rabbit' | 'goat' | 'duck', breed: string, count: number, dateAdded: string) => {
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
      });
    }
    
    setAnimals(prev => {
      const updated = [...prev, ...newAnimals];
      void storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
      return updated;
    });
    
    return newAnimals;
  }, [getNextAnimalNumber]);

  const updateAnimal = useCallback(async (id: string, updates: Partial<IndividualAnimal>) => {
    const updated = animals.map(a => a.id === id ? { ...a, ...updates } : a);
    setAnimals(updated);
    await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
  }, [animals]);

  const removeAnimal = useCallback(async (id: string) => {
    const updated = animals.filter(a => a.id !== id);
    setAnimals(updated);
    await storage.setItem(STORAGE_KEYS.ANIMALS, JSON.stringify(updated));
  }, [animals]);

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
    animals,
    isLoading,
    addChicken,
    updateChicken,
    deleteChicken,
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
    addAnimal,
    addAnimalsBatch,
    updateAnimal,
    removeAnimal,
    getAliveAnimals,
    getAllAnimals,
    getNextAnimalNumber,
    reloadData: loadData,
  }), [
    chickens,
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
    isLoading,
    addChicken,
    updateChicken,
    deleteChicken,
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
    addChickenHistoryEvent,
    updateChickenHistoryEvent,
    deleteChickenHistoryEvent,
    getChickenCountOnDate,
    getRoostersAndHensCount,
    addAnimal,
    addAnimalsBatch,
    updateAnimal,
    removeAnimal,
    getAliveAnimals,
    getAllAnimals,
    getNextAnimalNumber,
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