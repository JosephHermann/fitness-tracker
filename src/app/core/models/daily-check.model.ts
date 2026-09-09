export interface SupplementConfig {
  id: string;
  name: string;
  dose: string;
  timing: string;
  purpose: string;
}

export interface DailyChecklist {
  date: string; // YYYY-MM-DD
  completedExercises: Record<string, boolean>; // exerciseId -> boolean
  supplements: Record<string, boolean>; // supplementId -> boolean
  waterGlasses: number; // 1 glass = 250 ml
  waterGoalGlasses: number; // default 12 (3.0L)
  workoutCompleted: boolean;
  notes?: string;
}

export interface DailyProgressSummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  isPerfectDay: boolean;
}
