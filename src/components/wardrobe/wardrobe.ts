import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import {
  ClothingCategory,
  IWardrobeValidationWarning
} from '../../models';
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
  isSelectionMode = signal(false);
  newItemImage = signal<string | null>(null);
  validationWarning = signal<IWardrobeValidationWarning | null>(null);
  selectedItemIds = signal<Set<string>>(new Set());
  newItemCategory: ClothingCategory = 'top';
  newItemAudienceTag = '';
  newItemStyle = '';
  newItemColor = '';
  newItemArticleType = '';

  categories = ['all', 'top', 'bottom', 'dress', 'jumpsuit', 'outerwear', 'shoes', 'accessories'];
  readonly styleOptions = ['Casual', 'Office', 'Sport', 'Elegant', 'Bohemian', 'Streetwear', 'Formal'];
  readonly audienceTagOptions = ['women', 'men', 'unisex'];
  selectedCategory = signal('all');

  filteredItems = computed(() => {
    const all = this.wardrobeService.items();
    const cat = this.selectedCategory();
    if (cat === 'all') return all;
    return all.filter(i => i.category === cat);
  });

  hasWardrobeItems = computed(() => this.wardrobeService.items().length > 0);

  hasFilteredItems = computed(() => this.filteredItems().length > 0);

  areAllFilteredItemsSelected = computed(() => {
    const visibleItems = this.filteredItems();
    if (visibleItems.length === 0) {
      return false;
    }

    const selectedIds = this.selectedItemIds();
    return visibleItems.every(item => selectedIds.has(item.id));
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
          this.newItemAudienceTag = analysis.suggestedGender ?? '';
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
        articleTypeLabel: this.newItemArticleType || undefined,
        audienceTag: this.newItemAudienceTag || undefined,
        style: this.newItemStyle || undefined,
        color: this.newItemColor || undefined,
        overrideValidationWarning: this.validationWarning()?.canOverride ?? false
      });

      this.resetUploadState(true);
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
    this.resetUploadState(true);
  }

  async deleteItem(id: string) {
    const confirmed = await this.notificationService.confirm('Are you sure you want to remove this item from your wardrobe?');
    if (confirmed) {
      this.wardrobeService.deleteItem(id);
      this.notificationService.success('Item removed from wardrobe');
    }
  }

  toggleSelectionMode() {
    const next = !this.isSelectionMode();
    this.isSelectionMode.set(next);
    if (!next) {
      this.selectedItemIds.set(new Set());
    }
  }

  toggleItemSelection(id: string) {
    this.selectedItemIds.update(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  isItemSelected(id: string): boolean {
    return this.selectedItemIds().has(id);
  }

  toggleSelectAllFilteredItems() {
    const visibleIds = this.filteredItems().map(item => item.id);
    if (visibleIds.length === 0) {
      return;
    }

    this.selectedItemIds.update(current => {
      const next = new Set(current);

      if (visibleIds.every(id => next.has(id))) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }

      return next;
    });
  }

  async deleteSelectedItems() {
    const itemIds = Array.from(this.selectedItemIds());
    if (itemIds.length === 0) {
      return;
    }

    const confirmed = await this.notificationService.confirm(`Delete ${itemIds.length} selected item${itemIds.length === 1 ? '' : 's'}?`);
    if (!confirmed) {
      return;
    }

    try {
      await this.wardrobeService.deleteItems(itemIds);
      this.selectedItemIds.set(new Set());
      this.isSelectionMode.set(false);
      this.notificationService.success(`Removed ${itemIds.length} item${itemIds.length === 1 ? '' : 's'} from wardrobe`);
    } catch (error) {
      console.error(error);
      this.notificationService.error('Failed to remove the selected items. Please try again.');
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

  private resetUploadState(closeModal: boolean) {
    if (closeModal) {
      this.isUploading.set(false);
    }
    this.newItemImage.set(null);
    this.validationWarning.set(null);
    this.newItemCategory = 'top';
    this.newItemArticleType = '';
    this.newItemAudienceTag = '';
    this.newItemStyle = '';
    this.newItemColor = '';
  }
}
