import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard';
import { WardrobeComponent } from './components/wardrobe/wardrobe';
import { AnalysisComponent } from './components/analysis/analysis';
import { TryOnComponent } from './components/try-on/try-on';
import { ProfileComponent } from './components/profile/profile';
import { AuthComponent } from './components/auth/auth';
import { IconComponent } from './components/ui/icons';
import { AuthService } from './services/auth.service';
import { WardrobeService } from './services/wardrobe.service';

type View = 'dashboard' | 'wardrobe' | 'analysis' | 'tryon' | 'profile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, WardrobeComponent, AnalysisComponent, TryOnComponent, ProfileComponent, AuthComponent, IconComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  wardrobeService = inject(WardrobeService);
  
  currentView = signal<View>('dashboard');
  
  // Mobile menu state
  isMenuOpen = signal(false);

  ngOnInit() {
    // Set up callback to load wardrobe data when auth changes
    this.authService.setOnAuthChangeCallback(() => {
      this.wardrobeService.initializeData();
    });
  }

  navigate(view: View) {
    this.currentView.set(view);
    this.isMenuOpen.set(false);
  }

  onAuthenticated() {
    // Load wardrobe data after login
    this.wardrobeService.initializeData();
    this.currentView.set('dashboard');
  }

  async logout() {
    await this.authService.logout();
    this.wardrobeService.clearData();
    this.isMenuOpen.set(false);
  }
}
