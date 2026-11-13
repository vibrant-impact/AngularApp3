import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap, map, tap, catchError } from 'rxjs';
import { GithubResource } from '../models/githubResource.model';

/**
 * Interface representing a live search result item from GitHub's public API.
 */
export interface GithubSearchResult {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  created_at: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

/**
 * Manages CRUD operations via HttpClient and exposes reactive application state
 * using Angular Signals, Computed Signals, and Effects.
 */
@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'api/resources';
  private readonly storageKey = 'githubVaultResources';

  // Primary writable signal holding the master resource collection
  private readonly resourcesSignal = signal<GithubResource[]>([]);
  readonly resources = this.resourcesSignal.asReadonly();

  // Tracks the currently active resource in the detail view
  readonly selectedResource = signal<GithubResource | null>(null);

  // User filter & search preference signals
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('All');
  readonly selectedStatus = signal<string>('All');

  // Derived signal for pinned quick-launch items
  readonly pinnedResources = computed(() =>
    this.resources().filter(item => item.isPinned)
  );

  // Derived signal combining search text, category, and status filters
  readonly filteredResources = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const status = this.selectedStatus();

    return this.resources().filter(item => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.repoSlug.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesCategory = category === 'All' || item.category === category;
      const matchesStatus = status === 'All' || item.status === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  });

  // Tracks whether initial data has been fetched from the backend
  private hasLoadedInitial = false;

  constructor() {
    // Syncs any state changes back to localStorage automatically
    effect(() => {
      const currentList = this.resources();
      if (this.hasLoadedInitial) {
        localStorage.setItem(this.storageKey, JSON.stringify(currentList));
      }
    });
  }

  /**
   * READ ALL: Fetches all resources from the simulated backend.
   */
  loadResources(): Observable<GithubResource[]> {
    return this.http.get<GithubResource[]>(this.apiUrl).pipe(
      tap(data => {
        this.hasLoadedInitial = true;
        this.resourcesSignal.set(data);
      })
    );
  }

  /**
   * READ ONE: Fetches a single resource by ID and updates selectedResource signal.
   */
  getResourceById(id: string): Observable<GithubResource> {
    return this.http.get<GithubResource>(`${this.apiUrl}/${id}`).pipe(
      tap(item => this.selectedResource.set(item))
    );
  }

  /**
   * CREATE: Persists a new GitHub resource and appends it to the signal store.
   */
  addResource(newResource: Omit<GithubResource, 'id'>): Observable<GithubResource> {
    return this.http.post<GithubResource>(this.apiUrl, newResource).pipe(
      tap(created => this.resourcesSignal.update(list => [...list, created]))
    );
  }

  /**
   * UPDATE: Updates an existing resource (notes, pin state, status) in backend & signal store.
   */
  updateResource(updatedResource: GithubResource): Observable<GithubResource> {
    return this.http.put<GithubResource>(`${this.apiUrl}/${updatedResource.id}`, updatedResource).pipe(
      tap(() => {
        this.resourcesSignal.update(list =>
          list.map(item => (item.id === updatedResource.id ? updatedResource : item))
        );
        if (this.selectedResource()?.id === updatedResource.id) {
          this.selectedResource.set(updatedResource);
        }
      })
    );
  }

  /**
   * DELETE: Removes a resource by ID from backend & signal store.
   */
  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.resourcesSignal.update(list => list.filter(item => item.id !== id));
        if (this.selectedResource()?.id === id) {
          this.selectedResource.set(null);
        }
      })
    );
  }

  // Signal storing live search results returned from api.github.com
  readonly liveGithubResults = signal<GithubSearchResult[]>([]);

  /**
   * LIVE GITHUB SEARCH: Searches GitHub repositories by keyword, author/person name,
   * programming language, minimum updated date, and sort order.
   */
  searchGithubRepositories(options: {
    query: string;
    language?: string;
    updatedAfter?: string; // Format: YYYY-MM-DD
    sortBy?: 'stars' | 'updated' | 'best-match';
  }): Observable<GithubSearchResult[]> {
    const rawQuery = options.query.trim();
    if (!rawQuery && !options.language) {
      this.liveGithubResults.set([]);
      return of([]);
    }

    // Step 1: Check if the query matches a GitHub user's real name (e.g., "Kadeem Cherman")
    const userLookup$ = rawQuery
      ? this.http
          .get<{ items: { login: string }[] }>(
            `https://api.github.com/search/users?q=${encodeURIComponent(rawQuery)}&per_page=2`
          )
          .pipe(
            map(res => res.items?.map(u => u.login) || []),
            catchError(() => of([]))
          )
      : of([]);

    // Step 2: Build the repository search query combining user matches, keywords, language, and date
    return userLookup$.pipe(
      switchMap(matchedLogins => {
        const queryParts: string[] = [];

        if (matchedLogins.length > 0 && rawQuery.includes(' ')) {
          // If searching a full name like "Kadeem Cherman", fetch repos owned by matching user(s)
          matchedLogins.forEach(login => queryParts.push(`user:${login}`));
        } else if (rawQuery) {
          queryParts.push(rawQuery);
        }

        if (options.language && options.language !== 'All') {
          queryParts.push(`language:${options.language}`);
        }

        if (options.updatedAfter) {
          queryParts.push(`pushed:>=${options.updatedAfter}`);
        }

        let params = new HttpParams()
          .set('q', queryParts.join(' '))
          .set('per_page', '12');

        if (options.sortBy && options.sortBy !== 'best-match') {
          params = params.set('sort', options.sortBy).set('order', 'desc');
        }

        return this.http
          .get<{ items: GithubSearchResult[] }>('https://api.github.com/search/repositories', { params })
          .pipe(
            map(res => res.items || []),
            tap(items => this.liveGithubResults.set(items))
          );
      })
    );
  }

  /**
   * EXTERNAL API: Queries public GitHub REST API to auto-fill repo metadata.
   */
  fetchGithubRepoMetadata(repoSlug: string): Observable<any> {
    const cleanSlug = repoSlug.replace('https://github.com/', '').replace(/\/$/, '').trim();
    return this.http.get<any>(`https://api.github.com/repos/${cleanSlug}`);
  }
}