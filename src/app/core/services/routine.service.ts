import { Injectable, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Exercise, ExerciseLog, OverloadSuggestion, WorkoutDay } from '../models/exercise.model';

@Injectable({
  providedIn: 'root',
})
export class RoutineService {
  private readonly storage = inject(StorageService);

  public readonly routineDays = this.storage.routineDays;
  public readonly exerciseLogs = this.storage.exerciseLogs;

  /**
   * Obtiene el número de día de la semana (1 = Lunes, ..., 7 = Domingo)
   */
  public getDayNumberFromDate(date: Date = new Date()): number {
    const day = date.getDay(); // 0 = Domingo, 1 = Lunes... 6 = Sábado
    return day === 0 ? 7 : day;
  }

  /**
   * Obtiene el WorkoutDay programado para una fecha dada
   */
  public getWorkoutDayForDate(date: Date = new Date()): WorkoutDay {
    const dayNum = this.getDayNumberFromDate(date);
    return this.getWorkoutDayByNumber(dayNum);
  }

  public getWorkoutDayByNumber(dayNum: number): WorkoutDay {
    const days = this.routineDays();
    const found = days.find((d) => d.dayNumber === dayNum);
    return found || days[0];
  }

  /**
   * Obtiene el historial ordenado de logs para un ejercicio específico
   */
  public getHistoryForExercise(exerciseId: string): ExerciseLog[] {
    return this.exerciseLogs()
      .filter((l) => l.exerciseId === exerciseId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Calcula la recomendación de sobrecarga progresiva basada en la última sesión registrada
   */
  public getOverloadSuggestion(exercise: Exercise, currentDateStr?: string): OverloadSuggestion | null {
    const logs = this.exerciseLogs()
      .filter((l) => l.exerciseId === exercise.id && (!currentDateStr || l.date < currentDateStr))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (logs.length === 0) {
      return null;
    }

    const lastLog = logs[0];
    const maxWeight = lastLog.maxWeightKg || 0;
    const bestSet = lastLog.sets.reduce(
      (best, cur) => (cur.weightKg > best.weightKg ? cur : best),
      lastLog.sets[0] || { weightKg: maxWeight, reps: 0 }
    );

    const reps = bestSet.reps || 8;
    const weight = bestSet.weightKg || maxWeight;

    // Parse target reps range (e.g., "6-8", "8-10", "12-15")
    const repParts = exercise.targetReps.split('-').map((p) => parseInt(p.trim(), 10));
    const maxTargetReps = repParts.length > 1 ? repParts[1] : repParts[0] || 10;
    const minTargetReps = repParts[0] || 6;

    let suggestedWeight = weight;
    let suggestedReps = `${reps + 1}`;
    let message = '';

    if (reps >= maxTargetReps && weight > 0) {
      // Alcanzó el techo del rango de repeticiones -> subir peso
      const increment = weight >= 60 ? 2.5 : 1.25;
      suggestedWeight = Number((weight + increment).toFixed(2));
      suggestedReps = `${minTargetReps}`;
      message = `¡Completaste el rango! Sube a ${suggestedWeight} kg buscando al menos ${minTargetReps} reps.`;
    } else if (weight > 0) {
      // Aún no alcanza el techo -> buscar más reps con el mismo peso
      suggestedWeight = weight;
      suggestedReps = `${reps + 1}`;
      message = `Mantén ${weight} kg y busca ${reps + 1} reps limpias antes de subir peso.`;
    } else {
      suggestedWeight = 0;
      suggestedReps = exercise.targetReps;
      message = `Registra tus cargas para activar el cálculo automático de sobrecarga.`;
    }

    return {
      lastWeightKg: weight,
      lastReps: reps,
      lastDate: lastLog.date,
      suggestedWeightKg: suggestedWeight,
      suggestedReps,
      message,
    };
  }
}
