import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { WardrobeComponent } from './components/wardrobe/wardrobe';
import { AnalysisComponent } from './components/analysis/analysis';
import { TryOnComponent } from './components/try-on/try-on';
import { ProfileComponent } from './components/profile/profile';
import { ExploreComponent } from './components/explore/explore';

export const routes: Routes = [
  { path: '',           redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',  component: DashboardComponent },
  { path: 'wardrobe',   component: WardrobeComponent },
  { path: 'tryon',      component: TryOnComponent },
  { path: 'analysis',   component: AnalysisComponent },
  { path: 'explore',    component: ExploreComponent },
  { path: 'profile',    component: ProfileComponent },
  { path: '**',         redirectTo: 'dashboard' },
];
