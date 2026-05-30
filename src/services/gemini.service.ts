import { Injectable, inject } from '@angular/core';
import { Api } from '@/openapi_generated/api';
import { analyzeSeason } from '@/openapi_generated/fn/analysis/analyze-season';
import { generateTryOn } from '@/openapi_generated/fn/try-on/generate-try-on';
import { getLastPhoto } from '@/openapi_generated/fn/try-on/get-last-photo';
import type { SeasonAnalysisResponse } from '@/openapi_generated/models/season-analysis-response';
import type { LastTryOnPhotoDto } from '@/openapi_generated/models/last-try-on-photo-dto';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private api = inject(Api);

  analyzeSeason(imageBase64: string): Promise<SeasonAnalysisResponse> {
    return this.api.invoke(analyzeSeason, { body: { imageBase64 } });
  }

  async generateTryOn(personImageBase64: string, clothingImageBase64: string, clothingImageUrl?: string): Promise<string> {
    const result = await this.api.invoke(generateTryOn, {
      body: { personImageBase64, clothingImageBase64, clothingImageUrl }
    });
    return result.generatedImage ?? '';
  }

  async getLastTryOnPhoto(): Promise<LastTryOnPhotoDto | null> {
    try {
      return await this.api.invoke(getLastPhoto);
    } catch {
      return null;
    }
  }
}
