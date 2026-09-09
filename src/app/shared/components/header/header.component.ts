import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ProgressService } from '../../../core/services/progress.service';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header">
      <div class="header-container">
        <div class="brand-section">
          <div class="brand-logo">
            <span class="logo-bolt">⚡</span>
          </div>
          <div>
            <h1 class="brand-title">APEX <span class="brand-sub">RECOMP</span></h1>
            <p class="brand-meta">PPL x2 &bull; 76.2 kg &rarr; Meta Dic 2026</p>
          </div>
        </div>

        <div class="actions-section">
          <!-- Streak Pill -->
          <div class="streak-pill" [class.active-streak]="streak() > 0" title="Racha de días cumpliendo el plan">
            <span class="streak-icon">🔥</span>
            <span class="streak-number mono-num">{{ streak() }}</span>
            <span class="streak-label">DÍAS</span>
          </div>

          <!-- Backup / Settings Button -->
          <button
            type="button"
            class="settings-btn"
            (click)="openBackupModal.emit()"
            title="Exportar / Importar Datos de Respaldo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(8, 11, 17, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.75rem 1rem;
    }
    .header-container {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, rgba(0, 245, 155, 0.2), rgba(0, 217, 255, 0.2));
      border: 1px solid rgba(0, 245, 155, 0.4);
      display: grid;
      place-content: center;
      font-size: 1.15rem;
      box-shadow: 0 0 10px rgba(0, 245, 155, 0.2);
    }
    .brand-title {
      font-size: 1.05rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      line-height: 1.1;
      color: #ffffff;
    }
    .brand-sub {
      color: var(--accent-lime);
    }
    .brand-meta {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .actions-section {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .streak-pill {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(255, 110, 38, 0.12);
      border: 1px solid rgba(255, 110, 38, 0.3);
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-full);
      color: var(--accent-orange);
      font-weight: 700;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }
    .streak-pill.active-streak {
      box-shadow: 0 0 12px rgba(255, 110, 38, 0.35);
      border-color: var(--accent-orange);
    }
    .streak-icon {
      font-size: 0.95rem;
    }
    .streak-number {
      font-size: 0.95rem;
      font-weight: 800;
    }
    .streak-label {
      font-size: 0.65rem;
      letter-spacing: 0.05em;
      opacity: 0.85;
    }
    .settings-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: grid;
      place-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--bg-card-hover);
        color: var(--accent-lime);
        border-color: var(--accent-lime);
      }
    }
  `],
})
export class HeaderComponent {
  private readonly progress = inject(ProgressService);
  public readonly streak = this.progress.currentStreak;
  public readonly openBackupModal = output<void>();
}
