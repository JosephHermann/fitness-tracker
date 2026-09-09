import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import confetti from 'canvas-confetti';
import { RoutineService } from '../../core/services/routine.service';
import { StorageService } from '../../core/services/storage.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';
import { Exercise, WorkoutDay } from '../../core/models/exercise.model';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="today-page">
      <!-- Top Date & Day Selector Strip -->
      <div class="day-selector-bar gym-card">
        <button type="button" class="btn-icon" (click)="changeSelectedDate(-1)">
          ‹
        </button>
        <div class="date-display">
          <div class="day-badge" [class.badge-lime]="isToday()" [class.badge-gray]="!isToday()">
            {{ isToday() ? 'HOY' : 'SESIÓN SELECCIONADA' }}
          </div>
          <h2 class="current-date-text">{{ formattedDateLabel() }}</h2>
        </div>
        <button type="button" class="btn-icon" (click)="changeSelectedDate(1)">
          ›
        </button>
      </div>

      <!-- Hero Dashboard Card with Progress Ring -->
      <div class="hero-card gym-card" [class.perfect-glow]="dailySummary().isPerfectDay">
        <div class="hero-content">
          <div class="hero-text">
            <span class="workout-type-pill badge-tag" [ngClass]="getWorkoutTagClass(currentWorkout().type)">
              {{ currentWorkout().type }}
            </span>
            <h3 class="workout-title">{{ currentWorkout().title }}</h3>
            <p class="workout-desc">
              {{ currentWorkout().exercises.length }} ejercicios &bull; ~{{ currentWorkout().targetDurationMinutes || 60 }} min
            </p>

            @if (dailySummary().isPerfectDay) {
              <div class="celebration-badge">
                <span>🏆</span>
                <span>¡Día 100% completado! Excelente disciplina.</span>
              </div>
            } @else {
              <div class="tasks-counter">
                <span class="tasks-count mono-num">{{ dailySummary().completedTasks }} / {{ dailySummary().totalTasks }}</span>
                <span class="tasks-label">tareas del día</span>
              </div>
            }
          </div>

          <div class="hero-ring">
            <app-progress-ring
              [percentage]="dailySummary().completionPercentage"
              [size]="110"
              [strokeWidth]="9"
              [startColor]="dailySummary().isPerfectDay ? '#00f59b' : '#00d9ff'"
              [endColor]="dailySummary().isPerfectDay ? '#00e5ff' : '#00f59b'"
              subtitle="Objetivo"
            ></app-progress-ring>
          </div>
        </div>
      </div>

      <!-- Section: Routine Checklist for the Day -->
      <section class="section-block">
        <div class="section-header">
          <div class="header-title-group">
            <span class="section-icon">🏋️</span>
            <h3>Ejercicios de la Sesión</h3>
          </div>
          <span class="badge-tag badge-gray">
            {{ completedExercisesCount() }}/{{ currentWorkout().exercises.length }} hechos
          </span>
        </div>

        <div class="exercise-list">
          @for (exercise of currentWorkout().exercises; track exercise.id) {
            <div
              class="exercise-item gym-card"
              [class.exercise-done]="isExerciseCompleted(exercise.id)"
            >
              <div class="exercise-main">
                <label class="checkbox-container">
                  <input
                    type="checkbox"
                    class="gym-checkbox"
                    [checked]="isExerciseCompleted(exercise.id)"
                    (change)="toggleExerciseCompletion(exercise.id)"
                  />
                </label>

                <div class="exercise-info">
                  <div class="exercise-name-row">
                    <h4 class="exercise-name">{{ exercise.name }}</h4>
                    <span class="muscle-tag">{{ exercise.muscleGroup }}</span>
                  </div>

                  <div class="exercise-target">
                    <span class="target-badge mono-num">{{ exercise.targetSets }} series &times; {{ exercise.targetReps }}</span>
                    @if (exercise.notes) {
                      <span class="target-hint">{{ exercise.notes }}</span>
                    }
                  </div>

                  <!-- Previous Session Weight Hint -->
                  @if (getOverloadHint(exercise); as hint) {
                    <div class="overload-hint">
                      <span class="hint-icon">💡</span>
                      <span class="hint-text">
                        Anterior: <strong class="mono-num">{{ hint.lastWeightKg }} kg &times; {{ hint.lastReps }}</strong>.
                        {{ hint.message }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- Quick Log Row (weight used & reps) -->
              <div class="quick-log-row">
                <div class="log-field">
                  <label>Peso (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="ej. 60"
                    class="gym-input quick-input mono-num"
                    [value]="getLoggedWeight(exercise.id)"
                    (change)="updateExerciseWeight(exercise, $event)"
                  />
                </div>
                <div class="log-field">
                  <label>Reps logradas:</label>
                  <input
                    type="number"
                    placeholder="ej. 8"
                    class="gym-input quick-input mono-num"
                    [value]="getLoggedReps(exercise.id)"
                    (change)="updateExerciseReps(exercise, $event)"
                  />
                </div>
              </div>
            </div>
          } @empty {
            <div class="gym-card empty-state">
              <p>Hoy es día de descanso y recuperación activa. ¡Aprovecha para reponer glucógeno y descansar!</p>
            </div>
          }
        </div>
      </section>

      <!-- Section: Supplements of the Day -->
      <section class="section-block">
        <div class="section-header">
          <div class="header-title-group">
            <span class="section-icon">💊</span>
            <h3>Suplementación Diaria</h3>
          </div>
          <span class="badge-tag badge-cyan">Dosis Clínicas</span>
        </div>

        <div class="supplements-grid">
          @for (sup of supplements(); track sup.id) {
            <div
              class="supplement-card gym-card"
              [class.supplement-taken]="isSupplementTaken(sup.id)"
              (click)="toggleSupplement(sup.id)"
            >
              <div class="sup-check-wrap">
                <input
                  type="checkbox"
                  class="gym-checkbox"
                  [checked]="isSupplementTaken(sup.id)"
                  (click)="$event.stopPropagation()"
                  (change)="toggleSupplement(sup.id)"
                />
              </div>

              <div class="sup-details">
                <div class="sup-title-row">
                  <h4 class="sup-name">{{ sup.name }}</h4>
                  <span class="sup-dose mono-num">{{ sup.dose }}</span>
                </div>
                <p class="sup-timing">⏰ {{ sup.timing }}</p>
                <p class="sup-purpose">{{ sup.purpose }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Section: Water Tracker -->
      <section class="section-block">
        <div class="section-header">
          <div class="header-title-group">
            <span class="section-icon">💧</span>
            <h3>Hidratación</h3>
          </div>
          <span class="badge-tag badge-cyan mono-num">
            {{ currentWaterGlasses() * 250 }} ml / {{ (currentWaterGoalGlasses() * 250) / 1000 }} L
          </span>
        </div>

        <div class="water-card gym-card">
          <div class="water-tracker-row">
            <div class="water-visual">
              <div class="water-icon-circle">
                <span class="water-drop-icon">💧</span>
              </div>
              <div>
                <div class="water-glasses-count">
                  <span class="mono-num glass-num">{{ currentWaterGlasses() }}</span>
                  <span class="glass-total">/ {{ currentWaterGoalGlasses() }} vasos (250 ml)</span>
                </div>
                <p class="water-tip">
                  Crucial para el rendimiento y la absorción de creatina.
                </p>
              </div>
            </div>

            <div class="water-controls">
              <button
                type="button"
                class="btn-icon water-btn"
                (click)="adjustWater(-1)"
                [disabled]="currentWaterGlasses() <= 0"
              >
                −
              </button>
              <button
                type="button"
                class="btn-primary water-btn add-water"
                (click)="adjustWater(1)"
              >
                + 250ml
              </button>
            </div>
          </div>

          <!-- Visual Water Bar -->
          <div class="water-bar-track">
            <div
              class="water-bar-fill"
              [style.width.%]="waterPercentage()"
            ></div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .today-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
    }

    .day-selector-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
    }

    .date-display {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }

    .day-badge {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .current-date-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      text-transform: capitalize;
    }

    .hero-card {
      background: linear-gradient(135deg, #101827 0%, #152238 100%);
      border: 1px solid rgba(0, 245, 155, 0.2);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;

      &.perfect-glow {
        border-color: var(--accent-lime);
        box-shadow: 0 0 25px rgba(0, 245, 155, 0.25);
      }
    }

    .hero-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .hero-text {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }

    .workout-type-pill {
      align-self: flex-start;
      margin-bottom: 0.1rem;
    }

    .workout-title {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
    }

    .workout-desc {
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .celebration-badge {
      margin-top: 0.4rem;
      background: rgba(0, 245, 155, 0.15);
      border: 1px solid rgba(0, 245, 155, 0.4);
      color: var(--accent-lime);
      padding: 0.4rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      animation: pulseNeon 2s infinite ease-in-out;
    }

    .tasks-counter {
      margin-top: 0.35rem;
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }

    .tasks-count {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--accent-lime);
    }

    .tasks-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-block {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.2rem;
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      h3 {
        font-size: 1.05rem;
        font-weight: 700;
      }
    }

    .section-icon {
      font-size: 1.15rem;
    }

    .exercise-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .exercise-item {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;

      &.exercise-done {
        background: rgba(16, 22, 34, 0.6);
        border-color: rgba(0, 245, 155, 0.3);

        .exercise-name {
          color: var(--accent-lime);
        }
      }
    }

    .exercise-main {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .checkbox-container {
      margin-top: 0.15rem;
    }

    .exercise-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .exercise-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .exercise-name {
      font-size: 0.98rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .muscle-tag {
      font-size: 0.7rem;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-full);
    }

    .exercise-target {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .target-badge {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--accent-cyan);
      background: rgba(0, 217, 255, 0.1);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .target-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .overload-hint {
      background: rgba(255, 110, 38, 0.08);
      border-left: 3px solid var(--accent-orange);
      padding: 0.35rem 0.6rem;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .hint-icon {
      font-size: 0.85rem;
    }

    .quick-log-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-top: 0.6rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-left: 2.1rem;
    }

    .log-field {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .quick-input {
      width: 80px;
      padding: 0.35rem 0.5rem;
      font-size: 0.85rem;
      text-align: center;
    }

    .supplements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 0.75rem;
    }

    .supplement-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &.supplement-taken {
        border-color: rgba(0, 217, 255, 0.4);
        background: rgba(0, 217, 255, 0.05);

        .sup-name {
          color: var(--accent-cyan);
        }
      }
    }

    .sup-details {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;
    }

    .sup-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sup-name {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .sup-dose {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent-cyan);
    }

    .sup-timing {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .sup-purpose {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .water-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .water-tracker-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .water-visual {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .water-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      background: rgba(0, 217, 255, 0.12);
      border: 1px solid rgba(0, 217, 255, 0.3);
      display: grid;
      place-content: center;
      font-size: 1.3rem;
    }

    .glass-num {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--accent-cyan);
    }

    .glass-total {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-left: 0.3rem;
    }

    .water-tip {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .water-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .water-btn {
      min-width: 38px;
    }

    .add-water {
      padding: 0.5rem 0.9rem;
      font-size: 0.85rem;
      background: var(--accent-cyan);
      color: #03141a;
      box-shadow: var(--shadow-glow-cyan);
    }

    .water-bar-track {
      height: 8px;
      background: var(--bg-surface);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .water-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #00d9ff, #00f59b);
      border-radius: var(--radius-full);
      transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 0 8px rgba(0, 217, 255, 0.5);
    }

    .empty-state {
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem 1rem;
    }
  `],
})
export class TodayComponent {
  private readonly routine = inject(RoutineService);
  private readonly storage = inject(StorageService);
  private readonly progress = inject(ProgressService);

  public readonly supplements = this.storage.supplements;
  public readonly selectedDate = signal<Date>(new Date());

  public readonly selectedDateStr = computed(() => this.formatDate(this.selectedDate()));

  public readonly isToday = computed(() => {
    const today = this.formatDate(new Date());
    return this.selectedDateStr() === today;
  });

  public readonly formattedDateLabel = computed(() => {
    const d = this.selectedDate();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    };
    return d.toLocaleDateString('es-ES', options);
  });

  public readonly currentWorkout = computed<WorkoutDay>(() => {
    return this.routine.getWorkoutDayForDate(this.selectedDate());
  });

  public readonly currentChecklist = computed(() => {
    return this.storage.getOrCreateDailyChecklist(this.selectedDateStr());
  });

  public readonly dailySummary = computed(() => {
    return this.progress.getDailyProgressSummary(this.selectedDateStr());
  });

  public readonly completedExercisesCount = computed(() => {
    const chk = this.currentChecklist();
    const exList = this.currentWorkout().exercises;
    return exList.filter((e) => chk.completedExercises[e.id]).length;
  });

  public readonly currentWaterGlasses = computed(() => {
    return this.currentChecklist().waterGlasses || 0;
  });

  public readonly currentWaterGoalGlasses = computed(() => {
    return this.currentChecklist().waterGoalGlasses || 12;
  });

  public readonly waterPercentage = computed(() => {
    const current = this.currentWaterGlasses();
    const goal = this.currentWaterGoalGlasses();
    return Math.min(100, Math.round((current / goal) * 100));
  });

  public changeSelectedDate(daysDelta: number): void {
    const cur = new Date(this.selectedDate());
    cur.setDate(cur.getDate() + daysDelta);
    this.selectedDate.set(cur);
  }

  public isExerciseCompleted(exerciseId: string): boolean {
    return !!this.currentChecklist().completedExercises[exerciseId];
  }

  public toggleExerciseCompletion(exerciseId: string): void {
    const dateStr = this.selectedDateStr();
    const current = this.isExerciseCompleted(exerciseId);

    this.storage.updateDailyChecklist(dateStr, (chk) => {
      const next = { ...chk.completedExercises, [exerciseId]: !current };
      return {
        ...chk,
        completedExercises: next,
      };
    });

    this.checkIfDayCompleted();
  }

  public isSupplementTaken(suppId: string): boolean {
    return !!this.currentChecklist().supplements[suppId];
  }

  public toggleSupplement(suppId: string): void {
    const dateStr = this.selectedDateStr();
    const current = this.isSupplementTaken(suppId);

    this.storage.updateDailyChecklist(dateStr, (chk) => {
      return {
        ...chk,
        supplements: {
          ...chk.supplements,
          [suppId]: !current,
        },
      };
    });

    this.checkIfDayCompleted();
  }

  public adjustWater(delta: number): void {
    const dateStr = this.selectedDateStr();
    this.storage.updateDailyChecklist(dateStr, (chk) => {
      const current = chk.waterGlasses || 0;
      const next = Math.max(0, current + delta);
      return {
        ...chk,
        waterGlasses: next,
      };
    });

    this.checkIfDayCompleted();
  }

  public getLoggedWeight(exerciseId: string): number | string {
    const logs = this.storage.exerciseLogs();
    const found = logs.find(
      (l) => l.exerciseId === exerciseId && l.date === this.selectedDateStr()
    );
    return found?.maxWeightKg || '';
  }

  public getLoggedReps(exerciseId: string): number | string {
    const logs = this.storage.exerciseLogs();
    const found = logs.find(
      (l) => l.exerciseId === exerciseId && l.date === this.selectedDateStr()
    );
    return found?.sets[0]?.reps || '';
  }

  public updateExerciseWeight(exercise: Exercise, event: Event): void {
    const input = event.target as HTMLInputElement;
    const weight = parseFloat(input.value) || 0;
    const reps = Number(this.getLoggedReps(exercise.id)) || 8;

    this.saveExerciseLog(exercise, weight, reps);
  }

  public updateExerciseReps(exercise: Exercise, event: Event): void {
    const input = event.target as HTMLInputElement;
    const reps = parseInt(input.value, 10) || 0;
    const weight = Number(this.getLoggedWeight(exercise.id)) || 0;

    this.saveExerciseLog(exercise, weight, reps);
  }

  private saveExerciseLog(exercise: Exercise, weight: number, reps: number): void {
    this.storage.logExercisePerformance({
      date: this.selectedDateStr(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      maxWeightKg: weight,
      totalReps: reps * exercise.targetSets,
      sets: Array.from({ length: exercise.targetSets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: weight,
        reps,
        completed: true,
      })),
    });
  }

  public getOverloadHint(exercise: Exercise) {
    return this.routine.getOverloadSuggestion(exercise, this.selectedDateStr());
  }

  public getWorkoutTagClass(type: string): string {
    switch (type) {
      case 'Push':
        return 'badge-lime';
      case 'Pull':
        return 'badge-cyan';
      case 'Legs':
        return 'badge-orange';
      default:
        return 'badge-purple';
    }
  }

  private checkIfDayCompleted(): void {
    setTimeout(() => {
      const summary = this.dailySummary();
      if (summary.isPerfectDay) {
        this.triggerCelebration();
      }
    }, 100);
  }

  private triggerCelebration(): void {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f59b', '#00d9ff', '#ff6e26', '#ffffff'],
      });
    } catch (err) {
      // Confetti fallback
    }
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
