import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { WardrobeComponent } from './components/wardrobe/wardrobe';
import { AnalysisComponent } from './components/analysis/analysis';
import { TryOnComponent } from './components/try-on/try-on';
import { ProfileComponent } from './components/profile/profile';
import { ExploreComponent } from './components/explore/explore';
import { AuthComponent } from './components/auth/auth';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',         redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login',    component: AuthComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'wardrobe',  component: WardrobeComponent,  canActivate: [authGuard] },
  { path: 'tryon',     component: TryOnComponent,     canActivate: [authGuard] },
  { path: 'analysis',  component: AnalysisComponent,  canActivate: [authGuard] },
  { path: 'explore',   component: ExploreComponent,   canActivate: [authGuard] },
  { path: 'profile',   component: ProfileComponent,   canActivate: [authGuard] },
  { path: '**',        redirectTo: 'dashboard' },
];
