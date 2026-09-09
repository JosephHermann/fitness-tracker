export type WeightRateStatus = 'optimal' | 'slow' | 'fast' | 'gain' | 'insufficient_data';

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface WeightAnalytics {
  currentWeightKg: number;
  startWeightKg: number;
  totalLossKg: number;
  totalLossPct: number;
  rolling7DayAvgKg: number;
  previous7DayAvgKg: number | null;
  weeklyChangeKg: number | null;
  weeklyChangePct: number | null;
  status: WeightRateStatus;
  statusTitle: string;
  statusDescription: string;
  statusTone: 'success' | 'warning' | 'danger' | 'info';
}
