export interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  relatedEventId?: string; // Link to ChickenHistoryEvent or other event
}
