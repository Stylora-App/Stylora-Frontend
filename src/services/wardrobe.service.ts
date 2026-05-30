import { Injectable, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '@/openapi_generated/api';
import { getItems } from '@/openapi_generated/fn/wardrobe/get-items';
import { addItem } from '@/openapi_generated/fn/wardrobe/add-item';
import { analyzeItem } from '@/openapi_generated/fn/wardrobe/analyze-item';
import { deleteItem } from '@/openapi_generated/fn/wardrobe/delete-item';
import { deleteItems } from '@/openapi_generated/fn/wardrobe/delete-items';
import { getProfile } from '@/openapi_generated/fn/users/get-profile';
import { updateProfile } from '@/openapi_generated/fn/users/update-profile';
import { saveSeasonProfile } from '@/openapi_generated/fn/analysis/save-season-profile';
import type { WardrobeItemDto } from '@/openapi_generated/models/wardrobe-item-dto';
import type { UserProfileDto } from '@/openapi_generated/models/user-profile-dto';
import type { CreateWardrobeItemRequest } from '@/openapi_generated/models/create-wardrobe-item-request';
import type { CreateWardrobeItemResponse } from '@/openapi_generated/models/create-wardrobe-item-response';
import type { WardrobeValidationDto } from '@/openapi_generated/models/wardrobe-validation-dto';
import type { UpdateProfileRequest } from '@/openapi_generated/models/update-profile-request';
import type { SeasonAnalysisResponse } from '@/openapi_generated/models/season-analysis-response';

@Injectable({ providedIn: 'root' })
export class WardrobeService {
  private api = inject(Api);

  readonly items = signal<WardrobeItemDto[]>([]);
  readonly userProfile = signal<UserProfileDto>({});
  private isInitialized = false;

  async initializeData() {
    try {
      const [items, profile] = await Promise.all([
        this.api.invoke(getItems),
        this.api.invoke(getProfile)
      ]);
      this.items.set(items);
      this.userProfile.set(profile);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Failed to load wardrobe data from API', e);
      this.items.set([]);
      this.userProfile.set({});
    }
  }

  clearData() {
    this.items.set([]);
    this.userProfile.set({});
    this.isInitialized = false;
  }

  async addItem(item: CreateWardrobeItemRequest): Promise<CreateWardrobeItemResponse> {
    try {
      const response = await this.api.invoke(addItem, { body: item });
      if (response.item) {
        this.items.update(current => [...current, response.item!]);
      }
      return response;
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 409) {
        return { validation: e.error as WardrobeValidationDto };
      }
      throw e;
    }
  }

  async analyzeItem(image: string): Promise<WardrobeValidationDto> {
    return this.api.invoke(analyzeItem, { body: { image } });
  }

  async deleteItem(id: string) {
    await this.api.invoke(deleteItem, { id });
    this.items.update(current => current.filter(i => i.id !== id));
  }

  async deleteItems(itemIds: string[]) {
    await this.api.invoke(deleteItems, { body: { itemIds } });
    const itemIdSet = new Set(itemIds);
    this.items.update(current => current.filter(item => !itemIdSet.has(item.id ?? '')));
  }

  async updateProfile(request: UpdateProfileRequest) {
    const updated = await this.api.invoke(updateProfile, { body: request });
    this.userProfile.set(updated);
  }

  async saveAnalysis(analysis: SeasonAnalysisResponse) {
    const updated = await this.api.invoke(saveSeasonProfile, { body: analysis });
    this.userProfile.set(updated);
  }
}
