export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
export type RoutineType = 'Push' | 'Pull' | 'Legs' | 'Descanso/cardio suave';

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  muscleGroup: string;
  notes?: string;
}

export interface WorkoutDay {
  dayNumber: number; // 1 = Lunes, 7 = Domingo
  dayName: DayOfWeek;
  type: RoutineType;
  title: string;
  exercises: Exercise[];
  targetDurationMinutes?: number;
  notes?: string;
}

export interface ExerciseSetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  id: string;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSetLog[];
  maxWeightKg: number;
  totalReps: number;
  notes?: string;
}

export interface OverloadSuggestion {
  lastWeightKg: number;
  lastReps: number;
  lastDate: string;
  suggestedWeightKg: number;
  suggestedReps: string;
  message: string;
}
