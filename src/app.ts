import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard';
import { WardrobeComponent } from './components/wardrobe/wardrobe';
import { AnalysisComponent } from './components/analysis/analysis';
import { TryOnComponent } from './components/try-on/try-on';
import { ProfileComponent } from './components/profile/profile';
import { AuthComponent } from './components/auth/auth';
import { IconComponent } from './components/ui/icons';
import { NotificationComponent } from './components/ui/notification/notification';
import { AuthService } from './services/auth.service';
import { WardrobeService } from './services/wardrobe.service';

type View = 'dashboard' | 'wardrobe' | 'analysis' | 'tryon' | 'profile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, WardrobeComponent, AnalysisComponent, TryOnComponent, ProfileComponent, AuthComponent, IconComponent, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  wardrobeService = inject(WardrobeService);
  
  currentView = signal<View>('dashboard');
  
  // Mobile menu state
  isMenuOpen = signal(false);

  // User profile data for avatar - direct reference to service signal
  get userProfile() {
    return this.wardrobeService.userProfile;
  }
  
  // Generate CSS gradient from palette colors for the avatar background
  sidebarAvatarGradient = computed(() => {
    const palette = this.wardrobeService.userProfile().palette || [];
    
    // Default gradient if no palette
    if (palette.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    if (palette.length === 1) {
      return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[0]} 100%)`;
    }
    
    // Create a diagonal gradient from palette colors
    const stops = palette.slice(0, 3).map((color, index, arr) => {
      const position = (index / (arr.length - 1)) * 100;
      return `${color} ${position}%`;
    }).join(', ');
    
    return `linear-gradient(135deg, ${stops})`;
  });

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
