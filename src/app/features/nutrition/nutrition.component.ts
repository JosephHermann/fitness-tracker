import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';
import { DailyNutritionLog, NutritionSettings } from '../../core/models/nutrition.model';

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nutrition-page">
      <!-- Header banner with editing capability -->
      <div class="page-intro gym-card">
        <div class="intro-header">
          <div>
            <span class="badge-tag badge-lime">Plan Nutricional &bull; Recomposición</span>
            <h2 class="page-title">Calorías y Macronutrientes</h2>
            <p class="page-subtitle">
              Objetivo diario para definición con máxima preservación muscular.
            </p>
          </div>
          <button type="button" class="btn-secondary edit-targets-btn" (click)="openEditModal()">
            ⚙️ Ajustar Metas
          </button>
        </div>
      </div>

      <!-- Main Caloric & Macro Target Ring Card -->
      <div class="targets-summary-card gym-card">
        <div class="calorie-hero">
          <div class="calorie-ring-wrap">
            <app-progress-ring
              [percentage]="caloriePercentage()"
              [size]="130"
              [strokeWidth]="10"
              [startColor]="'#00f59b'"
              [endColor]="'#00d9ff'"
              subtitle="Consumidas"
            ></app-progress-ring>
          </div>

          <div class="calorie-stats">
            <div class="target-stat">
              <span class="stat-label">Meta Calórica</span>
              <div class="stat-val-group">
                <span class="stat-num mono-num">{{ settings().targetCalories }}</span>
                <span class="stat-unit">kcal / día</span>
              </div>
            </div>

            <div class="target-stat">
              <span class="stat-label">Registradas Hoy</span>
              <div class="stat-val-group">
                <span class="stat-num mono-num text-lime">{{ currentLog().consumedCalories }}</span>
                <span class="stat-unit">kcal</span>
              </div>
            </div>

            <div class="target-stat">
              <span class="stat-label">Restantes</span>
              <div class="stat-val-group">
                <span class="stat-num mono-num" [class.text-orange]="remainingCalories() < 0">
                  {{ remainingCalories() }}
                </span>
                <span class="stat-unit">kcal</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Macro Breakdown Grid -->
        <div class="macros-grid">
          <!-- Protein -->
          <div class="macro-card protein-card">
            <div class="macro-top">
              <div class="macro-badge badge-tag badge-lime">Proteína</div>
              <span class="macro-energy mono-num">{{ settings().targetProteinG * 4 }} kcal</span>
            </div>
            <div class="macro-values">
              <span class="consumed mono-num">{{ currentLog().consumedProteinG }}</span>
              <span class="target mono-num">/ {{ settings().targetProteinG }} g</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill fill-lime" [style.width.%]="getMacroPct(currentLog().consumedProteinG, settings().targetProteinG)"></div>
            </div>
            <span class="macro-sub">~2.2 g/kg (Preservación muscular)</span>
          </div>

          <!-- Fats -->
          <div class="macro-card fat-card">
            <div class="macro-top">
              <div class="macro-badge badge-tag badge-orange">Grasas</div>
              <span class="macro-energy mono-num">{{ settings().targetFatG * 9 }} kcal</span>
            </div>
            <div class="macro-values">
              <span class="consumed mono-num">{{ currentLog().consumedFatG }}</span>
              <span class="target mono-num">/ {{ settings().targetFatG }} g</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill fill-orange" [style.width.%]="getMacroPct(currentLog().consumedFatG, settings().targetFatG)"></div>
            </div>
            <span class="macro-sub">~0.8 g/kg (Función hormonal)</span>
          </div>

          <!-- Carbs -->
          <div class="macro-card carb-card">
            <div class="macro-top">
              <div class="macro-badge badge-tag badge-cyan">Carbohidratos</div>
              <span class="macro-energy mono-num">{{ settings().targetCarbG * 4 }} kcal</span>
            </div>
            <div class="macro-values">
              <span class="consumed mono-num">{{ currentLog().consumedCarbG }}</span>
              <span class="target mono-num">/ {{ settings().targetCarbG }} g</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill fill-cyan" [style.width.%]="getMacroPct(currentLog().consumedCarbG, settings().targetCarbG)"></div>
            </div>
            <span class="macro-sub">Combustible glucolítico para fuerza</span>
          </div>
        </div>
      </div>

      <!-- Quick Log Today's Intake -->
      <div class="daily-log-card gym-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            <span>📝</span>
            <h3>Registrar Consumo de Hoy ({{ todayStr() }})</h3>
          </div>
        </div>

        <div class="log-form-grid">
          <div class="log-input-group">
            <label>Calorías (kcal)</label>
            <input
              type="number"
              class="gym-input mono-num"
              placeholder="ej. 2100"
              [(ngModel)]="tempCalories"
            />
          </div>
          <div class="log-input-group">
            <label>Proteína (g)</label>
            <input
              type="number"
              class="gym-input mono-num"
              placeholder="ej. 165"
              [(ngModel)]="tempProtein"
            />
          </div>
          <div class="log-input-group">
            <label>Grasas (g)</label>
            <input
              type="number"
              class="gym-input mono-num"
              placeholder="ej. 58"
              [(ngModel)]="tempFat"
            />
          </div>
          <div class="log-input-group">
            <label>Carbohidratos (g)</label>
            <input
              type="number"
              class="gym-input mono-num"
              placeholder="ej. 230"
              [(ngModel)]="tempCarb"
            />
          </div>
        </div>

        <button type="button" class="btn-primary save-nutrition-btn" (click)="saveTodayIntake()">
          Guardar Consumo Diario
        </button>
      </div>

      <!-- Supplementation Guide & Timing -->
      <div class="supplements-guide-card gym-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            <span>💊</span>
            <h3>Protocolo de Suplementación y Horarios</h3>
          </div>
          <span class="badge-tag badge-cyan">Evidencia Científica</span>
        </div>

        <div class="supplements-full-list">
          @for (sup of supplements(); track sup.id) {
            <div class="sup-guide-item">
              <div class="sup-icon-pill">
                @if (sup.id === 'creatine') { ⚡ }
                @else if (sup.id === 'zinc') { 🛡️ }
                @else { 🍊 }
              </div>
              <div class="sup-content">
                <div class="sup-name-line">
                  <h4 class="sup-title">{{ sup.name }}</h4>
                  <span class="sup-badge badge-tag badge-lime mono-num">{{ sup.dose }}</span>
                </div>
                <div class="sup-timing-box">
                  <strong class="timing-title">⏰ Horario recomendado:</strong>
                  <p class="timing-text">{{ sup.timing }}</p>
                </div>
                <p class="sup-desc">{{ sup.purpose }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Recomposition Nutrition Strategy Insights -->
      <div class="strategy-card gym-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            <span>💡</span>
            <h3>Estrategia Nutricional para Recomposición</h3>
          </div>
        </div>

        <ul class="strategy-list">
          <li>
            <strong>Déficit Energético Sostenible:</strong> 2150 kcal crea un déficit controlado (~300-400 kcal) que permite quemar grasa sin inducir letargo ni pérdida de fuerza.
          </li>
          <li>
            <strong>Sincronización de Proteína:</strong> Divide los 168g en 3-4 tomas diarias de 35-45g para maximizar los pulsos de síntesis de proteína muscular (MPS).
          </li>
          <li>
            <strong>Carbohidratos Perientreno:</strong> Concentra el 50-60% de tus carbohidratos en la comida previa (1.5h antes) y posterior al entrenamiento para asegurar glucógeno y fuerza.
          </li>
        </ul>
      </div>

      <!-- Modal to Edit Macro Targets -->
      @if (showEditModal()) {
        <div class="modal-backdrop" (click)="closeEditModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="title-with-icon">
                <span>⚙️</span>
                <h3>Modificar Metas Nutricionales</h3>
              </div>
              <button type="button" class="btn-close" (click)="closeEditModal()">✕</button>
            </div>

            <div class="modal-body">
              <p class="modal-desc">
                Si tu ritmo de peso se estanca o necesitas recalcular calorías durante el proceso, modifica los valores aquí:
              </p>

              <div class="modal-form">
                <div class="form-row">
                  <label>Calorías Totales (kcal):</label>
                  <input
                    type="number"
                    class="gym-input mono-num"
                    [(ngModel)]="editCalories"
                    (ngModelChange)="onCalorieChange()"
                  />
                </div>

                <div class="form-row">
                  <label>Proteína (g):</label>
                  <input
                    type="number"
                    class="gym-input mono-num"
                    [(ngModel)]="editProtein"
                  />
                </div>

                <div class="form-row">
                  <label>Grasas (g):</label>
                  <input
                    type="number"
                    class="gym-input mono-num"
                    [(ngModel)]="editFat"
                  />
                </div>

                <div class="form-row">
                  <label>Carbohidratos (g):</label>
                  <input
                    type="number"
                    class="gym-input mono-num"
                    [(ngModel)]="editCarb"
                  />
                </div>

                <div class="calculated-sum">
                  <span>Suma estimada de macros:</span>
                  <strong class="mono-num">{{ calculatedCaloriesFromMacros() }} kcal</strong>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" (click)="closeEditModal()">Cancelar</button>
                  <button type="button" class="btn-primary" (click)="saveTargets()">Guardar Nuevas Metas</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .nutrition-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
    }

    .page-intro {
      background: linear-gradient(135deg, #101827 0%, #152033 100%);
      border-color: rgba(0, 245, 155, 0.2);
    }

    .intro-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
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
    }

    .edit-targets-btn {
      padding: 0.45rem 0.85rem;
      font-size: 0.82rem;
    }

    .targets-summary-card {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .calorie-hero {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 1.5rem;
      flex-wrap: wrap;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .calorie-stats {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .target-stat {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-val-group {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }

    .stat-num {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
    }

    .text-lime { color: var(--accent-lime); }
    .text-orange { color: var(--accent-orange); }

    .stat-unit {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .macros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .macro-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .macro-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .macro-energy {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .macro-values {
      display: flex;
      align-items: baseline;
      gap: 0.3rem;
      .consumed {
        font-size: 1.45rem;
        font-weight: 800;
        color: var(--text-main);
      }
      .target {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    }

    .progress-bar-track {
      height: 6px;
      background: var(--bg-input);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.4s ease;
    }

    .fill-lime { background: var(--accent-lime); }
    .fill-orange { background: var(--accent-orange); }
    .fill-cyan { background: var(--accent-cyan); }

    .macro-sub {
      font-size: 0.72rem;
      color: var(--text-secondary);
      margin-top: 0.15rem;
    }

    .daily-log-card, .supplements-guide-card, .strategy-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.65rem;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      h3 { font-size: 1.05rem; }
    }

    .log-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
    }

    .log-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .save-nutrition-btn {
      align-self: flex-end;
      padding: 0.55rem 1.25rem;
      font-size: 0.88rem;
    }

    .supplements-full-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .sup-guide-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      gap: 0.85rem;
      align-items: flex-start;
    }

    .sup-icon-pill {
      font-size: 1.3rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-sm);
      width: 42px;
      height: 42px;
      display: grid;
      place-content: center;
      flex-shrink: 0;
    }

    .sup-content {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
    }

    .sup-name-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .sup-title {
      font-size: 1rem;
      font-weight: 700;
    }

    .sup-timing-box {
      background: rgba(0, 217, 255, 0.06);
      border-radius: 6px;
      padding: 0.35rem 0.6rem;
      font-size: 0.78rem;
      color: var(--text-secondary);
      line-height: 1.35;
      margin: 0.2rem 0;
    }

    .timing-title {
      color: var(--accent-cyan);
      margin-right: 0.3rem;
    }

    .sup-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.35;
    }

    .strategy-list {
      list-style-type: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      li {
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.45;
        padding-left: 1rem;
        position: relative;

        &::before {
          content: '▸';
          position: absolute;
          left: 0;
          color: var(--accent-lime);
        }

        strong {
          color: var(--text-main);
        }
      }
    }

    /* Modal */
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
      max-width: 460px;
      box-shadow: var(--shadow-card);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
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
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .modal-desc {
      font-size: 0.82rem;
      color: var(--text-secondary);
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }
    .calculated-sum {
      font-size: 0.82rem;
      color: var(--text-secondary);
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `],
})
export class NutritionComponent {
  private readonly storage = inject(StorageService);

  public readonly settings = this.storage.nutritionSettings;
  public readonly supplements = this.storage.supplements;
  public readonly nutritionLogs = this.storage.nutritionLogs;

  public readonly showEditModal = signal<boolean>(false);

  // Form edit targets
  public editCalories = 2150;
  public editProtein = 168;
  public editFat = 60;
  public editCarb = 235;

  // Daily log form inputs
  public tempCalories: number | null = null;
  public tempProtein: number | null = null;
  public tempFat: number | null = null;
  public tempCarb: number | null = null;

  public readonly todayStr = computed(() => {
    return new Date().toISOString().substring(0, 10);
  });

  public readonly currentLog = computed<DailyNutritionLog>(() => {
    const logs = this.nutritionLogs();
    const today = this.todayStr();
    return (
      logs[today] || {
        date: today,
        consumedCalories: 0,
        consumedProteinG: 0,
        consumedFatG: 0,
        consumedCarbG: 0,
      }
    );
  });

  public readonly caloriePercentage = computed(() => {
    const target = this.settings().targetCalories;
    const consumed = this.currentLog().consumedCalories;
    if (!target) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  });

  public readonly remainingCalories = computed(() => {
    return this.settings().targetCalories - this.currentLog().consumedCalories;
  });

  public getMacroPct(consumed: number, target: number): number {
    if (!target) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  }

  public openEditModal(): void {
    const s = this.settings();
    this.editCalories = s.targetCalories;
    this.editProtein = s.targetProteinG;
    this.editFat = s.targetFatG;
    this.editCarb = s.targetCarbG;
    this.showEditModal.set(true);
  }

  public closeEditModal(): void {
    this.showEditModal.set(false);
  }

  public onCalorieChange(): void {
    // If calories adjusted, keep protein at 168g and fat around 60g, adjust carbs
    const pKcal = this.editProtein * 4;
    const fKcal = this.editFat * 9;
    const remKcal = Math.max(0, this.editCalories - pKcal - fKcal);
    this.editCarb = Math.round(remKcal / 4);
  }

  public calculatedCaloriesFromMacros(): number {
    return this.editProtein * 4 + this.editFat * 9 + this.editCarb * 4;
  }

  public saveTargets(): void {
    this.storage.updateNutritionSettings({
      targetCalories: this.editCalories,
      targetProteinG: this.editProtein,
      targetFatG: this.editFat,
      targetCarbG: this.editCarb,
      isEditable: true,
      notes: 'Actualizado por el usuario',
    });
    this.closeEditModal();
  }

  public saveTodayIntake(): void {
    const existing = this.currentLog();
    const newLog: DailyNutritionLog = {
      date: this.todayStr(),
      consumedCalories: this.tempCalories !== null ? this.tempCalories : existing.consumedCalories,
      consumedProteinG: this.tempProtein !== null ? this.tempProtein : existing.consumedProteinG,
      consumedFatG: this.tempFat !== null ? this.tempFat : existing.consumedFatG,
      consumedCarbG: this.tempCarb !== null ? this.tempCarb : existing.consumedCarbG,
    };

    this.storage.logDailyNutrition(newLog);
    alert('¡Consumo nutricional de hoy guardado correctamente!');
  }
}
