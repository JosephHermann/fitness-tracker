import { Injectable, effect, signal } from '@angular/core';
import {
  DEFAULT_NUTRITION_SETTINGS,
  DEFAULT_SUPPLEMENTS,
  DEFAULT_USER_PROFILE,
  DEFAULT_WORKOUT_ROUTINE,
  INITIAL_MEASUREMENTS,
  INITIAL_WEIGHT_LOGS,
} from '../constants/default-data';
import { DailyChecklist, SupplementConfig } from '../models/daily-check.model';
import { ExerciseLog, WorkoutDay } from '../models/exercise.model';
import { MeasurementEntry } from '../models/measurement.model';
import { DailyNutritionLog, NutritionSettings } from '../models/nutrition.model';
import { UserProfile } from '../models/user-profile.model';
import { WeightEntry } from '../models/weight.model';

const STORAGE_KEYS = {
  USER_PROFILE: 'fitness_tracker_user_profile_v1',
  ROUTINE_DAYS: 'fitness_tracker_routine_days_v1',
  EXERCISE_LOGS: 'fitness_tracker_exercise_logs_v1',
  DAILY_CHECKLISTS: 'fitness_tracker_daily_checklists_v1',
  WEIGHT_ENTRIES: 'fitness_tracker_weight_entries_v1',
  MEASUREMENTS: 'fitness_tracker_measurements_v1',
  NUTRITION_SETTINGS: 'fitness_tracker_nutrition_settings_v1',
  NUTRITION_LOGS: 'fitness_tracker_nutrition_logs_v1',
  SUPPLEMENTS: 'fitness_tracker_supplements_v1',
};

export interface BackupData {
  version: string;
  exportedAt: string;
  userProfile: UserProfile;
  routineDays: WorkoutDay[];
  exerciseLogs: ExerciseLog[];
  dailyChecklists: Record<string, DailyChecklist>;
  weightEntries: WeightEntry[];
  measurementEntries: MeasurementEntry[];
  nutritionSettings: NutritionSettings;
  nutritionLogs: Record<string, DailyNutritionLog>;
  supplements: SupplementConfig[];
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Signals for each state domain
  public readonly userProfile = signal<UserProfile>(this.loadFromLocal(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE));
  public readonly routineDays = signal<WorkoutDay[]>(this.loadFromLocal(STORAGE_KEYS.ROUTINE_DAYS, DEFAULT_WORKOUT_ROUTINE));
  public readonly exerciseLogs = signal<ExerciseLog[]>(this.loadFromLocal(STORAGE_KEYS.EXERCISE_LOGS, []));
  public readonly dailyChecklists = signal<Record<string, DailyChecklist>>(
    this.loadFromLocal(STORAGE_KEYS.DAILY_CHECKLISTS, {})
  );
  public readonly weightEntries = signal<WeightEntry[]>(
    this.loadFromLocal(STORAGE_KEYS.WEIGHT_ENTRIES, INITIAL_WEIGHT_LOGS)
  );
  public readonly measurementEntries = signal<MeasurementEntry[]>(
    this.loadFromLocal(STORAGE_KEYS.MEASUREMENTS, INITIAL_MEASUREMENTS)
  );
  public readonly nutritionSettings = signal<NutritionSettings>(
    this.loadFromLocal(STORAGE_KEYS.NUTRITION_SETTINGS, DEFAULT_NUTRITION_SETTINGS)
  );
  public readonly nutritionLogs = signal<Record<string, DailyNutritionLog>>(
    this.loadFromLocal(STORAGE_KEYS.NUTRITION_LOGS, {})
  );
  public readonly supplements = signal<SupplementConfig[]>(
    this.loadFromLocal(STORAGE_KEYS.SUPPLEMENTS, DEFAULT_SUPPLEMENTS)
  );

