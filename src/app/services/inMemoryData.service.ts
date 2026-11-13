import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import { GithubResource } from '../models/githubResource.model';

/**
 * Simulated REST backend using Angular In-Memory Web API.
 * Hydrates initial records from localStorage so user edits survive Safari reloads.
 */
@Injectable({
  providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService {
  private readonly storageKey = 'githubVaultResources';

  /**
   * Builds the initial in-memory database collection at startup.
   */
  createDb(): { resources: GithubResource[] } {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      return { resources: JSON.parse(savedData) };
    }

    const defaultResources: GithubResource[] = [
      {
        id: '1',
        title: 'AnalogJS — Full-Stack Angular Meta-Framework',
        author: 'analogjs',
        repoSlug: 'analogjs/analog',
        repoUrl: 'https://github.com/analogjs/analog',
        category: 'Starter Templates',
        language: 'TypeScript',
        stars: 3400,
        status: 'Active Toolkit',
        description: 'The fullstack Angular meta-framework powered by Vite, file-based routing, and server-side API routes.',
        personalNotes: 'Use for fast Vite + Angular builds and file-based routing reference.',
        installCommand: 'npm create analog@latest',
        tags: ['Angular', 'Vite', 'SSR'],
        isPinned: true
      },
      {
        id: '2',
        title: 'Spartan UI — Shadcn Primitives for Angular',
        author: 'goetzrobin',
        repoSlug: 'goetzrobin/spartan',
        repoUrl: 'https://github.com/goetzrobin/spartan',
        category: 'UI & Design Systems',
        language: 'TypeScript',
        stars: 2800,
        status: 'To Explore',
        description: 'Accessible, unstyled UI primitives and Tailwind components built specifically for modern Angular signals.',
        personalNotes: 'Check brain/helm architecture for custom dark-mode components.',
        installCommand: 'ng g @spartan-ng/cli:ui',
        tags: ['UI', 'Signals', 'Tailwind'],
        isPinned: true
      },
      {
        id: '3',
        title: 'LangChain.js — AI Agent Orchestration',
        author: 'langchain-ai',
        repoSlug: 'langchain-ai/langchainjs',
        repoUrl: 'https://github.com/langchain-ai/langchainjs',
        category: 'AI & Agents',
        language: 'TypeScript',
        stars: 13500,
        status: 'Active Toolkit',
        description: 'Framework for building context-aware reasoning applications, tool-calling agents, and RAG pipelines.',
        personalNotes: 'Use structured output parsers when connecting to REST endpoints.',
        installCommand: 'npm install @langchain/core langchain',
        tags: ['AI', 'Agents', 'LLM'],
        isPinned: false
      },
      {
        id: '4',
        title: 'NgRx Signals — Reactive State Management',
        author: 'ngrx',
        repoSlug: 'ngrx/platform',
        repoUrl: 'https://github.com/ngrx/platform',
        category: 'Dev Utilities',
        language: 'TypeScript',
        stars: 8200,
        status: 'To Explore',
        description: 'Lightweight, standalone signalStore utilities for scalable enterprise Angular state.',
        personalNotes: 'Compare signalStore patterns against native service signals.',
        installCommand: 'ng add @ngrx/signals@latest',
        tags: ['Signals', 'State', 'Angular'],
        isPinned: false
      }
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(defaultResources));
    return { resources: defaultResources };
  }

  /**
   * Generates sequential string IDs for newly created resources.
   */
  genId(resources: GithubResource[]): string {
    return resources.length > 0
      ? String(Math.max(...resources.map(r => Number(r.id) || 0)) + 1)
      : '1';
  }
}