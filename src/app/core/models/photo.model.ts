export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  tag: string; // e.g. "Semana 1", "Semana 4", etc.
  weightKg?: number;
  dataUrl: string; // Base64 data URL
  notes?: string;
  createdAt: number;
}
