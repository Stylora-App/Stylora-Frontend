import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface SeasonAnalysisResult {
  season: string;
  subSeason: string;
  description: string;
  recommendedColors: string[];
  bestMetals: string;
}

export interface OutfitSuggestion {
  topId: string;
  bottomId: string;
  shoeId: string;
  reasoning: string;
  styleTip: string;
}

export interface WardrobeItemDto {
  id: string;
  image: string;
  category: string;
  tags: string[];
  color?: string;
  wearCount: number;
  lastWorn?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiService = inject(ApiService);

  async analyzeSeason(imageBase64: string): Promise<SeasonAnalysisResult> {
    return this.apiService.post<SeasonAnalysisResult>('/analysis/season', {
      imageBase64
    });
  }

  async describeClothing(imageBase64: string): Promise<string> {
    // This is now handled on the backend when adding an item
    return '';
  }

  async generateTryOn(personImageBase64: string, clothingImageBase64: string): Promise<string> {
    const result = await this.apiService.post<{ generatedImage: string }>('/tryon/generate', {
      personImageBase64,
      clothingImageBase64
    });
    return result.generatedImage;
  }

  async suggestOutfit(wardrobeItems: WardrobeItemDto[], occasion: string, weather: string): Promise<OutfitSuggestion> {
    return this.apiService.post<OutfitSuggestion>('/outfit/suggest', {
      items: wardrobeItems,
      occasion,
      weather
    });
  }
}