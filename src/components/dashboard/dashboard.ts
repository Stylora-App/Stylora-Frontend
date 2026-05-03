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

  topCategory = computed(() => {
    const items = this.wardrobeService.items();
    if (items.length === 0) {
      return null;
    }

    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }

    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  });

  recentItems = computed(() =>
    this.wardrobeService.items().slice(0, 6)
  );
}
