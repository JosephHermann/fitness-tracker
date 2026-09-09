import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoutineService } from '../../core/services/routine.service';
import { StorageService } from '../../core/services/storage.service';
import { Exercise, ExerciseLog, WorkoutDay } from '../../core/models/exercise.model';

@Component({
  selector: 'app-routine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="routine-page">
      <!-- Header banner -->
      <div class="page-intro gym-card">
        <div class="intro-content">
          <div>
            <span class="badge-tag badge-lime">Split PPL x 2 &bull; 6 Días</span>
            <h2 class="page-title">Rutina Semanal de Hipertrofia</h2>
            <p class="page-subtitle">
              Sobrecarga progresiva semana a semana: añade 1 repetición o microcarga de peso cuando alcances el techo del rango.
            </p>
          </div>
        </div>
      </div>

      <!-- Days Tab Carousel -->
      <div class="days-nav-scroll">
        @for (day of routineDays(); track day.dayNumber) {
          <button
            type="button"
            class="day-tab-btn"
            [class.active-day]="activeDayNumber() === day.dayNumber"
            (click)="activeDayNumber.set(day.dayNumber)"
          >
            <span class="day-tab-name">{{ day.dayName.substring(0, 3) }}</span>
            <span class="day-tab-type badge-tag" [ngClass]="getWorkoutTagClass(day.type)">
              {{ day.type.split('/')[0] }}
            </span>
          </button>
        }
      </div>

      <!-- Active Day Details Card -->
      <div class="day-detail-card gym-card">
        <div class="day-card-header">
          <div>
            <div class="day-meta-row">
              <span class="badge-tag" [ngClass]="getWorkoutTagClass(activeDay().type)">
                Día {{ activeDay().dayNumber }}: {{ activeDay().type }}
              </span>
              <span class="time-meta">⏱️ ~{{ activeDay().targetDurationMinutes || 60 }} min</span>
            </div>
            <h3 class="active-day-title">{{ activeDay().title }}</h3>
          </div>
        </div>

        <!-- Exercises List -->
        <div class="exercises-container">
          @for (exercise of activeDay().exercises; track exercise.id) {
            <div class="exercise-card">
              <div class="exercise-card-header">
                <div class="exercise-title-box">
                  <h4 class="ex-name">{{ exercise.name }}</h4>
                  <div class="ex-tags">
                    <span class="ex-target-pill mono-num">{{ exercise.targetSets }} &times; {{ exercise.targetReps }}</span>
                    <span class="ex-muscle-pill">{{ exercise.muscleGroup }}</span>
                  </div>
                </div>

                <!-- History Button -->
                <button
                  type="button"
                  class="btn-icon history-btn"
                  title="Ver historial de cargas"
                  (click)="openExerciseHistory(exercise)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </button>
              </div>

              @if (exercise.notes) {
                <p class="ex-instruction">{{ exercise.notes }}</p>
              }

              <!-- Overload Insight Box -->
              <div class="overload-box">
                @if (getOverloadSuggestion(exercise); as sug) {
                  <div class="overload-header">
                    <span class="overload-icon">⚡</span>
                    <span class="overload-title">Sobrecarga Progresiva</span>
                  </div>
                  <div class="overload-content">
                    <div class="last-session">
                      <span class="label">Última sesión:</span>
                      <strong class="mono-num val">{{ sug.lastWeightKg }} kg &times; {{ sug.lastReps }} reps</strong>
                      <span class="date">({{ sug.lastDate }})</span>
                    </div>
                    <div class="next-target">
                      <span class="label">Objetivo hoy:</span>
                      <strong class="target-val mono-num">
                        @if (sug.suggestedWeightKg > sug.lastWeightKg) {
                          {{ sug.suggestedWeightKg }} kg (&plus;{{ Number((sug.suggestedWeightKg - sug.lastWeightKg).toFixed(2)) }} kg)
                        } @else {
                          {{ sug.lastWeightKg }} kg &times; {{ sug.suggestedReps }} reps
                        }
                      </strong>
                    </div>
                  </div>
                  <p class="overload-msg">{{ sug.message }}</p>
                } @else {
                  <div class="overload-empty">
                    <span>💡 Aún no has registrado cargas previas para este ejercicio. Al registrar tu primera sesión, la app calculará tus objetivos de peso automáticamente.</span>
                  </div>
                }
              </div>

              <!-- Quick Log Form -->
              <div class="log-strip">
                <div class="input-cell">
                  <label>Último Peso:</label>
                  <div class="input-with-unit">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0"
                      class="gym-input log-in mono-num"
                      [value]="getLoggedWeight(exercise.id)"
                      (change)="onWeightChange(exercise, $event)"
                    />
                    <span class="unit">kg</span>
                  </div>
                </div>

                <div class="input-cell">
                  <label>Reps logradas:</label>
                  <div class="input-with-unit">
                    <input
                      type="number"
                      placeholder="8"
                      class="gym-input log-in mono-num"
                      [value]="getLoggedReps(exercise.id)"
                      (change)="onRepsChange(exercise, $event)"
                    />
                    <span class="unit">reps</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-secondary save-btn"
                  (click)="manualSaveLog(exercise)"
                >
                  Guardar
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-routine">
              <p>Día de descanso programado. Descanso muscular y recarga de reservas.</p>
            </div>
          }
        </div>
      </div>

      <!-- Exercise History Modal -->
      @if (selectedExerciseForHistory()) {
        <div class="modal-backdrop" (click)="closeHistory()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="badge-tag badge-cyan">Historial de Sobrecarga</span>
                <h3>{{ selectedExerciseForHistory()?.name }}</h3>
              </div>
              <button type="button" class="btn-close" (click)="closeHistory()">✕</button>
            </div>

            <div class="modal-body">
              @if (historyLogs().length > 0) {
                <div class="history-table">
                  <div class="history-row history-th">
                    <span>Fecha</span>
                    <span>Carga Máx</span>
                    <span>Reps</span>
                    <span>Progreso</span>
                  </div>
                  @for (log of historyLogs(); track log.id; let idx = $index) {
                    <div class="history-row">
                      <span class="mono-num date-col">{{ log.date }}</span>
                      <strong class="mono-num weight-col">{{ log.maxWeightKg }} kg</strong>
                      <span class="mono-num reps-col">{{ log.sets[0]?.reps || '-' }} reps</span>
                      <span class="prog-col">
                        @if (idx < historyLogs().length - 1) {
                          @let prevLog = historyLogs()[idx + 1];
                          @let diff = log.maxWeightKg - prevLog.maxWeightKg;
                          @if (diff > 0) {
                            <span class="badge-tag badge-lime mono-num">+{{ diff }} kg</span>
                          } @else if (diff < 0) {
                            <span class="badge-tag badge-orange mono-num">{{ diff }} kg</span>
                          } @else {
                            <span class="badge-tag badge-gray mono-num">=</span>
                          }
                        } @else {
                          <span class="badge-tag badge-gray">Base</span>
                        }
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-history">
                  <p>No hay registros históricos de este ejercicio aún.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .routine-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
    }

    .page-intro {
      background: linear-gradient(135deg, #101827 0%, #172439 100%);
      border-color: rgba(0, 245, 155, 0.2);
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0.35rem 0 0.2rem;
    }

    .page-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .days-nav-scroll {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.4rem;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .day-tab-btn {
      flex: 1;
      min-width: 68px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.4rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }

      &.active-day {
        background: var(--bg-surface);
        border-color: var(--accent-lime);
        box-shadow: 0 0 12px rgba(0, 245, 155, 0.25);
        color: var(--text-main);

        .day-tab-name {
          color: var(--accent-lime);
          font-weight: 800;
        }
      }
    }

    .day-tab-name {
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .day-tab-type {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
    }

    .day-detail-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .day-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.85rem;
    }

    .day-meta-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.3rem;
    }

    .time-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .active-day-title {
      font-size: 1.25rem;
      font-weight: 800;
    }

    .exercises-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .exercise-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .exercise-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .ex-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .ex-tags {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .ex-target-pill {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent-cyan);
      background: rgba(0, 217, 255, 0.1);
      border: 1px solid rgba(0, 217, 255, 0.3);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .ex-muscle-pill {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .history-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
    }

    .ex-instruction {
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    .overload-box {
      background: rgba(11, 15, 23, 0.7);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--accent-orange);
      padding: 0.65rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .overload-header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .overload-icon {
      font-size: 0.85rem;
    }

    .overload-title {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-orange);
    }

    .overload-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.82rem;
    }

    .last-session .label,
    .next-target .label {
      color: var(--text-muted);
      margin-right: 0.25rem;
    }

    .last-session .val {
      color: var(--text-main);
    }

    .last-session .date {
      color: var(--text-muted);
      font-size: 0.72rem;
      margin-left: 0.25rem;
    }

    .next-target .target-val {
      color: var(--accent-lime);
    }

    .overload-msg {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.15rem;
    }

    .overload-empty {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.35;
    }

    .log-strip {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      background: var(--bg-card);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      flex-wrap: wrap;
    }

    .input-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      label {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
    }

    .input-with-unit {
      display: flex;
      align-items: center;
      position: relative;
    }

    .log-in {
      width: 84px;
      padding-right: 2rem;
      font-size: 0.88rem;
    }

    .unit {
      position: absolute;
      right: 0.5rem;
      font-size: 0.72rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .save-btn {
      padding: 0.55rem 0.9rem;
      font-size: 0.8rem;
    }

    .empty-routine {
      text-align: center;
      color: var(--text-secondary);
      padding: 2.5rem 1rem;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-card);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      h3 { font-size: 1.1rem; margin-top: 0.2rem; }
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
    }
    .modal-body {
      padding: 1.25rem;
    }
    .history-table {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .history-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      font-size: 0.85rem;
    }
    .history-th {
      background: transparent;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
      padding-bottom: 0.25rem;
    }
    .date-col { font-size: 0.78rem; color: var(--text-secondary); }
    .weight-col { color: var(--accent-lime); }
    .reps-col { color: var(--text-main); }
    .empty-history { text-align: center; color: var(--text-muted); padding: 1.5rem; }
  `],
})
export class RoutineComponent {
  private readonly routine = inject(RoutineService);
  private readonly storage = inject(StorageService);

  public readonly Number = Number;
  public readonly routineDays = this.routine.routineDays;
  public readonly activeDayNumber = signal<number>(this.routine.getDayNumberFromDate());

  public readonly selectedExerciseForHistory = signal<Exercise | null>(null);

  public readonly activeDay = computed<WorkoutDay>(() => {
    return this.routine.getWorkoutDayByNumber(this.activeDayNumber());
  });

  public readonly historyLogs = computed<ExerciseLog[]>(() => {
    const ex = this.selectedExerciseForHistory();
    if (!ex) return [];
    return this.routine.getHistoryForExercise(ex.id);
  });

  public getOverloadSuggestion(exercise: Exercise) {
    return this.routine.getOverloadSuggestion(exercise);
  }

  public getWorkoutTagClass(type: string): string {
    if (type.includes('Push')) return 'badge-lime';
    if (type.includes('Pull')) return 'badge-cyan';
    if (type.includes('Legs')) return 'badge-orange';
    return 'badge-purple';
  }

  public getLoggedWeight(exerciseId: string): number | string {
    const history = this.routine.getHistoryForExercise(exerciseId);
    return history[0]?.maxWeightKg || '';
  }

  public getLoggedReps(exerciseId: string): number | string {
    const history = this.routine.getHistoryForExercise(exerciseId);
    return history[0]?.sets[0]?.reps || '';
  }

  public onWeightChange(exercise: Exercise, event: Event): void {
    const input = event.target as HTMLInputElement;
    const weight = parseFloat(input.value) || 0;
    const reps = Number(this.getLoggedReps(exercise.id)) || 8;
    this.saveLog(exercise, weight, reps);
  }

  public onRepsChange(exercise: Exercise, event: Event): void {
    const input = event.target as HTMLInputElement;
    const reps = parseInt(input.value, 10) || 0;
    const weight = Number(this.getLoggedWeight(exercise.id)) || 0;
    this.saveLog(exercise, weight, reps);
  }

  public manualSaveLog(exercise: Exercise): void {
    const weight = Number(this.getLoggedWeight(exercise.id)) || 0;
    const reps = Number(this.getLoggedReps(exercise.id)) || 8;
    this.saveLog(exercise, weight, reps);
    alert(`Guardado: ${exercise.name} - ${weight} kg x ${reps} reps`);
  }

  private saveLog(exercise: Exercise, weight: number, reps: number): void {
    const today = new Date().toISOString().substring(0, 10);
    this.storage.logExercisePerformance({
      date: today,
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

  public openExerciseHistory(exercise: Exercise): void {
    this.selectedExerciseForHistory.set(exercise);
  }

  public closeHistory(): void {
    this.selectedExerciseForHistory.set(null);
  }
}
