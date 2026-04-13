import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthComponent } from './components/auth/auth';
import { IconComponent } from './components/ui/icons';
import { NotificationComponent } from './components/ui/notification/notification';
import { AuthService } from './services/auth.service';
import { WardrobeService } from './services/wardrobe.service';

type View = 'dashboard' | 'wardrobe' | 'analysis' | 'tryon' | 'profile' | 'explore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AuthComponent, IconComponent, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  
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
    
    if (palette.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    if (palette.length === 1) {
      return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[0]} 100%)`;
    }
    
    const stops = palette.slice(0, 3).map((color, index, arr) => {
      const position = (index / (arr.length - 1)) * 100;
      return `${color} ${position}%`;
    }).join(', ');
    
    return `linear-gradient(135deg, ${stops})`;
  });

  // Conic gradient aura from palette colors (null when no palette exists)
  paletteAuraGradient = computed(() => {
    const palette = this.wardrobeService.userProfile().palette || [];
    if (palette.length === 0) return null;
    const colors = palette.length === 1 ? [palette[0], palette[0], palette[0]] : palette.slice(0, 6);
    return `conic-gradient(${[...colors, colors[0]].join(', ')})`;
  });

  ngOnInit() {
    // Set up callback to load wardrobe data when auth changes
    this.authService.setOnAuthChangeCallback(() => {
      this.wardrobeService.initializeData();
    });

    // Sync currentView signal with router URL
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const path = e.urlAfterRedirects.replace(/^#?\//, '').split('?')[0];
      const viewMap: Record<string, View> = {
        dashboard: 'dashboard', wardrobe: 'wardrobe', analysis: 'analysis',
        tryon: 'tryon', profile: 'profile', explore: 'explore',
      };
      if (viewMap[path]) this.currentView.set(viewMap[path]);
    });
  }

  navigate(view: View) {
    this.router.navigate([`/${view}`]);
    this.isMenuOpen.set(false);
  }

  onAuthenticated() {
    // Load wardrobe data after login
    this.wardrobeService.initializeData();
    this.router.navigate(['/dashboard']);
  }

  async logout() {
    await this.authService.logout();
    this.wardrobeService.clearData();
    this.isMenuOpen.set(false);
  }
}
