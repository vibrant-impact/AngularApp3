import { Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ResourceService } from '../../services/resource.service';
import { GithubResource } from '../../models/githubResource.model';

/**
 * Detail view (/resources/:id).
 * Uses signal route parameter binding to fetch a single resource,
 * copy CLI commands, and update personal notes or workflow status.
 */
@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './resource-detail.component.html',
  styleUrl: './resource-detail.component.css'
})
export class ResourceDetailComponent {
  private readonly resourceService = inject(ResourceService);
  private readonly router = inject(Router);

  // Route parameter ':id' automatically bound as a signal input
  readonly id = input.required<string>();

  // Local state signals
  readonly resource = this.resourceService.selectedResource;
  readonly isLoading = signal<boolean>(true);
  readonly copied = signal<boolean>(false);
  readonly saveMessage = signal<string>('');
  readonly editableNotes = signal<string>('');
  readonly editableStatus = signal<GithubResource['status']>('To Explore');

  constructor() {
    // Automatically fetches the resource whenever the route ID signal changes
    effect(() => {
      const resourceId = this.id();
      this.isLoading.set(true);
      this.resourceService.getResourceById(resourceId).subscribe({
        next: (item) => {
          this.editableNotes.set(item.personalNotes);
          this.editableStatus.set(item.status);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    });
  }

  /**
   * Persists updated notes and status to the backend via HTTP PUT.
   */
  saveChanges(current: GithubResource): void {
    const updated: GithubResource = {
      ...current,
      personalNotes: this.editableNotes(),
      status: this.editableStatus()
    };

    this.resourceService.updateResource(updated).subscribe(() => {
      this.saveMessage.set('✓ Saved to Vault');
      setTimeout(() => this.saveMessage.set(''), 2200);
    });
  }

  /**
   * Toggles the pinned status of the current resource.
   */
  togglePin(current: GithubResource): void {
    this.resourceService.updateResource({
      ...current,
      isPinned: !current.isPinned
    }).subscribe();
  }

  /**
   * Copies the setup/clone command to the clipboard with temporary signal feedback.
   */
  copyCli(command: string): void {
    navigator.clipboard.writeText(command);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }

  /**
   * Deletes the current resource and redirects back to /resources.
   */
  deleteAndReturn(id: string): void {
    this.resourceService.deleteResource(id).subscribe(() => {
      this.router.navigate(['/resources']);
    });
  }
}