export interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  relatedEventId?: string; // Link to ChickenHistoryEvent or other event
  groupId?: string; // Link to group for ROI tracking per group
  breed?: string; // Breed associated with this record
  animalId?: string; // Specific animal associated with this record
  quantity?: number; // Quantity of eggs (stored as individual eggs, not dozens)
  timestamp?: string; // ISO timestamp for when record was created
}

export interface ROISnapshot {
  date: string;
  roi: number;
}
