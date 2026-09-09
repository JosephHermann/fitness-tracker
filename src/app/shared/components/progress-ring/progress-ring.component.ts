import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ring-container" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()" class="ring-svg">
        <defs>
          <linearGradient [id]="gradientId()" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" [attr.stop-color]="startColor()" />
            <stop offset="100%" [attr.stop-color]="endColor()" />
          </linearGradient>
          <filter [id]="glowFilterId()" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Background Track -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          stroke="rgba(255, 255, 255, 0.08)"
          [attr.stroke-width]="strokeWidth()"
          fill="transparent"
        />

        <!-- Animated Progress Value -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          [attr.stroke]="'url(#' + gradientId() + ')'"
          [attr.stroke-width]="strokeWidth()"
          fill="transparent"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          [attr.filter]="glow() ? 'url(#' + glowFilterId() + ')' : null"
          class="progress-bar"
        />
      </svg>

      <div class="ring-content">
        @if (customContent()) {
          <ng-content></ng-content>
        } @else {
          <span class="ring-pct mono-num">{{ clampedPercentage() }}%</span>
          @if (subtitle()) {
            <span class="ring-subtitle">{{ subtitle() }}</span>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .ring-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ring-svg {
      transform: rotate(-90deg);
    }
    .progress-bar {
      transition: stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ring-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
    }
    .ring-pct {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1;
      color: var(--text-main);
    }
    .ring-subtitle {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-top: 3px;
    }
  `],
})
export class ProgressRingComponent {
  public readonly percentage = input<number>(0);
  public readonly size = input<number>(120);
  public readonly strokeWidth = input<number>(10);
  public readonly startColor = input<string>('#00f59b');
  public readonly endColor = input<string>('#00d9ff');
  public readonly glow = input<boolean>(true);
  public readonly subtitle = input<string>('');
  public readonly customContent = input<boolean>(false);

  private readonly instanceId = Math.random().toString(36).substring(2, 8);
  public readonly gradientId = computed(() => `ring-grad-${this.instanceId}`);
  public readonly glowFilterId = computed(() => `ring-glow-${this.instanceId}`);

  public readonly center = computed(() => this.size() / 2);
  public readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  public readonly circumference = computed(() => 2 * Math.PI * this.radius());

  public readonly clampedPercentage = computed(() =>
    Math.max(0, Math.min(100, Math.round(this.percentage())))
  );

  public readonly dashOffset = computed(() => {
    const c = this.circumference();
    const pct = this.clampedPercentage();
    return c - (pct / 100) * c;
  });
}
