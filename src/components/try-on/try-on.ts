import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeminiService } from '../../services/gemini.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { TryOnStateService } from '../../services/try-on-state.service';
import { ExploreStateService } from '../../services/explore-state.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import type { WardrobeItemDto } from '@/openapi_generated/models/wardrobe-item-dto';

/** WardrobeItemDto extended with a display name for try-on items. */
type TryOnItem = WardrobeItemDto & { name?: string };

@Component({
  selector: 'app-try-on',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './try-on.html',
  styleUrl: './try-on.css'
})
export class TryOnComponent implements OnInit {
  wardrobeService      = inject(WardrobeService);
  geminiService        = inject(GeminiService);
  notificationService  = inject(NotificationService);
  tryOnStateService    = inject(TryOnStateService);
  exploreStateService  = inject(ExploreStateService);
  private router       = inject(Router);

  selectedItem     = signal<TryOnItem | null>(null);
  userPhoto        = signal<string | null>(null);
  originalPhoto    = signal<string | null>(null);
  tempItem         = signal<TryOnItem | null>(null);

  isGenerating          = signal(false);
  isLoadingPhoto        = signal(false);
  isAnalyzingClothing   = signal(false);
  generatedImage        = signal<string | null>(null);

  get showBackToExplore(): boolean { return this.exploreStateService.cameFromExplore(); }

  async ngOnInit() {
    const pending = this.tryOnStateService.pendingProduct();
    if (pending) {
      const tempItem: TryOnItem = {
        id:    'explore_' + (pending.id ?? ''),
        image: pending.imageUrl ?? '',
        category: 'top',
        name:  pending.name,
      };
      this.tempItem.set(tempItem);
      this.selectedItem.set(tempItem);
      this.tryOnStateService.pendingProduct.set(null);
    }

    this.isLoadingPhoto.set(true);
    try {
      const last = await this.geminiService.getLastTryOnPhoto();
      if (last?.personImageBase64) {
        const photo = last.personImageBase64.startsWith('data:')
          ? last.personImageBase64
          : `data:image/jpeg;base64,${last.personImageBase64}`;
        this.userPhoto.set(photo);
        this.originalPhoto.set(photo);
      }
    } catch { /* no previous photo */ } finally {
      this.isLoadingPhoto.set(false);
    }
  }

  onUserPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        this.userPhoto.set(photoData);
        this.originalPhoto.set(photoData);
        this.generatedImage.set(null);
      };
      reader.readAsDataURL(file);
    }
  }

  onClothingUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const image = e.target?.result as string;
        const newItem: TryOnItem = { id: 'temp_' + Date.now(), image, category: 'top' };

        this.isAnalyzingClothing.set(true);
        try {
          const analysis = await this.wardrobeService.analyzeItem(image);
          newItem.category         = analysis.suggestedCategory ?? 'top';
          newItem.articleTypeLabel = analysis.suggestedArticleType;
          newItem.audienceTag      = analysis.suggestedGender;
          newItem.color            = analysis.suggestedColor;
          newItem.outfitRole       = analysis.suggestedOutfitRole;
          newItem.style            = analysis.suggestedStyle;
          newItem.name             = [analysis.suggestedColor, analysis.suggestedArticleType ?? analysis.suggestedCategory]
            .filter(Boolean).join(' ') || undefined;
        } catch (error) {
          console.error(error);
          this.notificationService.error('We could not analyze the uploaded item, so it will be used as a generic top for now.');
        } finally {
          this.isAnalyzingClothing.set(false);
        }

        this.tempItem.set(newItem);
        this.selectedItem.set(newItem);
        (event.target as HTMLInputElement).value = '';
      };
      reader.readAsDataURL(file);
    }
  }

  selectItem(item: TryOnItem) {
    this.selectedItem.set(this.selectedItem()?.id === item.id ? null : item);
  }

  private isUrl(image: string): boolean {
    return /^https?:\/\//i.test(image) || image.startsWith('//');
  }

  async generate() {
    if (!this.selectedItem() || !this.userPhoto()) return;
    this.isGenerating.set(true);
    try {
      const item           = this.selectedItem()!;
      const currentImage   = this.generatedImage() || this.userPhoto()!;
      const personBase64   = currentImage.split(',')[1] ?? currentImage;

      let clothingBase64 = '';
      let clothingUrl: string | undefined;

      if (this.isUrl(item.image ?? '')) {
        clothingUrl = item.image;
      } else {
        clothingBase64 = (item.image ?? '').split(',')[1] ?? (item.image ?? '');
      }

      const result = await this.geminiService.generateTryOn(personBase64, clothingBase64, clothingUrl);
      this.generatedImage.set(result);
      this.userPhoto.set(result);
    } catch (e) {
      console.error(e);
      this.notificationService.error('Generation failed. Please ensure your API key is valid and try again.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  revertToOriginal() {
    this.userPhoto.set(this.originalPhoto());
    this.generatedImage.set(null);
  }

  goBackToExplore() {
    this.exploreStateService.cameFromExplore.set(false);
    this.router.navigate(['/explore']);
  }
}
