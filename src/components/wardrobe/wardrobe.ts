import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { GeminiService } from '../../services/gemini.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import { ClothingCategory } from '../../models';

@Component({
  selector: 'app-wardrobe',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  templateUrl: './wardrobe.html',
  styleUrl: './wardrobe.css'
})
export class WardrobeComponent {
  wardrobeService = inject(WardrobeService);
  geminiService = inject(GeminiService);
  notificationService = inject(NotificationService);

  isUploading = signal(false);
  isAnalyzing = signal(false);
  newItemImage = signal<string | null>(null);
  newItemCategory: ClothingCategory = 'top';
  newItemOccasion = 'casual';

  categories = ['all', 'top', 'bottom', 'shoes', 'accessory', 'fullbody'];
  selectedCategory = signal('all');

  filteredItems = computed(() => {
    const all = this.wardrobeService.items();
    const cat = this.selectedCategory();
    if (cat === 'all') return all;
    return all.filter(i => i.category === cat);
  });

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.newItemImage.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async saveNewItem() {
    if (!this.newItemImage()) return;
    
    this.isAnalyzing.set(true);
    try {
      await this.wardrobeService.addItem({
        image: this.newItemImage()!,
        category: this.newItemCategory,
        tags: [this.newItemOccasion]
      });
      
      this.isUploading.set(false);
      this.newItemImage.set(null);
      this.notificationService.success('Item added to wardrobe!');
    } catch (e) {
      console.error(e);
      this.notificationService.error('Failed to save item. Please try again.');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async deleteItem(id: string) {
    const confirmed = await this.notificationService.confirm('Are you sure you want to remove this item from your wardrobe?');
    if (confirmed) {
      this.wardrobeService.deleteItem(id);
      this.notificationService.success('Item removed from wardrobe');
    }
  }
}
