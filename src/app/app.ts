import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { NavTabsComponent } from './shared/components/nav-tabs/nav-tabs.component';
import { BackupModalComponent } from './shared/components/backup-modal/backup-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavTabsComponent, BackupModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  public readonly isBackupModalOpen = signal<boolean>(false);
}
