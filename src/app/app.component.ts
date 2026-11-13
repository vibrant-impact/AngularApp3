import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ResourceService } from './services/resource.service';

/**
 * Root application shell displaying the top navigation bar,
 * live vault statistics, and primary router outlet.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="appShell">
      <header class="topNav">
        <a routerLink="/resources" class="brandLogo">
          <span class="brandIcon">⚡</span>
          <div>
            <h1>GitHub Vault</h1>
            <span class="subtitle">Developer Resource & Snippet Manager</span>
          </div>
        </a>

        <div class="navStats">
          <span class="statBadge">
            Total: <strong>{{ totalCount() }}</strong>
          </span>
          <span class="statBadge accentLime">
            Pinned: <strong>{{ pinnedCount() }}</strong>
          </span>
        </div>
      </header>

      <main class="mainContainer">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .appShell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .topNav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: linear-gradient(90deg, #1b0e2b 0%, #3d1f5b 100%);
      border-bottom: 1px solid rgba(125, 204, 255, 0.25);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brandLogo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #f8fafc;
    }
    .brandIcon {
      font-size: 1.75rem;
      background: rgba(198, 242, 34, 0.15);
      border: 1px solid #c6f222;
      border-radius: 10px;
      padding: 0.35rem 0.6rem;
    }
    .brandLogo h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 0.75rem;
      color: #7dccff;
    }
    .navStats {
      display: flex;
      gap: 0.75rem;
    }
    .statBadge {
      background: rgba(15, 10, 25, 0.7);
      border: 1px solid rgba(125, 204, 255, 0.3);
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      font-size: 0.85rem;
      color: #e2e8f0;
    }
    .statBadge.accentLime {
      border-color: #c6f222;
      color: #c6f222;
    }
    .mainContainer {
      flex: 1;
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
  `]
})
export class AppComponent {
  private readonly resourceService = inject(ResourceService);

  // Derived signals for live header counters
  readonly totalCount = computed(() => this.resourceService.resources().length);
  readonly pinnedCount = computed(() => this.resourceService.pinnedResources().length);
}