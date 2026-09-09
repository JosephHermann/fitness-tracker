import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { StorageService } from '../../core/services/storage.service';
import { ProgressService } from '../../core/services/progress.service';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { WeightAnalytics, WeightEntry } from '../../core/models/weight.model';
import { MeasurementEntry } from '../../core/models/measurement.model';
import { ProgressPhoto } from '../../core/models/photo.model';

Chart.register(...registerables);

type TabType = 'peso' | 'medidas' | 'fotos';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-page">
      <!-- Section Switcher Tabs -->
      <div class="tab-switcher gym-card">
        <button
          type="button"
          class="tab-btn"
          [class.active-tab]="activeTab() === 'peso'"
          (click)="activeTab.set('peso')"
        >
          <span>⚖️</span>
          <span>Peso & Ritmo</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active-tab]="activeTab() === 'medidas'"
          (click)="activeTab.set('medidas')"
        >
          <span>📏</span>
          <span>Medidas</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active-tab]="activeTab() === 'fotos'"
          (click)="activeTab.set('fotos')"
        >
          <span>📸</span>
          <span>Fotos & Comparador</span>
        </button>
      </div>

      <!-- ================= TAB 1: PESO Y RITMO ================= -->
      @if (activeTab() === 'peso') {
        <div class="tab-content">
          <!-- Rate Indicator Banner -->
          <div class="rate-banner gym-card" [ngClass]="'tone-' + analytics().statusTone">
            <div class="rate-header">
              <span class="rate-badge badge-tag" [ngClass]="'badge-' + analytics().statusTone">
                Ritmo Semanal
              </span>
              <span class="rate-target-hint">Objetivo: 0.5% - 1.0% / semana</span>
            </div>
            <h3 class="rate-title">{{ analytics().statusTitle }}</h3>
            <p class="rate-desc">{{ analytics().statusDescription }}</p>

            <div class="metrics-strip">
              <div class="metric-item">
                <span class="metric-label">Peso Actual</span>
                <span class="metric-value mono-num">{{ analytics().currentWeightKg }} kg</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Inicio (9 Sep)</span>
                <span class="metric-value mono-num">{{ analytics().startWeightKg }} kg</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Pérdida Total</span>
                <span class="metric-value mono-num text-lime">
                  -{{ analytics().totalLossKg }} kg ({{ analytics().totalLossPct }}%)
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Media 7 Días</span>
                <span class="metric-value mono-num text-cyan">{{ analytics().rolling7DayAvgKg }} kg</span>
              </div>
            </div>
          </div>

          <!-- Interactive Chart -->
          <div class="chart-card gym-card">
            <div class="chart-header">
              <div>
                <h3 class="chart-title">Evolución de Peso y Tendencia Semanal</h3>
                <p class="chart-subtitle">
                  Azul: pesaje diario &bull; Verde neón: media móvil 7 días (foco real del progreso)
                </p>
              </div>
              <button type="button" class="btn-primary btn-add-weight" (click)="openAddWeightModal()">
                + Registrar Peso
              </button>
            </div>

            <div class="canvas-wrapper">
              <canvas #weightChartCanvas></canvas>
            </div>
          </div>

          <!-- Weight Log Table -->
          <div class="log-history-card gym-card">
            <div class="history-title-row">
              <h3>Historial de Pesajes</h3>
              <span class="badge-tag badge-gray">{{ weightEntries().length }} registros</span>
            </div>

            <div class="weight-entries-table">
              @for (entry of sortedWeightEntries(); track entry.id) {
                <div class="weight-row">
                  <span class="weight-date mono-num">{{ entry.date }}</span>
                  <strong class="weight-kg mono-num">{{ entry.weightKg }} kg</strong>
                  <span class="weight-note">{{ entry.note || 'Pesaje en ayunas' }}</span>
                  <button
                    type="button"
                    class="btn-icon del-btn"
                    title="Eliminar pesaje"
                    (click)="deleteWeight(entry.id)"
                  >
                    ✕
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ================= TAB 2: MEDIDAS ================= -->
      @if (activeTab() === 'medidas') {
        <div class="tab-content">
          <div class="page-intro gym-card">
            <div class="intro-flex">
              <div>
                <span class="badge-tag badge-orange">Bi-semanal</span>
                <h3 class="intro-title">Registro de Medidas Antropométricas</h3>
                <p class="intro-desc">
                  Toma las medidas cada 14 días al despertar para verificar que la pérdida de peso proviene de la cintura y no del músculo.
                </p>
              </div>
              <button type="button" class="btn-primary" (click)="openAddMeasurementModal()">
                + Registrar Medidas
              </button>
            </div>
          </div>

          <div class="measurements-list gym-card">
            <div class="meas-table">
              <div class="meas-row meas-th">
                <span>Fecha</span>
                <span>Cintura</span>
                <span>Cadera</span>
                <span>Brazo</span>
                <span>Pierna</span>
                <span>Pecho</span>
                <span></span>
              </div>
              @for (m of sortedMeasurements(); track m.id) {
                <div class="meas-row">
                  <span class="mono-num meas-date">{{ m.date }}</span>
                  <span class="mono-num text-lime">{{ m.waistCm ? m.waistCm + ' cm' : '-' }}</span>
                  <span class="mono-num">{{ m.hipsCm ? m.hipsCm + ' cm' : '-' }}</span>
                  <span class="mono-num text-cyan">{{ m.armCm ? m.armCm + ' cm' : '-' }}</span>
                  <span class="mono-num">{{ m.thighCm ? m.thighCm + ' cm' : '-' }}</span>
                  <span class="mono-num">{{ m.chestCm ? m.chestCm + ' cm' : '-' }}</span>
                  <button
                    type="button"
                    class="btn-icon del-btn"
                    title="Eliminar registro"
                    (click)="deleteMeasurement(m.id)"
                  >
                    ✕
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ================= TAB 3: FOTOS Y COMPARADOR ================= -->
      @if (activeTab() === 'fotos') {
        <div class="tab-content">
          <div class="page-intro gym-card">
            <div class="intro-flex">
              <div>
                <span class="badge-tag badge-purple">IndexedDB Persistente</span>
                <h3 class="intro-title">Fotos de Progreso Corporal</h3>
                <p class="intro-desc">
                  El espejo y las fotos son la métrica definitiva de recomposición.
                </p>
              </div>
              <div class="photo-actions-top">
                <button
                  type="button"
                  class="btn-secondary"
                  (click)="toggleCompareMode()"
                  [disabled]="photos().length < 2"
                >
                  {{ compareMode() ? 'Cerrar Comparador' : '⚖️ Modo Comparar' }}
                </button>
                <label class="btn-primary upload-btn">
                  <span>+ Subir Foto</span>
                  <input type="file" accept="image/*" (change)="handlePhotoUpload($event)" hidden />
                </label>
              </div>
            </div>
          </div>

          <!-- Compare Mode Side-by-Side View -->
          @if (compareMode() && photos().length >= 2) {
            <div class="compare-card gym-card">
              <div class="compare-header">
                <span class="badge-tag badge-lime">Comparativa Visual Lado a Lado</span>
                <h4>Compara tu cambio físico</h4>
              </div>

              <div class="compare-selectors">
                <div class="selector-box">
                  <label>Foto A (Antes):</label>
                  <select class="gym-input" [(ngModel)]="comparePhotoAId">
                    @for (p of photos(); track p.id) {
                      <option [value]="p.id">{{ p.tag }} &bull; {{ p.date }} ({{ p.weightKg || '?' }} kg)</option>
                    }
                  </select>
                </div>

                <div class="selector-box">
                  <label>Foto B (Después):</label>
                  <select class="gym-input" [(ngModel)]="comparePhotoBId">
                    @for (p of photos(); track p.id) {
                      <option [value]="p.id">{{ p.tag }} &bull; {{ p.date }} ({{ p.weightKg || '?' }} kg)</option>
                    }
                  </select>
                </div>
              </div>

              <div class="compare-split-view">
                <div class="compare-pane">
                  @if (selectedPhotoA(); as photoA) {
                    <div class="pane-img-wrap">
                      <img [src]="photoA.dataUrl" [alt]="photoA.title" class="compare-img" />
                      <div class="pane-badge">
                        <span class="badge-tag badge-cyan">{{ photoA.tag }} &bull; {{ photoA.date }}</span>
                        @if (photoA.weightKg) {
                          <span class="badge-tag badge-lime mono-num">{{ photoA.weightKg }} kg</span>
                        }
                      </div>
                    </div>
                  }
                </div>

                <div class="compare-pane">
                  @if (selectedPhotoB(); as photoB) {
                    <div class="pane-img-wrap">
                      <img [src]="photoB.dataUrl" [alt]="photoB.title" class="compare-img" />
                      <div class="pane-badge">
                        <span class="badge-tag badge-orange">{{ photoB.tag }} &bull; {{ photoB.date }}</span>
                        @if (photoB.weightKg) {
                          <span class="badge-tag badge-lime mono-num">{{ photoB.weightKg }} kg</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Photo Gallery Grid -->
          <div class="photo-gallery-grid">
            @for (photo of photos(); track photo.id) {
              <div class="photo-card gym-card">
                <div class="photo-img-wrap">
                  <img [src]="photo.dataUrl" [alt]="photo.title" class="gallery-img" />
                  <span class="photo-tag badge-tag badge-purple">{{ photo.tag }}</span>
                </div>
                <div class="photo-info">
                  <div class="photo-meta">
                    <span class="photo-date mono-num">{{ photo.date }}</span>
                    @if (photo.weightKg) {
                      <strong class="photo-weight mono-num text-lime">{{ photo.weightKg }} kg</strong>
                    }
                  </div>
                  @if (photo.notes) {
                    <p class="photo-notes">{{ photo.notes }}</p>
                  }
                  <button
                    type="button"
                    class="btn-icon del-photo-btn"
                    title="Eliminar foto"
                    (click)="deletePhoto(photo.id)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-photos gym-card">
                <span class="empty-icon">📷</span>
                <h4>Sin fotos de progreso todavía</h4>
                <p>Sube tu primera foto de la Semana 1 para empezar el registro visual de tu recomposición.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal Add Weight -->
      @if (showWeightModal()) {
        <div class="modal-backdrop" (click)="closeAddWeightModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Registrar Pesaje Diario</h3>
              <button type="button" class="btn-close" (click)="closeAddWeightModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <label>Fecha:</label>
                <input type="date" class="gym-input mono-num" [(ngModel)]="newWeightDate" />
              </div>
              <div class="form-row">
                <label>Peso Corporal (kg):</label>
                <input type="number" step="0.1" class="gym-input mono-num" placeholder="ej. 75.8" [(ngModel)]="newWeightVal" />
              </div>
              <div class="form-row">
                <label>Nota (opcional):</label>
                <input type="text" class="gym-input" placeholder="ej. Ayunas, tras ir al baño" [(ngModel)]="newWeightNote" />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeAddWeightModal()">Cancelar</button>
                <button type="button" class="btn-primary" (click)="saveNewWeight()">Guardar Peso</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal Add Measurement -->
      @if (showMeasurementModal()) {
        <div class="modal-backdrop" (click)="closeAddMeasurementModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Registrar Medidas Corporales</h3>
              <button type="button" class="btn-close" (click)="closeAddMeasurementModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <label>Fecha:</label>
                <input type="date" class="gym-input mono-num" [(ngModel)]="newMeasDate" />
              </div>
              <div class="form-row">
                <label>Cintura (a nivel de ombligo) cm:</label>
                <input type="number" step="0.5" class="gym-input mono-num" placeholder="83.5" [(ngModel)]="newMeasWaist" />
              </div>
              <div class="form-row">
                <label>Cadera (máximo glúteo) cm:</label>
                <input type="number" step="0.5" class="gym-input mono-num" placeholder="97.5" [(ngModel)]="newMeasHips" />
              </div>
              <div class="form-row">
                <label>Brazo (contraído) cm:</label>
                <input type="number" step="0.5" class="gym-input mono-num" placeholder="34.5" [(ngModel)]="newMeasArm" />
              </div>
              <div class="form-row">
                <label>Muslo / Pierna cm:</label>
                <input type="number" step="0.5" class="gym-input mono-num" placeholder="57.0" [(ngModel)]="newMeasThigh" />
              </div>
              <div class="form-row">
                <label>Pecho cm:</label>
                <input type="number" step="0.5" class="gym-input mono-num" placeholder="99.0" [(ngModel)]="newMeasChest" />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeAddMeasurementModal()">Cancelar</button>
                <button type="button" class="btn-primary" (click)="saveNewMeasurement()">Guardar Medidas</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
    }

    .tab-switcher {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-card);
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.65rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: var(--text-main);
      }

      &.active-tab {
        background: var(--bg-surface);
        border-color: var(--accent-lime);
        color: var(--accent-lime);
        box-shadow: 0 0 10px rgba(0, 245, 155, 0.2);
      }
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Rate Banner */
    .rate-banner {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      transition: all 0.2s ease;

      &.tone-success {
        border-color: rgba(0, 245, 155, 0.4);
        background: linear-gradient(135deg, #101827 0%, rgba(0, 245, 155, 0.08) 100%);
      }
      &.tone-warning {
        border-color: rgba(255, 170, 0, 0.4);
        background: linear-gradient(135deg, #101827 0%, rgba(255, 170, 0, 0.08) 100%);
      }
      &.tone-danger {
        border-color: rgba(255, 51, 102, 0.4);
        background: linear-gradient(135deg, #101827 0%, rgba(255, 51, 102, 0.08) 100%);
      }
      &.tone-info {
        border-color: var(--border-subtle);
      }
    }

    .rate-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .rate-target-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .rate-title {
      font-size: 1.2rem;
      font-weight: 800;
    }

    .rate-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .metrics-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .metric-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-value {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .text-lime { color: var(--accent-lime); }
    .text-cyan { color: var(--accent-cyan); }

    /* Chart Card */
    .chart-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .chart-title {
      font-size: 1.05rem;
      font-weight: 700;
    }

    .chart-subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .btn-add-weight {
      padding: 0.45rem 0.9rem;
      font-size: 0.82rem;
    }

    .canvas-wrapper {
      position: relative;
      height: 280px;
      width: 100%;
    }

    /* History table */
    .log-history-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .history-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h3 { font-size: 1rem; }
    }

    .weight-entries-table {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 250px;
      overflow-y: auto;
    }

    .weight-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-surface);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      gap: 0.5rem;
    }

    .weight-date {
      color: var(--text-muted);
      font-size: 0.78rem;
    }

    .weight-kg {
      color: var(--accent-lime);
      font-size: 0.95rem;
    }

    .weight-note {
      color: var(--text-secondary);
      font-size: 0.75rem;
      flex: 1;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .del-btn {
      width: 26px;
      height: 26px;
      font-size: 0.75rem;
      color: var(--text-muted);
      &:hover { color: var(--accent-red); border-color: var(--accent-red); }
    }

    /* Measurements */
    .intro-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .intro-title {
      font-size: 1.15rem;
      margin: 0.25rem 0 0.15rem;
    }

    .intro-desc {
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .meas-table {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      overflow-x: auto;
    }

    .meas-row {
      display: grid;
      grid-template-columns: 100px 70px 70px 70px 70px 70px 40px;
      align-items: center;
      background: var(--bg-surface);
      padding: 0.55rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      text-align: center;
    }

    .meas-th {
      background: transparent;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
    }

    .meas-date {
      text-align: left;
    }

    /* Photos */
    .photo-actions-top {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .upload-btn {
      padding: 0.55rem 1rem;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .compare-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border-color: rgba(0, 245, 155, 0.3);
    }

    .compare-header {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .compare-selectors {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .selector-box {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .compare-split-view {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .pane-img-wrap {
      position: relative;
      border-radius: var(--radius-sm);
      overflow: hidden;
      aspect-ratio: 3/4;
      background: #000;
    }

    .compare-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pane-badge {
      position: absolute;
      bottom: 0.5rem;
      left: 0.5rem;
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .photo-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .photo-card {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0.75rem;
    }

    .photo-img-wrap {
      position: relative;
      border-radius: var(--radius-sm);
      overflow: hidden;
      aspect-ratio: 3/4;
      background: #000;
    }

    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-tag {
      position: absolute;
      top: 0.4rem;
      left: 0.4rem;
    }

    .photo-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }

    .photo-meta {
      display: flex;
      flex-direction: column;
    }

    .photo-date {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .photo-weight {
      font-size: 0.85rem;
    }

    .del-photo-btn {
      width: 28px;
      height: 28px;
      font-size: 0.8rem;
    }

    .empty-photos {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .empty-icon {
        font-size: 2.5rem;
      }
      p {
        color: var(--text-muted);
        font-size: 0.85rem;
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
      max-width: 440px;
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
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 0.5rem;
    }
  `],
})
export class ProgressComponent implements AfterViewInit, OnDestroy {
  private readonly storage = inject(StorageService);
  private readonly progress = inject(ProgressService);
  private readonly idb = inject(IndexedDbService);

  public readonly activeTab = signal<TabType>('peso');
  public readonly weightEntries = this.storage.weightEntries;
  public readonly measurementEntries = this.storage.measurementEntries;
  public readonly analytics = this.progress.weightAnalytics;
  public readonly photos = this.idb.photos;

  public readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('weightChartCanvas');
  private chartInstance: Chart | null = null;

  // Modals
  public readonly showWeightModal = signal<boolean>(false);
  public readonly showMeasurementModal = signal<boolean>(false);

  // New weight form state
  public newWeightDate = new Date().toISOString().substring(0, 10);
  public newWeightVal: number | null = null;
  public newWeightNote = '';

  // New measurement form state
  public newMeasDate = new Date().toISOString().substring(0, 10);
  public newMeasWaist: number | null = null;
  public newMeasHips: number | null = null;
  public newMeasArm: number | null = null;
  public newMeasThigh: number | null = null;
  public newMeasChest: number | null = null;

  // Compare mode
  public readonly compareMode = signal<boolean>(false);
  public comparePhotoAId = '';
  public comparePhotoBId = '';

  public readonly sortedWeightEntries = computed(() => {
    return [...this.weightEntries()].sort((a, b) => b.date.localeCompare(a.date));
  });

  public readonly sortedMeasurements = computed(() => {
    return [...this.measurementEntries()].sort((a, b) => b.date.localeCompare(a.date));
  });

  public readonly selectedPhotoA = computed(() => {
    const list = this.photos();
    return list.find((p) => p.id === this.comparePhotoAId) || list[list.length - 1] || null;
  });

  public readonly selectedPhotoB = computed(() => {
    const list = this.photos();
    return list.find((p) => p.id === this.comparePhotoBId) || list[0] || null;
  });

  constructor() {
    // Automatically re-render chart whenever weightEntries change or tab switches to 'peso'
    effect(() => {
      const tab = this.activeTab();
      const entries = this.weightEntries();
      if (tab === 'peso') {
        setTimeout(() => this.renderChart(), 50);
      }
    });
  }

  public ngAfterViewInit(): void {
    if (this.activeTab() === 'peso') {
      this.renderChart();
    }
  }

  public ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private renderChart(): void {
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const historyWithAvg = this.progress.getWeightHistoryWithAverages();
    const labels = historyWithAvg.map((p) => p.date.substring(5)); // MM-DD
    const rawWeights = historyWithAvg.map((p) => p.weight);
    const avgWeights = historyWithAvg.map((p) => p.rollingAvg);

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pesaje Diario (kg)',
            data: rawWeights,
            borderColor: 'rgba(0, 217, 255, 0.65)',
            backgroundColor: 'rgba(0, 217, 255, 0.08)',
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 4,
            pointBackgroundColor: '#00d9ff',
            fill: false,
          },
          {
            label: 'Media Móvil 7 Días (Tendencia)',
            data: avgWeights,
            borderColor: '#00f59b',
            backgroundColor: 'rgba(0, 245, 155, 0.12)',
            borderWidth: 3,
            tension: 0.35,
            pointRadius: 0,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              color: '#94a3b8',
              font: { family: 'Outfit', size: 12 },
            },
          },
          tooltip: {
            backgroundColor: '#101622',
            titleColor: '#ffffff',
            bodyColor: '#00f59b',
            borderColor: '#1c273a',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
          },
        },
      },
    });
  }

  // Add Weight
  public openAddWeightModal(): void {
    this.newWeightDate = new Date().toISOString().substring(0, 10);
    this.newWeightVal = this.analytics().currentWeightKg || 76.2;
    this.newWeightNote = '';
    this.showWeightModal.set(true);
  }

  public closeAddWeightModal(): void {
    this.showWeightModal.set(false);
  }

  public saveNewWeight(): void {
    if (!this.newWeightVal || this.newWeightVal <= 0) {
      alert('Introduce un peso válido.');
      return;
    }
    this.storage.addWeightEntry(this.newWeightDate, this.newWeightVal, this.newWeightNote);
    this.closeAddWeightModal();
  }

  public deleteWeight(id: string): void {
    if (confirm('¿Eliminar este registro de peso?')) {
      this.storage.deleteWeightEntry(id);
    }
  }

  // Add Measurement
  public openAddMeasurementModal(): void {
    this.newMeasDate = new Date().toISOString().substring(0, 10);
    this.showMeasurementModal.set(true);
  }

  public closeAddMeasurementModal(): void {
    this.showMeasurementModal.set(false);
  }

  public saveNewMeasurement(): void {
    this.storage.addMeasurement({
      date: this.newMeasDate,
      waistCm: this.newMeasWaist || undefined,
      hipsCm: this.newMeasHips || undefined,
      armCm: this.newMeasArm || undefined,
      thighCm: this.newMeasThigh || undefined,
      chestCm: this.newMeasChest || undefined,
    });
    this.closeAddMeasurementModal();
  }

  public deleteMeasurement(id: string): void {
    if (confirm('¿Eliminar este registro de medidas?')) {
      this.storage.deleteMeasurement(id);
    }
  }

  // Photo uploads and management
  public handlePhotoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const count = this.photos().length + 1;
      const photo: ProgressPhoto = {
        id: 'photo_' + Date.now(),
        date: new Date().toISOString().substring(0, 10),
        title: `Progreso #${count}`,
        tag: `Semana ${Math.ceil(count / 2)}`,
        weightKg: this.analytics().currentWeightKg,
        dataUrl,
        createdAt: Date.now(),
      };

      this.idb.savePhoto(photo).then(() => {
        alert('Foto guardada con éxito en IndexedDB.');
      });
    };

    reader.readAsDataURL(file);
    input.value = '';
  }

  public deletePhoto(id: string): void {
    if (confirm('¿Eliminar esta foto de progreso?')) {
      this.idb.deletePhoto(id);
    }
  }

  public toggleCompareMode(): void {
    const next = !this.compareMode();
    this.compareMode.set(next);
    if (next && this.photos().length >= 2) {
      const list = this.photos();
      this.comparePhotoAId = list[list.length - 1].id; // older photo
      this.comparePhotoBId = list[0].id; // newest photo
    }
  }
}
