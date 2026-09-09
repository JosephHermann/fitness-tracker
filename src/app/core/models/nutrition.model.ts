export interface NutritionSettings {
  targetCalories: number; // 2150
  targetProteinG: number; // 168
  targetFatG: number;     // 60
  targetCarbG: number;    // 235
  isEditable: boolean;
  notes?: string;
}

export interface DailyNutritionLog {
  date: string; // YYYY-MM-DD
  consumedCalories: number;
  consumedProteinG: number;
  consumedFatG: number;
  consumedCarbG: number;
  mealsNotes?: string;
}
