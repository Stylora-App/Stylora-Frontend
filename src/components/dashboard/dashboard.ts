import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WardrobeService } from '../../services/wardrobe.service';
import { GeminiService } from '../../services/gemini.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../ui/icons';
import { IOutfitSuggestion, IWardrobeItem } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  wardrobeService = inject(WardrobeService);
  authService = inject(AuthService);
  geminiService = inject(GeminiService);
  
  currentDate = new Date();
  suggestion = signal<IOutfitSuggestion | null>(null);
  loadingSuggestion = signal(false);

  ngOnInit() {
    if (this.wardrobeService.items().length > 0) {
      this.generateSuggestion();
    }
  }

  getSuggestedItem(type: string): IWardrobeItem | null {
    if (!this.suggestion()) return null;
    const suggestion = this.suggestion()!;
    const id = type === 'top' ? suggestion.topId : 
               type === 'bottom' ? suggestion.bottomId : 
               suggestion.shoeId;
    return this.wardrobeService.items().find(i => i.id === id) ?? null;
  }

  mostWornItem = computed(() => {
    const items = this.wardrobeService.items();
    if (items.length === 0) return null;
    return [...items].sort((a, b) => b.wearCount - a.wearCount)[0];
  });

  async generateSuggestion() {
    if (this.wardrobeService.items().length < 2) return;
    
    this.loadingSuggestion.set(true);
    try {
      const itemsDto = this.wardrobeService.items().map(item => ({
        id: item.id,
        image: item.image,
        category: item.category,
        tags: item.tags,
        color: item.color,
        wearCount: item.wearCount,
        lastWorn: item.lastWorn,
        description: item.description
      }));
      
      const result = await this.geminiService.suggestOutfit(
        itemsDto,
        'office',
        'sunny'
      );
      this.suggestion.set(result);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingSuggestion.set(false);
    }
  }

  wearOutfit() {
    const suggestion = this.suggestion();
    if (!suggestion) return;
    const ids = [suggestion.topId, suggestion.bottomId, suggestion.shoeId].filter(Boolean);
    ids.forEach(id => this.wardrobeService.logWear(id));
    alert('Outfit logged! Great choice.');
  }
}
