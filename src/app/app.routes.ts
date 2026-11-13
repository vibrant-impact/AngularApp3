import { Routes } from '@angular/router';
import { ResourceListComponent } from './pages/resource-list/resource-list.component';
import { ResourceDetailComponent } from './pages/resource-detail/resource-detail.component';

/**
 * Application route configuration mapping root, list, and parameterized detail views.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'resources', pathMatch: 'full' },
  { path: 'resources', component: ResourceListComponent, title: 'GitHub Vault — Resources' },
  { path: 'resources/:id', component: ResourceDetailComponent, title: 'GitHub Vault — Details' },
  { path: '**', redirectTo: 'resources' }
];