  constructor() {
    // Effects that automatically synchronize signals to localStorage whenever they change
    effect(() => {
      this.saveToLocal(STORAGE_KEYS.USER_PROFILE, this.userProfile());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.ROUTINE_DAYS, this.routineDays());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.EXERCISE_LOGS, this.exerciseLogs());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.DAILY_CHECKLISTS, this.dailyChecklists());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.WEIGHT_ENTRIES, this.weightEntries());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.MEASUREMENTS, this.measurementEntries());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.NUTRITION_SETTINGS, this.nutritionSettings());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.NUTRITION_LOGS, this.nutritionLogs());
    });

    effect(() => {
      this.saveToLocal(STORAGE_KEYS.SUPPLEMENTS, this.supplements());
    });
  }

  // --- Helpers for localStorage ---
  private loadFromLocal<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`Error al leer clave ${key} de localStorage:`, err);
      return defaultValue;
    }
  }

  private saveToLocal<T>(key: string, value: T): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error guardando clave ${key} en localStorage:`, err);
    }
  }

  // --- Checklist Methods ---
  public getOrCreateDailyChecklist(dateStr: string): DailyChecklist {
    const currentMap = this.dailyChecklists();
    if (currentMap[dateStr]) {
      return currentMap[dateStr];
    }

    const newChecklist: DailyChecklist = {
      date: dateStr,
      completedExercises: {},
      supplements: {},
      waterGlasses: 0,
      waterGoalGlasses: 12,
      workoutCompleted: false,
    };

    this.dailyChecklists.update((prev) => ({
      ...prev,
      [dateStr]: newChecklist,
    }));

    return newChecklist;
  }

  public updateDailyChecklist(dateStr: string, updater: (prev: DailyChecklist) => DailyChecklist): void {
    const existing = this.getOrCreateDailyChecklist(dateStr);
    const updated = updater({ ...existing });
    this.dailyChecklists.update((prev) => ({
      ...prev,
      [dateStr]: updated,
    }));
  }

  // --- Exercise Logging & Overload ---
  public logExercisePerformance(log: Omit<ExerciseLog, 'id'>): void {
    const newLog: ExerciseLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };

    this.exerciseLogs.update((logs) => {
      // replace if same exercise and same date exists, or append
      const existingIdx = logs.findIndex((l) => l.exerciseId === log.exerciseId && l.date === log.date);
      if (existingIdx >= 0) {
        const copy = [...logs];
        copy[existingIdx] = newLog;
        return copy;
      }
      return [newLog, ...logs];
    });
  }

  // --- Weight Entries ---
  public addWeightEntry(date: string, weightKg: number, note?: string): void {
    this.weightEntries.update((entries) => {
      const existingIndex = entries.findIndex((e) => e.date === date);
      const newEntry: WeightEntry = {
        id: 'w_' + Date.now(),
        date,
        weightKg,
        note,
      };

      if (existingIndex >= 0) {
        const copy = [...entries];
        copy[existingIndex] = newEntry;
        return copy.sort((a, b) => a.date.localeCompare(b.date));
      }

      return [...entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  public deleteWeightEntry(id: string): void {
    this.weightEntries.update((entries) => entries.filter((e) => e.id !== id));
  }

  // --- Measurements ---
  public addMeasurement(entry: Omit<MeasurementEntry, 'id'>): void {
    this.measurementEntries.update((entries) => {
      const newEntry: MeasurementEntry = {
        ...entry,
        id: 'meas_' + Date.now(),
      };
      const existingIdx = entries.findIndex((m) => m.date === entry.date);
      if (existingIdx >= 0) {
        const copy = [...entries];
        copy[existingIdx] = newEntry;
        return copy.sort((a, b) => a.date.localeCompare(b.date));
      }
      return [...entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  public deleteMeasurement(id: string): void {
    this.measurementEntries.update((entries) => entries.filter((e) => e.id !== id));
  }

  // --- Nutrition Settings & Logs ---
  public updateNutritionSettings(settings: NutritionSettings): void {
    this.nutritionSettings.set(settings);
  }

  public logDailyNutrition(log: DailyNutritionLog): void {
    this.nutritionLogs.update((prev) => ({
      ...prev,
      [log.date]: log,
    }));
  }

  // --- Backup & Restore ---
  public exportDataAsJson(): string {
    const backup: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userProfile: this.userProfile(),
      routineDays: this.routineDays(),
      exerciseLogs: this.exerciseLogs(),
      dailyChecklists: this.dailyChecklists(),
      weightEntries: this.weightEntries(),
      measurementEntries: this.measurementEntries(),
      nutritionSettings: this.nutritionSettings(),
      nutritionLogs: this.nutritionLogs(),
      supplements: this.supplements(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importDataFromJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr) as Partial<BackupData>;
      if (!data) return false;

      if (data.userProfile) this.userProfile.set(data.userProfile);
      if (data.routineDays) this.routineDays.set(data.routineDays);
      if (data.exerciseLogs) this.exerciseLogs.set(data.exerciseLogs);
      if (data.dailyChecklists) this.dailyChecklists.set(data.dailyChecklists);
      if (data.weightEntries) this.weightEntries.set(data.weightEntries);
      if (data.measurementEntries) this.measurementEntries.set(data.measurementEntries);
      if (data.nutritionSettings) this.nutritionSettings.set(data.nutritionSettings);
      if (data.nutritionLogs) this.nutritionLogs.set(data.nutritionLogs);
      if (data.supplements) this.supplements.set(data.supplements);

      return true;
    } catch (err) {
      console.error('Error al importar JSON:', err);
      return false;
    }
  }

  public resetAllToDefaults(): void {
    this.userProfile.set(DEFAULT_USER_PROFILE);
    this.routineDays.set(DEFAULT_WORKOUT_ROUTINE);
    this.exerciseLogs.set([]);
    this.dailyChecklists.set({});
    this.weightEntries.set(INITIAL_WEIGHT_LOGS);
    this.measurementEntries.set(INITIAL_MEASUREMENTS);
    this.nutritionSettings.set(DEFAULT_NUTRITION_SETTINGS);
    this.nutritionLogs.set({});
    this.supplements.set(DEFAULT_SUPPLEMENTS);
  }
}
