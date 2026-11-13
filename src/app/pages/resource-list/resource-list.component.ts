import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ResourceService, GithubSearchResult } from '../../services/resource.service';
import { GithubResource } from '../../models/githubResource.model';

/**
 * Primary catalog view (/resources).
 * Supports both local vault filtering and live GitHub repository discovery
 * by developer name, subject, dominant language, and date.
 */
@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resource-list.component.html',
  styleUrl: './resource-list.component.css'
})
export class ResourceListComponent implements OnInit {
  readonly resourceService = inject(ResourceService);

  // Search mode signal: 'vault' filters saved items; 'github' queries api.github.com
  readonly searchMode = signal<'vault' | 'github'>('vault');

  // Local UI state signals
  readonly isLoading = signal<boolean>(true);
  readonly isSearchingGithub = signal<boolean>(false);
  readonly githubSearchError = signal<string>('');
  readonly showAddModal = signal<boolean>(false);
  readonly isFetchingGithub = signal<boolean>(false);
  readonly fetchError = signal<string>('');
  readonly copiedId = signal<string | null>(null);
  readonly savedRepoSlugs = signal<Set<string>>(new Set());

  // Live GitHub Explorer filter signals
  readonly githubQuery = signal<string>('');
  readonly githubLanguage = signal<string>('All');
  readonly githubUpdatedAfter = signal<string>('');
  readonly githubSortBy = signal<'stars' | 'updated' | 'best-match'>('stars');

  // Form bindings for manual/modal resource creation
  slugInput = '';
  tagsInput = '';
  formState: Omit<GithubResource, 'id'> = this.createEmptyForm();

  ngOnInit(): void {
    if (this.resourceService.resources().length === 0) {
      this.resourceService.loadResources().subscribe({
        next: () => {
          this.syncSavedSlugs();
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.syncSavedSlugs();
      this.isLoading.set(false);
    }
  }

  /**
   * Executes a live search against GitHub's public Search API.
   */
  runLiveGithubSearch(): void {
    this.isSearchingGithub.set(true);
    this.githubSearchError.set('');

    this.resourceService
      .searchGithubRepositories({
        query: this.githubQuery(),
        language: this.githubLanguage(),
        updatedAfter: this.githubUpdatedAfter(),
        sortBy: this.githubSortBy()
      })
      .subscribe({
        next: () => {
          this.syncSavedSlugs();
          this.isSearchingGithub.set(false);
        },
        error: () => {
          this.githubSearchError.set(
            'GitHub API rate limit reached (10 searches/min for unauthenticated requests). Wait a moment and try again.'
          );
          this.isSearchingGithub.set(false);
        }
      });
  }

  /**
   * Imports a live GitHub search result directly into the user's simulated backend vault.
   */
  importGithubResultToVault(repo: GithubSearchResult): void {
    const newResource: Omit<GithubResource, 'id'> = {
      title: repo.name,
      author: repo.owner.login,
      repoSlug: repo.full_name,
      repoUrl: repo.html_url,
      category: this.inferCategory(repo),
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      status: 'To Explore',
      description: repo.description || 'Imported from live GitHub search.',
      personalNotes: `Last updated on GitHub: ${new Date(repo.updated_at).toLocaleDateString()}`,
      installCommand: `git clone ${repo.clone_url}`,
      tags: repo.topics?.slice(0, 4) || [repo.language || 'GitHub'],
      isPinned: false
    };

    this.resourceService.addResource(newResource).subscribe(() => {
      this.syncSavedSlugs();
    });
  }

  /**
   * Keeps track of which repo slugs are already saved in the vault.
   */
  private syncSavedSlugs(): void {
    const slugs = new Set(this.resourceService.resources().map(r => r.repoSlug.toLowerCase()));
    this.savedRepoSlugs.set(slugs);
  }

  isAlreadySaved(fullName: string): boolean {
    return this.savedRepoSlugs().has(fullName.toLowerCase());
  }

  private inferCategory(repo: GithubSearchResult): GithubResource['category'] {
    const text = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
    if (text.includes('ai') || text.includes('llm') || text.includes('agent') || text.includes('ml')) {
      return 'AI & Agents';
    }
    if (text.includes('ui') || text.includes('css') || text.includes('tailwind') || text.includes('design')) {
      return 'UI & Design Systems';
    }
    if (text.includes('starter') || text.includes('template') || text.includes('boilerplate')) {
      return 'Starter Templates';
    }
    return 'Dev Utilities';
  }

  autoFillFromGithub(): void {
    if (!this.slugInput.trim()) return;

    this.isFetchingGithub.set(true);
    this.fetchError.set('');

    this.resourceService.fetchGithubRepoMetadata(this.slugInput).subscribe({
      next: (repo) => {
        this.formState = {
          ...this.formState,
          title: repo.name,
          author: repo.owner?.login || '',
          repoSlug: repo.full_name,
          repoUrl: repo.html_url,
          language: repo.language || 'TypeScript',
          stars: repo.stargazers_count || 0,
          description: repo.description || '',
          installCommand: `git clone ${repo.clone_url}`
        };
        if (Array.isArray(repo.topics) && repo.topics.length > 0) {
          this.tagsInput = repo.topics.slice(0, 4).join(', ');
        }
        this.isFetchingGithub.set(false);
      },
      error: () => {
        this.fetchError.set('Repository not found or rate limit reached.');
        this.isFetchingGithub.set(false);
      }
    });
  }

  submitNewResource(): void {
    if (!this.formState.title.trim()) return;

    const cleanSlug = this.formState.repoSlug || this.slugInput.trim() || 'custom/repo';
    const payload: Omit<GithubResource, 'id'> = {
      ...this.formState,
      repoSlug: cleanSlug,
      repoUrl: this.formState.repoUrl || `https://github.com/${cleanSlug}`,
      tags: this.tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
    };

    this.resourceService.addResource(payload).subscribe(() => {
      this.syncSavedSlugs();
      this.closeAddModal();
    });
  }

  togglePin(resource: GithubResource): void {
    this.resourceService.updateResource({
      ...resource,
      isPinned: !resource.isPinned
    }).subscribe();
  }

  deleteResource(id: string): void {
    this.resourceService.deleteResource(id).subscribe(() => {
      this.syncSavedSlugs();
    });
  }

  copyCommand(command: string, id: string): void {
    navigator.clipboard.writeText(command);
    this.copiedId.set(id);
    setTimeout(() => this.copiedId.set(null), 1800);
  }

  resetFilters(): void {
    this.resourceService.searchQuery.set('');
    this.resourceService.selectedCategory.set('All');
    this.resourceService.selectedStatus.set('All');
  }

  openAddModal(): void {
    this.formState = this.createEmptyForm();
    this.slugInput = '';
    this.tagsInput = '';
    this.fetchError.set('');
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  private createEmptyForm(): Omit<GithubResource, 'id'> {
    return {
      title: '',
      author: '',
      repoSlug: '',
      repoUrl: '',
      category: 'Starter Templates',
      language: 'TypeScript',
      stars: 0,
      status: 'To Explore',
      description: '',
      personalNotes: '',
      installCommand: '',
      tags: [],
      isPinned: false
    };
  }
}