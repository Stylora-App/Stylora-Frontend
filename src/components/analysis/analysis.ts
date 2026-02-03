import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { NotificationService } from '../../services/notification.service';
import { IconComponent } from '../ui/icons';
import { ISeasonAnalysisResult } from '../../models';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './analysis.html',
  styleUrl: './analysis.css'
})
export class AnalysisComponent {
  geminiService = inject(GeminiService);
  wardrobeService = inject(WardrobeService);
  notificationService = inject(NotificationService);

  previewImage = signal<string | null>(null);
  isLoading = signal(false);
  analysisResult = signal<ISeasonAnalysisResult | null>(null);
  
  // Event to notify parent to navigate to profile
  navigateToProfile = output<void>();

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewImage.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async analyze() {
    if (!this.previewImage()) return;
    this.isLoading.set(true);
    try {
      const result = await this.geminiService.analyzeSeason(this.previewImage()!.split(',')[1]);
      this.analysisResult.set(result);
    } catch (e) {
      console.error(e);
      this.notificationService.error('Analysis failed. Please try a different photo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveProfile() {
    const result = this.analysisResult();
    if (result) {
      await this.wardrobeService.updateProfile({
        season: result.season,
        subSeason: result.subSeason,
        palette: result.recommendedColors
      });
      this.navigateToProfile.emit();
    }
  }
}
