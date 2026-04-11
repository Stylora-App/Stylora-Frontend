import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WardrobeService } from '../../services/wardrobe.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../ui/icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  wardrobeService = inject(WardrobeService);
  authService = inject(AuthService);

  mostWornItem = computed(() => {
    const items = this.wardrobeService.items();
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.wornCount - a.wornCount)[0];
  });

  recentItems = computed(() =>
    [...this.wardrobeService.items()]
      .sort((a, b) => b.wornCount - a.wornCount)
      .slice(0, 6)
  );
}
