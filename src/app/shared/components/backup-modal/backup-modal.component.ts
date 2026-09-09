import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-backup-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">💾</span>
            <h3>Gestión de Datos y Respaldo</h3>
          </div>
          <button type="button" class="btn-close" (click)="close.emit()">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-desc">
            Todos tus datos están almacenados de forma privada en este navegador (localStorage e IndexedDB).
            Exporta periódicamente una copia de seguridad en JSON para no perder tu progreso o para moverlo a otro dispositivo.
          </p>

          <!-- Export Section -->
          <div class="action-box">
            <div class="box-text">
              <h4>Exportar Datos (JSON)</h4>
              <p>Descarga un archivo con toda tu rutina, pesos, checklists, fotos y analítica.</p>
            </div>
            <button type="button" class="btn-primary" (click)="downloadBackup()">
              Descargar Respaldo
            </button>
          </div>

          <!-- Import Section -->
          <div class="action-box">
            <div class="box-text">
              <h4>Importar Datos (JSON)</h4>
              <p>Restaura tu historial desde un archivo de respaldo previamente descargado.</p>
            </div>
            <label class="btn-secondary file-upload-btn">
              <span>Seleccionar Archivo JSON</span>
              <input type="file" accept=".json,application/json" (change)="handleFileSelect($event)" hidden />
            </label>
          </div>

          @if (importStatus()) {
            <div class="status-msg" [class.status-error]="isError()">
              {{ importStatus() }}
            </div>
          }

          <!-- Reset Factory -->
          <div class="danger-zone">
            <h4>Zona Peligrosa</h4>
            <p>Reinicia todos los datos a la configuración inicial (rutina PPL, 76.2 kg de inicio).</p>
            <button type="button" class="btn-danger" (click)="confirmReset()">
              Restablecer Valores Iniciales
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      animation: fadeIn 0.2s ease-out;
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      h3 {
        font-size: 1.1rem;
        margin: 0;
      }
    }
    .modal-icon {
      font-size: 1.25rem;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
      &:hover {
        color: var(--text-main);
      }
    }
    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .modal-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .action-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      h4 {
        font-size: 0.95rem;
        margin-bottom: 0.2rem;
      }
      p {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    }
    .file-upload-btn {
      display: inline-flex;
      cursor: pointer;
      text-align: center;
      justify-content: center;
    }
    .status-msg {
      background: rgba(0, 245, 155, 0.1);
      border: 1px solid rgba(0, 245, 155, 0.3);
      color: var(--accent-lime);
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      text-align: center;
    }
    .status-error {
      background: rgba(255, 51, 102, 0.1);
      border-color: rgba(255, 51, 102, 0.3);
      color: var(--accent-red);
    }
    .danger-zone {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
      h4 {
        color: var(--accent-red);
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }
      p {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: 0.75rem;
      }
    }
    .btn-danger {
      background: rgba(255, 51, 102, 0.12);
      border: 1px solid rgba(255, 51, 102, 0.4);
      color: var(--accent-red);
      font-weight: 600;
      font-size: 0.85rem;
      padding: 0.55rem 1rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover {
        background: var(--accent-red);
        color: #ffffff;
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
  `],
})
export class BackupModalComponent {
  private readonly storage = inject(StorageService);

  public readonly close = output<void>();
  public readonly importStatus = signal<string | null>(null);
  public readonly isError = signal<boolean>(false);

  public downloadBackup(): void {
    const jsonStr = this.storage.exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-fitness-backup-${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.importStatus.set('¡Copia de seguridad exportada con éxito!');
    this.isError.set(false);
  }

  public handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const success = this.storage.importDataFromJson(text);
        if (success) {
          this.importStatus.set('¡Datos importados y restaurados con éxito!');
          this.isError.set(false);
        } else {
          this.importStatus.set('El archivo JSON no tiene un formato válido de respaldo.');
          this.isError.set(true);
        }
      } catch (err) {
        this.importStatus.set('Error al procesar el archivo seleccionado.');
        this.isError.set(true);
      }
    };

    reader.readAsText(file);
    input.value = '';
  }

  public confirmReset(): void {
    if (confirm('¿Estás seguro de restablecer todos los datos a sus valores iniciales? Se perderán tus registros actuales.')) {
      this.storage.resetAllToDefaults();
      this.importStatus.set('Todos los datos fueron restablecidos a los valores iniciales.');
      this.isError.set(false);
    }
  }
}
