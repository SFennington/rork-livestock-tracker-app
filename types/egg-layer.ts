// Unified types for all egg-laying animals (chickens, ducks, quail, geese, turkeys, etc.)

export type EggLayerSpecies = 'chicken' | 'duck' | 'quail' | 'goose' | 'turkey';

export interface EggLayerConfig {
  singular: string;
  plural: string;
  juvenile: string;
  juvenilePlural: string;
  maturityWeeks: number;
  eggIcon: string;
  color: string; // Primary theme color
}

export const EGG_LAYER_CONFIGS: Record<EggLayerSpecies, EggLayerConfig> = {
  chicken: {
    singular: 'Chicken',
    plural: 'Chickens',
    juvenile: 'Chick',
    juvenilePlural: 'Chicks',
    maturityWeeks: 20,
    eggIcon: '🥚',
    color: '#f59e0b', // amber
  },
  duck: {
    singular: 'Duck',
    plural: 'Ducks',
    juvenile: 'Duckling',
    juvenilePlural: 'Ducklings',
    maturityWeeks: 26,
    eggIcon: '🥚',
    color: '#3b82f6', // blue
  },
  quail: {
    singular: 'Quail',
    plural: 'Quail',
    juvenile: 'Chick',
    juvenilePlural: 'Chicks',
    maturityWeeks: 8,
    eggIcon: '🥚',
    color: '#8b5cf6', // purple
  },
  goose: {
    singular: 'Goose',
    plural: 'Geese',
    juvenile: 'Gosling',
    juvenilePlural: 'Goslings',
    maturityWeeks: 30,
    eggIcon: '🥚',
    color: '#10b981', // green
  },
  turkey: {
    singular: 'Turkey',
    plural: 'Turkeys',
    juvenile: 'Poult',
    juvenilePlural: 'Poults',
    maturityWeeks: 24,
    eggIcon: '🥚',
    color: '#ef4444', // red
  },
};

// Unified history event for all egg layers
export interface EggLayerHistoryEvent {
  id: string;
  species: EggLayerSpecies;
  date: string;
  type: 'acquired' | 'death' | 'sold' | 'consumed';
  quantity: number;
  breed?: string;
  cost?: number;
  sex?: 'M' | 'F';
  stage?: 'juvenile' | 'mature';
  hatchDate?: string;
  groupId?: string;
  timestamp?: string;
  notes?: string;
}

// For backward compatibility, keep species-specific types that extend the unified type
export interface ChickenHistoryEvent extends Omit<EggLayerHistoryEvent, 'species' | 'stage'> {
  species?: 'chicken'; // Optional for backward compat
  stage?: 'chick' | 'mature'; // Chicken-specific stage names
}

export interface DuckHistoryEvent extends Omit<EggLayerHistoryEvent, 'species' | 'stage'> {
  species?: 'duck'; // Optional for backward compat
  stage?: 'duckling' | 'mature'; // Duck-specific stage names
}
