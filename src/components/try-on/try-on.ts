import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { WardrobeService } from '../../services/wardrobe.service';
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
export class TryOnComponent {
  wardrobeService = inject(WardrobeService);
  geminiService = inject(GeminiService);
  notificationService = inject(NotificationService);

  selectedItem = signal<IWardrobeItem | null>(null);
  userPhoto = signal<string | null>(null);
  originalPhoto = signal<string | null>(null);
  tempItem = signal<IWardrobeItem | null>(null);
  
  isGenerating = signal(false);
  generatedImage = signal<string | null>(null);

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

  async generate() {
    if (!this.selectedItem() || !this.userPhoto()) return;

    this.isGenerating.set(true);
    try {
      const item = this.selectedItem()!;
      // Use the current displayed image (generated or original)
      const currentImage = this.generatedImage() || this.userPhoto()!;
      const personImage = currentImage.split(',')[1];
      const clothingImage = item.image.split(',')[1];

      const result = await this.geminiService.generateTryOn(personImage, clothingImage);
      this.generatedImage.set(result);
      this.userPhoto.set(result); // Update userPhoto to the generated result
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
