export interface Group {
  id: string;
  name: string;
  type: 'chicken' | 'duck' | 'rabbit';
  dateCreated: string;
  notes?: string;
}

export interface Chicken {
  id: string;
  name: string;
  breed: string;
  dateAcquired: string;
  cost: number;
  quantity: number;
  status: 'active' | 'sold' | 'deceased';
  color?: string;
  notes?: string;
}

export interface BreedEntry {
  breed: string;
  roosters: number;
  hens: number;
  chicks?: number;
  cost?: number;
  notes?: string;
}

export interface ChickenHistoryEvent {
  id: string;
  date: string;
  type: 'acquired' | 'death' | 'sold' | 'consumed';
  quantity: number;
  breed?: string; // Legacy field - kept for backward compatibility
  breeds?: BreedEntry[]; // New multi-breed support
  cost?: number;
  sex?: 'M' | 'F';
  stage?: 'chick' | 'mature'; // Lifecycle stage
  hatchDate?: string; // For chicks
  groupId?: string; // Links to Group for tracking
  notes?: string;
  chickenId?: string;
}

export interface Duck {
  id: string;
  name: string;
  breed: string;
  dateAcquired: string;
  cost: number;
  quantity: number;
  status: 'active' | 'sold' | 'deceased';
  color?: string;
  notes?: string;
}

export interface DuckHistoryEvent {
  id: string;
  date: string;
  type: 'acquired' | 'death' | 'sold' | 'consumed';
  quantity: number;
  breed?: string; // Legacy field - kept for backward compatibility
  breeds?: BreedEntry[]; // New multi-breed support
  cost?: number;
  sex?: 'M' | 'F';
  stage?: 'duckling' | 'mature'; // Lifecycle stage
  hatchDate?: string; // For ducklings
  groupId?: string; // Links to Group for tracking
  notes?: string;
  duckId?: string;
}

export interface Rabbit {
  id: string;
  name: string;
  breed: string;
  gender: 'buck' | 'doe';
  dateOfBirth: string;
  dateAcquired: string;
  cost: number;
  quantity: number;
  status: 'active' | 'sold' | 'deceased' | 'retired';
  color?: string;
  weight?: number;
  tattoo?: string;
  earTag?: string;
  parentBuckId?: string;
  parentDoeId?: string;
  grandparentIds?: {
    maternalGrandSire?: string;
    maternalGrandDam?: string;
    paternalGrandSire?: string;
    paternalGrandDam?: string;
  };
  registrationNumber?: string;
  showQuality?: 'pet' | 'brood' | 'show';
  temperament?: 'calm' | 'active' | 'aggressive' | 'shy';
  feedingNotes?: string;
  lastWeightDate?: string;
  lastHealthCheck?: string;
  vaccinations?: VaccinationRecord[];
  healthIssues?: HealthRecord[];
  notes?: string;
}

export interface VaccinationRecord {
  id: string;
  rabbitId: string;
  vaccine: string;
  date: string;
  nextDue?: string;
  veterinarian?: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  rabbitId: string;
  date: string;
  issue: string;
  treatment?: string;
  veterinarian?: string;
  cost?: number;
  resolved: boolean;
  notes?: string;
}

export interface EggProduction {
  id: string;
  date: string;
  count: number;
  sold?: number;
  laid?: number;
  broken?: number;
  donated?: number;
  breed?: string; // Breed of chickens that laid the eggs
  groupId?: string; // Links to Group for tracking
  timestamp?: string; // ISO timestamp for when record was created
  notes?: string;
}

export interface BreedingAttempt {
  id: string;
  date: string;
  outcome: 'falloff' | 'missed' | 'successful';
  notes?: string;
}

export interface BreedingRecord {
  id: string;
  buckId: string;
  doeId: string;
  breedingDate: string;
  expectedKindlingDate: string;
  actualKindlingDate?: string;
  litterSize?: number;
  aliveAtBirth?: number;
  stillborn?: number;
  weanedCount?: number;
  weaningDate?: string;
  weaningWeight?: number;
  averageKitWeight?: number;
  nestBoxDate?: string;
  eyesOpenDate?: string;
  firstSolidFoodDate?: string;
  sexingDate?: string;
  maleCount?: number;
  femaleCount?: number;
  retainedKits?: string[];
  soldKits?: SoldKit[];
  harvestCount?: number;
  saleCount?: number;
  retainedForBreedingCount?: number;
  attempts?: BreedingAttempt[];
  falloffCount?: number;
  complications?: string;
  doeCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  milkProduction?: 'excellent' | 'good' | 'fair' | 'poor';
  maternalInstinct?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  status: 'bred' | 'confirmed' | 'kindled' | 'weaned' | 'failed' | 'reabsorbed';
}

export interface SoldKit {
  id: string;
  name?: string;
  gender?: 'buck' | 'doe';
  weight?: number;
  color?: string;
  saleDate: string;
  salePrice: number;
  buyerInfo?: string;
  purpose: 'pet' | 'breeding' | 'meat' | 'show';
}

export interface BreedingPlan {
  id: string;
  buckId: string;
  doeId: string;
  plannedDate: string;
  goals: string;
  expectedTraits: string[];
  notes?: string;
  status: 'planned' | 'completed' | 'cancelled';
}

export interface WeightRecord {
  id: string;
  rabbitId: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface FeedRecord {
  id: string;
  date: string;
  feedType: string;
  quantity: number;
  cost: number;
  supplier?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: 'feed' | 'bedding' | 'medical' | 'equipment' | 'other';
  amount: number;
  date: string;
  livestockType: 'chicken' | 'rabbit' | 'duck' | 'general';
  groupId?: string; // Links to Group for tracking
  description: string;
  recurring?: boolean;
}

export interface Income {
  id: string;
  type: 'eggs' | 'meat' | 'livestock' | 'breeding' | 'other';
  amount: number;
  date: string;
  livestockType: 'chicken' | 'rabbit' | 'duck';
  groupId?: string; // Links to Group for tracking
  quantity?: number;
  description: string;
}

export interface IndividualAnimal {
  id: string;
  type: 'chicken' | 'rabbit' | 'goat' | 'duck';
  breed: string;
  name?: string;
  number: number;
  stage?: 'chick' | 'duckling' | 'kit' | 'mature' | 'adult'; // Lifecycle stage
  hatchDate?: string; // Birth/hatch date for immature animals
  dateAdded: string;
  status: 'alive' | 'dead' | 'consumed' | 'sold';
  sex?: 'M' | 'F';
  groupId?: string; // Links to Group for tracking
  notes?: string;
  deathDate?: string;
  deathReason?: string;
  eventId?: string; // Links to the ChickenHistoryEvent that created this animal
}