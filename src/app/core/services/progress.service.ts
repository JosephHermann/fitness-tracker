import { Injectable, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { RoutineService } from './routine.service';
import { DailyProgressSummary } from '../models/daily-check.model';
import { WeightAnalytics, WeightEntry, WeightRateStatus } from '../models/weight.model';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private readonly storage = inject(StorageService);
  private readonly routine = inject(RoutineService);

  public readonly dailyChecklists = this.storage.dailyChecklists;
  public readonly weightEntries = this.storage.weightEntries;
  public readonly userProfile = this.storage.userProfile;
  public readonly supplements = this.storage.supplements;

  /**
   * Resumen de progreso para una fecha dada (anillo de progreso, tareas completadas)
   */
  public getDailyProgressSummary(dateStr: string): DailyProgressSummary {
    const checklist = this.storage.getOrCreateDailyChecklist(dateStr);
    const dateObj = new Date(dateStr + 'T12:00:00');
    const workoutDay = this.routine.getWorkoutDayForDate(dateObj);

    let totalTasks = 0;
    let completedTasks = 0;

    // 1. Tareas de ejercicios de la rutina de hoy
    const exercises = workoutDay.exercises;
    totalTasks += exercises.length;
    for (const ex of exercises) {
      if (checklist.completedExercises[ex.id]) {
        completedTasks++;
      }
    }

    // 2. Tareas de suplementos
    const suppList = this.supplements();
    totalTasks += suppList.length;
    for (const sup of suppList) {
      if (checklist.supplements[sup.id]) {
        completedTasks++;
      }
    }

    // 3. Tarea de hidratación (meta mínima 8 vasos = 2 litros)
    totalTasks += 1;
    if (checklist.waterGlasses >= 8) {
      completedTasks++;
    }

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isPerfectDay = totalTasks > 0 && completedTasks === totalTasks;

    return {
      date: dateStr,
      totalTasks,
      completedTasks,
      completionPercentage: percentage,
      isPerfectDay,
    };
  }

  /**
   * Cálculo de racha (streak) de días consecutivos cumpliendo al menos 70% o día perfecto
   */
  public readonly currentStreak = computed(() => {
    const checklists = this.dailyChecklists();
    const today = new Date();
    let streak = 0;

    // Evaluamos hacia atrás empezando por ayer o por hoy
    const curDate = new Date(today);
    
    // Si hoy ya tiene progreso >= 70%, cuenta hoy; sino, comenzamos a revisar desde ayer
    const todayStr = this.formatDate(curDate);
    const todaySummary = this.getDailyProgressSummary(todayStr);
    
    if (todaySummary.completionPercentage >= 70) {
      streak++;
      curDate.setDate(curDate.getDate() - 1);
    } else {
      // Si hoy aún está en progreso, evaluamos a partir de ayer para no romper la racha mientras el usuario entrena
      curDate.setDate(curDate.getDate() - 1);
    }

    for (let i = 0; i < 90; i++) {
      const dStr = this.formatDate(curDate);
      const chk = checklists[dStr];
      if (!chk) {
        break;
      }
      const summary = this.getDailyProgressSummary(dStr);
      if (summary.completionPercentage >= 70) {
        streak++;
        curDate.setDate(curDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  });

  /**
   * Analítica avanzada de peso, media móvil semanal y ritmo de recomposición
   */
  public readonly weightAnalytics = computed<WeightAnalytics>(() => {
    const entries = [...this.storage.weightEntries()].sort((a, b) => a.date.localeCompare(b.date));
    const startWeight = this.userProfile().startingWeightKg || 76.2;

    if (entries.length === 0) {
      return {
        currentWeightKg: startWeight,
        startWeightKg: startWeight,
        totalLossKg: 0,
        totalLossPct: 0,
        rolling7DayAvgKg: startWeight,
        previous7DayAvgKg: null,
        weeklyChangeKg: null,
        weeklyChangePct: null,
        status: 'insufficient_data',
        statusTitle: 'Datos Iniciales',
        statusDescription: 'Registra tus pesajes diarios en ayunas para calcular el ritmo de recomposición.',
        statusTone: 'info',
      };
    }

    const latestEntry = entries[entries.length - 1];
    const currentWeight = latestEntry.weightKg;
    const totalLossKg = Number((startWeight - currentWeight).toFixed(2));
    const totalLossPct = Number(((totalLossKg / startWeight) * 100).toFixed(2));

    // Calcular promedio de los últimos 7 días con registro
    const recent7 = entries.slice(-7);
    const rolling7DayAvg = Number(
      (recent7.reduce((acc, curr) => acc + curr.weightKg, 0) / recent7.length).toFixed(2)
    );

    // Calcular promedio de los 7 días anteriores (si hay suficientes registros)
    let previous7DayAvgKg: number | null = null;
    let weeklyChangeKg: number | null = null;
    let weeklyChangePct: number | null = null;

    if (entries.length >= 8) {
      const prev7 = entries.slice(-14, -7);
      if (prev7.length > 0) {
        previous7DayAvgKg = Number(
          (prev7.reduce((acc, curr) => acc + curr.weightKg, 0) / prev7.length).toFixed(2)
        );
        weeklyChangeKg = Number((previous7DayAvgKg - rolling7DayAvg).toFixed(2));
        weeklyChangePct = Number(((weeklyChangeKg / previous7DayAvgKg) * 100).toFixed(2));
      }
    } else if (entries.length >= 2) {
      // Comparativa preliminar contra el peso inicial
      const firstEntry = entries[0];
      const daysDiff = Math.max(
        1,
        Math.round(
          (new Date(latestEntry.date).getTime() - new Date(firstEntry.date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      if (daysDiff >= 3) {
        const estWeeklyChange = ((firstEntry.weightKg - currentWeight) / daysDiff) * 7;
        weeklyChangeKg = Number(estWeeklyChange.toFixed(2));
        weeklyChangePct = Number(((estWeeklyChange / firstEntry.weightKg) * 100).toFixed(2));
      }
    }

    let status: WeightRateStatus = 'insufficient_data';
    let statusTitle = 'Recopilando datos';
    let statusDescription = 'Continúa pesándote a diario al despertar tras ir al baño.';
    let statusTone: 'success' | 'warning' | 'danger' | 'info' = 'info';

    if (weeklyChangePct !== null) {
      if (weeklyChangePct >= 0.5 && weeklyChangePct <= 1.0) {
        status = 'optimal';
        statusTitle = '¡Ritmo Óptimo! 🔥';
        statusDescription = `Estás perdiendo ${weeklyChangePct}% del peso corporal por semana. Rango perfecto para oxidar grasa conservando tu masa muscular.`;
        statusTone = 'success';
      } else if (weeklyChangePct > 0 && weeklyChangePct < 0.5) {
        status = 'slow';
        statusTitle = 'Ritmo Moderado / Lento ⏱️';
        statusDescription = `Ritmo de ${weeklyChangePct}% semanal (< 0.5%). Si el promedio no baja en 2 semanas, reduce 100-150 kcal o añade 15 min de caminata.`;
        statusTone = 'warning';
      } else if (weeklyChangePct > 1.0) {
        status = 'fast';
        statusTitle = 'Pérdida Muy Acelerada ⚠️';
        statusDescription = `Estás perdiendo ${weeklyChangePct}% semanal (> 1.0%). Podrías estar sacrificando masa muscular o glucógeno. Considera subir 100-150 kcal de carbohidratos.`;
        statusTone = 'danger';
      } else {
        status = 'gain';
        statusTitle = 'Peso Estable o Ligero Incremento 📈';
        statusDescription = `El promedio subió levemente (+${Math.abs(weeklyChangePct)}%). Puede deberse a retención hídrica (creatina/sodio) o glucógeno muscular. Evalúa la tendencia a 14 días.`;
        statusTone = 'info';
      }
    }

    return {
      currentWeightKg: currentWeight,
      startWeightKg: startWeight,
      totalLossKg,
      totalLossPct,
      rolling7DayAvgKg: rolling7DayAvg,
      previous7DayAvgKg,
      weeklyChangeKg,
      weeklyChangePct,
      status,
      statusTitle,
      statusDescription,
      statusTone,
    };
  });

  /**
   * Calcula la media móvil semanal para cada punto del historial
   */
  public getWeightHistoryWithAverages(): { date: string; weight: number; rollingAvg: number }[] {
    const entries = [...this.storage.weightEntries()].sort((a, b) => a.date.localeCompare(b.date));
    const result: { date: string; weight: number; rollingAvg: number }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const windowEntries = entries.slice(windowStart, i + 1);
      const avg =
        windowEntries.reduce((sum, e) => sum + e.weightKg, 0) / windowEntries.length;

      result.push({
        date: entries[i].date,
        weight: entries[i].weightKg,
        rollingAvg: Number(avg.toFixed(2)),
      });
    }

    return result;
  }

  /**
   * Estado de la hoja de ruta (Septiembre a Diciembre 2026)
   */
  public readonly roadmapProgress = computed(() => {
    const start = new Date('2026-09-09T00:00:00').getTime();
    const end = new Date('2026-12-31T23:59:59').getTime();
    const now = new Date().getTime();

    const totalDuration = end - start;
    const elapsed = Math.max(0, Math.min(totalDuration, now - start));
    const pct = Math.round((elapsed / totalDuration) * 100);

    const totalDays = Math.round(totalDuration / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.round(elapsed / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const weeksElapsed = Math.floor(daysElapsed / 7) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    return {
      percentage: pct,
      totalDays,
      daysElapsed,
      daysRemaining,
      weeksElapsed,
      totalWeeks,
      isStarted: now >= start,
      isFinished: now >= end,
    };
  });

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
