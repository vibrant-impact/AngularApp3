/**
 * Represents a curated GitHub repository or developer tool in the vault.
 */
export interface GithubResource {
  id: string;
  title: string;
  author: string;
  repoSlug: string;
  repoUrl: string;
  category: 'Starter Templates' | 'AI & Agents' | 'UI & Design Systems' | 'Dev Utilities';
  language: string;
  stars: number;
  status: 'To Explore' | 'Active Toolkit' | 'Archived';
  description: string;
  personalNotes: string;
  installCommand: string;
  tags: string[];
  isPinned: boolean;
}