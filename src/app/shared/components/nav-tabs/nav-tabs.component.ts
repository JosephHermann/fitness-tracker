import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  iconSvg: string;
}

@Component({
  selector: 'app-nav-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bottom-nav">
      <div class="nav-container">
        <a routerLink="/hoy" routerLinkActive="active" class="nav-item">
          <div class="icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <span class="nav-label">Hoy</span>
        </a>

        <a routerLink="/rutina" routerLinkActive="active" class="nav-item">
          <div class="icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6.5 6.5 11 11"></path>
              <path d="m21 21-1-1"></path>
              <path d="m3 3 1 1"></path>
              <path d="m18 22 4-4"></path>
              <path d="m2 6 4-4"></path>
              <path d="m3 10 7-7"></path>
              <path d="m14 21 7-7"></path>
            </svg>
          </div>
          <span class="nav-label">Rutina</span>
        </a>

        <a routerLink="/nutricion" routerLinkActive="active" class="nav-item">
          <div class="icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v8"></path>
              <path d="m4.93 10.93 1.41 1.41"></path>
              <path d="M2 18h2"></path>
              <path d="M20 18h2"></path>
              <path d="m19.07 10.93-1.41 1.41"></path>
              <path d="M22 22H2"></path>
              <path d="m8 6 4-4 4 4"></path>
              <path d="M16 18a4 4 0 0 0-8 0"></path>
            </svg>
          </div>
          <span class="nav-label">Nutrición</span>
        </a>

        <a routerLink="/progreso" routerLinkActive="active" class="nav-item">
          <div class="icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"></path>
              <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
          </div>
          <span class="nav-label">Progreso</span>
        </a>

        <a routerLink="/roadmap" routerLinkActive="active" class="nav-item">
          <div class="icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
              <line x1="9" y1="3" x2="9" y2="18"></line>
              <line x1="15" y1="6" x2="15" y2="21"></line>
            </svg>
          </div>
          <span class="nav-label">Roadmap</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      background: rgba(11, 15, 23, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--border-subtle);
      padding-bottom: var(--safe-bottom);
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
    }
    .nav-container {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0.45rem 0.5rem;
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      min-width: 58px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;

      &:hover {
        color: var(--text-secondary);
      }

      &.active {
        color: var(--accent-lime);

        .icon-wrap {
          transform: translateY(-2px);
          filter: drop-shadow(0 0 8px rgba(0, 245, 155, 0.6));
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 3px;
          background: var(--accent-lime);
          border-radius: var(--radius-full);
          box-shadow: 0 0 8px var(--accent-lime);
        }
      }
    }
    .icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    .nav-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
  `],
})
export class NavTabsComponent {}
