export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  startingWeightKg: number;
  startDate: string; // '2026-09-09'
  targetEndDate: string; // '2026-12-31'
  targetLossWeeklyPctMin: number; // 0.5%
  targetLossWeeklyPctMax: number; // 1.0%
  daysPerWeekTraining: number; // 6
  currentStreak: number;
  bestStreak: number;
}
