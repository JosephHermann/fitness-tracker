export interface MeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  waistCm?: number; // Cintura (a nivel de ombligo)
  hipsCm?: number;  // Cadera (zona mayor glútea)
  armCm?: number;   // Brazo contraído
  thighCm?: number; // Muslo medio
  chestCm?: number; // Pecho
  notes?: string;
}
