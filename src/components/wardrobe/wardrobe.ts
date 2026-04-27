import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import { ClothingCategory, IWardrobeValidationWarning } from '../../models';
import { ApiError } from '../../services/api.service';

@Component({
  selector: 'app-wardrobe',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  templateUrl: './wardrobe.html',
  styleUrl: './wardrobe.css'
})
export class WardrobeComponent {
  wardrobeService = inject(WardrobeService);
  notificationService = inject(NotificationService);

  isUploading = signal(false);
  isAnalyzing = signal(false);
  newItemImage = signal<string | null>(null);
  validationWarning = signal<IWardrobeValidationWarning | null>(null);
  newItemCategory: ClothingCategory = 'top';
  newItemStyle = '';
  newItemColor = '';
  newItemArticleType = '';

  categories = ['all', 'top', 'bottom', 'dress', 'jumpsuit', 'outerwear', 'shoes', 'accessories'];
  readonly styleOptions = ['Casual', 'Office', 'Sport', 'Elegant', 'Bohemian', 'Streetwear', 'Formal'];
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
      reader.onload = async (e) => {
        const image = e.target?.result as string;
        this.newItemImage.set(image);
        this.validationWarning.set(null);
        this.newItemColor = '';

        this.isAnalyzing.set(true);
        try {
          const analysis = await this.wardrobeService.analyzeItem(image);
          this.validationWarning.set(analysis);
          this.newItemCategory = analysis.suggestedCategory ?? 'top';
          this.newItemArticleType = analysis.suggestedArticleType ?? '';
          this.newItemStyle = this.toDisplayStyle(analysis.suggestedStyle);
          this.newItemColor = analysis.suggestedColor ?? '';
        } catch (error) {
          console.error(error);
          this.notificationService.error('Failed to analyze this item. You can still choose the details manually.');
        } finally {
          this.isAnalyzing.set(false);
        }
      };
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
        style: this.newItemStyle || undefined,
        color: this.newItemColor || undefined,
        overrideValidationWarning: this.validationWarning()?.canOverride ?? false
      });

      this.validationWarning.set(null);
      
      this.isUploading.set(false);
      this.newItemImage.set(null);
      this.newItemArticleType = '';
      this.newItemStyle = '';
      this.newItemColor = '';
      this.notificationService.success('Item added to wardrobe!');
    } catch (e) {
      if (this.isValidationWarningError(e)) {
        this.validationWarning.set(e.data ?? null);
        return;
      }

      console.error(e);
      this.notificationService.error('Failed to save item. Please try again.');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  closeUploadModal() {
    this.isUploading.set(false);
    this.validationWarning.set(null);
    this.newItemArticleType = '';
    this.newItemColor = '';
  }

  async deleteItem(id: string) {
    const confirmed = await this.notificationService.confirm('Are you sure you want to remove this item from your wardrobe?');
    if (confirmed) {
      this.wardrobeService.deleteItem(id);
      this.notificationService.success('Item removed from wardrobe');
    }
  }

  private isValidationWarningError(error: unknown): error is ApiError<IWardrobeValidationWarning> {
    return error instanceof ApiError &&
      error.status === 409 &&
      !!error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      'canOverride' in error.data;
  }

  private toDisplayStyle(style?: string): string {
    if (!style) {
      return '';
    }

    return style.charAt(0).toUpperCase() + style.slice(1);
  }

  displayItemLabel(articleTypeLabel?: string, category?: string | null): string {
    const source = articleTypeLabel || category || '';
    return source
      .split(/[\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
