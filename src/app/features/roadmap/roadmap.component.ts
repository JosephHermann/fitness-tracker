import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../core/services/progress.service';
import { StorageService } from '../../core/services/storage.service';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface PhaseInfo {
  number: number;
  name: string;
  period: string;
  focus: string;
  description: string;
  keyTargets: string[];
  status: 'current' | 'upcoming' | 'completed';
}

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="roadmap-page">
      <!-- Top Banner -->
      <div class="page-intro gym-card">
        <div class="intro-content">
          <div>
            <span class="badge-tag badge-cyan">Plan 9 Sep &rarr; 31 Dic 2026</span>
            <h2 class="page-title">Hoja de Ruta de Recomposición</h2>
            <p class="page-subtitle">
              Plan estratégico de 16 semanas para bajar grasa corporal manteniendo el 100% de tu masa muscular.
            </p>
          </div>
        </div>
      </div>

      <!-- Timeline Progress Overview Card -->
      <div class="progress-hero-card gym-card">
        <div class="hero-flex">
          <div class="hero-ring">
            <app-progress-ring
              [percentage]="timeline().percentage"
              [size]="110"
              [strokeWidth]="9"
              [startColor]="'#00d9ff'"
              [endColor]="'#00f59b'"
              subtitle="Completado"
            ></app-progress-ring>
          </div>

          <div class="hero-stats">
            <div class="stat-box">
              <span class="stat-lbl">Semana Actual</span>
              <strong class="stat-val mono-num text-lime">Semana {{ timeline().weeksElapsed }} / {{ timeline().totalWeeks }}</strong>
            </div>

            <div class="stat-box">
              <span class="stat-lbl">Días Transcurridos</span>
              <strong class="stat-val mono-num">{{ timeline().daysElapsed }} de {{ timeline().totalDays }} días</strong>
            </div>

            <div class="stat-box">
              <span class="stat-lbl">Días para la Meta</span>
              <strong class="stat-val mono-num text-cyan">{{ timeline().daysRemaining }} días restantes</strong>
            </div>
          </div>
        </div>

        <!-- Global Horizontal Progress Bar with Phase Markers -->
        <div class="timeline-bar-wrap">
          <div class="timeline-bar-track">
            <div class="timeline-bar-fill" [style.width.%]="timeline().percentage"></div>
          </div>
          <div class="timeline-markers">
            <span class="marker">9 Sep (Inicio)</span>
            <span class="marker">Octubre (Ajuste)</span>
            <span class="marker">Noviembre (Déficit)</span>
            <span class="marker">31 Dic (Final)</span>
          </div>
        </div>
      </div>

      <!-- Roadmap Phases -->
      <div class="phases-container">
        @for (phase of phases(); track phase.number) {
          <div class="phase-card gym-card" [class.phase-active]="phase.status === 'current'">
            <div class="phase-header">
              <div class="phase-title-group">
                <span class="badge-tag" [ngClass]="getPhaseBadge(phase.status)">
                  Fase {{ phase.number }} &bull; {{ phase.period }}
                </span>
                <h3 class="phase-name">{{ phase.name }}</h3>
              </div>
              <span class="phase-focus badge-tag badge-gray">{{ phase.focus }}</span>
            </div>

            <p class="phase-desc">{{ phase.description }}</p>

            <div class="phase-targets">
              <span class="targets-header">Puntos Clave de la Fase:</span>
              <ul class="targets-list">
                @for (target of phase.keyTargets; track target) {
                  <li>{{ target }}</li>
                }
              </ul>
            </div>
          </div>
        }
      </div>

      <!-- Key Milestones Checklist -->
      <div class="milestones-card gym-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            <span>🚩</span>
            <h3>Hitos Clave del Plan</h3>
          </div>
        </div>

        <div class="milestones-list">
          @for (m of milestones(); track m.id) {
            <div
              class="milestone-item"
              [class.m-completed]="m.completed"
              (click)="toggleMilestone(m.id)"
            >
              <input
                type="checkbox"
                class="gym-checkbox"
                [checked]="m.completed"
                (click)="$event.stopPropagation()"
                (change)="toggleMilestone(m.id)"
              />
              <div class="milestone-info">
                <h4 class="milestone-title">{{ m.title }}</h4>
                <p class="milestone-desc">{{ m.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .roadmap-page {
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
    }

    .progress-hero-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .hero-flex {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .hero-stats {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
    }

    .stat-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-val {
      font-size: 1.15rem;
      font-weight: 800;
    }

    .text-lime { color: var(--accent-lime); }
    .text-cyan { color: var(--accent-cyan); }

    .timeline-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .timeline-bar-track {
      height: 8px;
      background: var(--bg-surface);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .timeline-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #00d9ff, #00f59b);
      border-radius: var(--radius-full);
      transition: width 0.4s ease;
      box-shadow: 0 0 10px rgba(0, 245, 155, 0.4);
    }

    .timeline-markers {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .phases-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .phase-card {
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;

      &.phase-active {
        border-color: rgba(0, 245, 155, 0.4);
        box-shadow: 0 0 16px rgba(0, 245, 155, 0.15);
      }
    }

    .phase-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .phase-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .phase-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .phase-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .phase-targets {
      background: var(--bg-card);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .targets-header {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-lime);
    }

    .targets-list {
      list-style-type: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      li {
        font-size: 0.82rem;
        color: var(--text-secondary);
        padding-left: 0.85rem;
        position: relative;

        &::before {
          content: '✔';
          position: absolute;
          left: 0;
          color: var(--accent-cyan);
          font-size: 0.75rem;
        }
      }
    }

    .milestones-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-title-row {
      display: flex;
      align-items: center;
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

    .milestones-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .milestone-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &.m-completed {
        border-color: rgba(0, 245, 155, 0.3);
        background: rgba(0, 245, 155, 0.05);

        .milestone-title {
          text-decoration: line-through;
          color: var(--accent-lime);
        }
      }
    }

    .milestone-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .milestone-title {
      font-size: 0.92rem;
      font-weight: 700;
    }

    .milestone-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  `],
})
export class RoadmapComponent {
  private readonly progress = inject(ProgressService);
  private readonly storage = inject(StorageService);

  public readonly timeline = this.progress.roadmapProgress;

  public readonly phases = computed<PhaseInfo[]>(() => {
    const elapsedWeeks = this.timeline().weeksElapsed;
    return [
      {
        number: 1,
        name: 'Adaptación y Fijación de Hábitos',
        period: 'Septiembre 2026 (Sem 1-4)',
        focus: 'Consistencia 100%',
        description:
          'Establecer la rutina PPL x2, registrar todas las cargas base, saturar creatina monohidrato y ajustar la ingesta a 2150 kcal sin fallar.',
        keyTargets: [
          'Saturación muscular con 3-5g de creatina diarios.',
          'Consistencia en los 6 días de entrenamiento del split PPL.',
          'Primeras 2 semanas de pesajes diarios para establecer la media móvil real.',
          'Foto de progreso y medidas iniciales tomadas.',
        ],
        status: elapsedWeeks <= 4 ? 'current' : 'completed',
      },
      {
        number: 2,
        name: 'Déficit Sostenido y Sobrecarga Progresiva',
        period: 'Octubre - Noviembre 2026 (Sem 5-12)',
        focus: 'Oxidación de Grasa y Cargas',
        description:
          'El núcleo del proceso: mantener las cargas de entrenamiento pesadas para señalizar retención muscular mientras la grasa corporal desciende al 0.5-1% semanal.',
        keyTargets: [
          'Progreso o mantenimiento de marcas en Press Banca, Sentadilla y Peso Muerto.',
          'Control de ritmo semanal entre 0.38 y 0.76 kg/semana.',
          'Registro de medidas quincenales (cintura en descenso constante).',
          'Si el peso se estanca 14 días: reducir 100-150 kcal o sumar 20 min de cardio zona 2.',
        ],
        status: elapsedWeeks > 4 && elapsedWeeks <= 12 ? 'current' : elapsedWeeks > 12 ? 'completed' : 'upcoming',
      },
      {
        number: 3,
        name: 'Evaluación Final y Transición',
        period: 'Diciembre 2026 (Sem 13-16)',
        focus: 'Peak Shape & Mantenimiento',
        description:
          'Fase final de evaluación: fotos comparativas antes/después, medidas finales, balance de fuerza y subida gradual a calorías de mantenimiento (reverse diet).',
        keyTargets: [
          'Sesión fotográfica final comparada contra la Semana 1.',
          'Medición final de cintura, cadera y brazos.',
          'Verificación de que los niveles de fuerza se conservaron al 100%.',
          'Aumento progresivo de calorías a nuevo mantenimiento (~2400-2500 kcal).',
        ],
        status: elapsedWeeks > 12 ? 'current' : 'upcoming',
      },
    ];
  });

  public readonly milestones = signal<MilestoneItem[]>([
    {
      id: 'm1',
      title: 'Punto de partida registrado (76.2 kg)',
      description: 'Pesaje inicial en ayunas y registro de medidas base.',
      completed: true,
    },
    {
      id: 'm2',
      title: 'Semana 1 de Split PPL x2 completada al 100%',
      description: 'Cumplir los 6 entrenamientos (Push 1, Pull 1, Legs 1, Push 2, Pull 2, Legs 2).',
      completed: false,
    },
    {
      id: 'm3',
      title: 'Saturación de Creatina lograda (14 días consecutivos)',
      description: 'Depósitos intramusculares llenos de fosfocreatina.',
      completed: false,
    },
    {
      id: 'm4',
      title: 'Primer hito de peso: media semanal < 75.0 kg',
      description: 'Primera confirmación de pérdida neta de tejido adiposo.',
      completed: false,
    },
    {
      id: 'm5',
      title: 'Sobrecarga en Press Banca (+2.5 kg o +2 reps)',
      description: 'Demostración de que no se ha perdido fuerza muscular en déficit.',
      completed: false,
    },
    {
      id: 'm6',
      title: 'Cintura < 80 cm en registro quincenal',
      description: 'Reducción notable de grasa visceral y subcutánea.',
      completed: false,
    },
    {
      id: 'm7',
      title: 'Completar foto comparativa Semana 1 vs Semana 8',
      description: 'Primera comparativa visual en el comparador lado a lado.',
      completed: false,
    },
    {
      id: 'm8',
      title: 'Meta de Diciembre 2026 alcanzada',
      description: 'Físico definido, marcas de fuerza intactas y evaluación final.',
      completed: false,
    },
  ]);

  public toggleMilestone(id: string): void {
    this.milestones.update((list) =>
      list.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  }

  public getPhaseBadge(status: 'current' | 'upcoming' | 'completed'): string {
    switch (status) {
      case 'current':
        return 'badge-lime';
      case 'completed':
        return 'badge-cyan';
      default:
        return 'badge-gray';
    }
  }
}
