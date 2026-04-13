import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { TryOnStateService } from '../../services/try-on-state.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import { IWardrobeItem } from '../../models';

@Component({
  selector: 'app-try-on',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './try-on.html',
  styleUrl: './try-on.css'
})
export class TryOnComponent implements OnInit {
  wardrobeService = inject(WardrobeService);
  geminiService = inject(GeminiService);
  notificationService = inject(NotificationService);
  tryOnStateService = inject(TryOnStateService);

  selectedItem = signal<IWardrobeItem | null>(null);
  userPhoto = signal<string | null>(null);
  originalPhoto = signal<string | null>(null);
  tempItem = signal<IWardrobeItem | null>(null);

  isGenerating = signal(false);
  isLoadingPhoto = signal(false);
  generatedImage = signal<string | null>(null);

  async ngOnInit() {
    const pending = this.tryOnStateService.pendingProduct();
    if (pending) {
      const tempItem: IWardrobeItem = {
        id: 'explore_' + pending.id,
        image: pending.imageUrl,       
        category: 'top',
        wornCount: 0,
        name: pending.name,
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
    } catch {

    } finally {
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
      reader.onload = (e) => {
        const newItem: IWardrobeItem = {
          id: 'temp_' + Date.now(),
          image: e.target?.result as string,
          category: 'top',
          wornCount: 0
        };
        this.tempItem.set(newItem);
        this.selectedItem.set(newItem);
        (event.target as HTMLInputElement).value = '';
      };
      reader.readAsDataURL(file);
    }
  }

  selectItem(item: IWardrobeItem) {
    if (this.selectedItem()?.id === item.id) {
      this.selectedItem.set(null);
    } else {
      this.selectedItem.set(item);
    }
  }

  /** Returns true when the item image is an HTTP(S) URL rather than a data URI. */
  private isUrl(image: string): boolean {
    return /^https?:\/\//i.test(image) || image.startsWith('//');
  }

  async generate() {
    if (!this.selectedItem() || !this.userPhoto()) return;

    this.isGenerating.set(true);
    try {
      const item = this.selectedItem()!;
      const currentImage = this.generatedImage() || this.userPhoto()!;
      const personBase64 = currentImage.split(',')[1] ?? currentImage;

      let clothingBase64 = '';
      let clothingUrl: string | undefined;

      if (this.isUrl(item.image)) {
        // ASOS/external URL – let the backend fetch it
        clothingUrl = item.image;
      } else {
        clothingBase64 = item.image.split(',')[1] ?? item.image;
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
}
