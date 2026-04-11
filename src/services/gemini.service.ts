import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ISeasonAnalysisResult, ITryOnResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiService = inject(ApiService);

  async analyzeSeason(imageBase64: string): Promise<ISeasonAnalysisResult> {
    return this.apiService.post<ISeasonAnalysisResult>('/analysis/season', {
      imageBase64
    });
  }

  async generateTryOn(personImageBase64: string, clothingImageBase64: string): Promise<string> {
    const result = await this.apiService.post<ITryOnResponse>('/tryon/generate', {
      personImageBase64,
      clothingImageBase64
    });
    return result.generatedImage;
  }
}