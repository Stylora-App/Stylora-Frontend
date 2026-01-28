import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { WardrobeComponent } from './components/wardrobe/wardrobe.component';
import { AnalysisComponent } from './components/analysis/analysis.component';
import { TryOnComponent } from './components/try-on/try-on.component';
import { IconComponent } from './components/ui/icons.component';

type View = 'dashboard' | 'wardrobe' | 'analysis' | 'tryon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, WardrobeComponent, AnalysisComponent, TryOnComponent, IconComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  currentView = signal<View>('dashboard');
  
  // Mobile menu state
  isMenuOpen = signal(false);

  navigate(view: View) {
    this.currentView.set(view);
    this.isMenuOpen.set(false);
  }
}