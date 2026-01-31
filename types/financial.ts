export interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  relatedEventId?: string; // Link to ChickenHistoryEvent or other event
  groupId?: string; // Link to group for ROI tracking per group
  quantity?: number; // Quantity of eggs (stored as individual eggs, not dozens)
}

export interface ROISnapshot {
  date: string;
  roi: number;
}
