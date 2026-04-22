import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  previewImage = signal<string | null>(null);
  isLoading = signal(false);
  analysisResult = signal<ISeasonAnalysisResult | null>(null);

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
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error
        ? e.message
        : 'Analysis failed. Please try a different photo.';
      this.notificationService.error(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveProfile() {
    const result = this.analysisResult();
    if (result) {
      await this.wardrobeService.saveAnalysis(result);
      this.router.navigate(['/profile']);
    }
  }
}
