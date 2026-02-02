import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { IWardrobeItem, IUserProfile, ICreateWardrobeItemRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WardrobeService {
  private apiService = inject(ApiService);
  
  readonly items = signal<IWardrobeItem[]>([]);
  readonly userProfile = signal<IUserProfile>({});
  private isInitialized = false;

  constructor() {
    // Don't auto-initialize - wait for explicit call after auth check
  }

  async initializeData() {
    try {
      const [items, profile] = await Promise.all([
        this.apiService.get<IWardrobeItem[]>('/wardrobe/items'),
        this.apiService.get<IUserProfile>('/wardrobe/profile')
      ]);
      this.items.set(items);
      this.userProfile.set(profile);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Failed to load wardrobe data from API', e);
      // Clear data on error (user might not be authenticated)
      this.items.set([]);
      this.userProfile.set({});
    }
  }

  clearData() {
    this.items.set([]);
    this.userProfile.set({});
    this.isInitialized = false;
  }

  async addItem(item: ICreateWardrobeItemRequest) {
    const newItem = await this.apiService.post<IWardrobeItem>('/wardrobe/items', {
      image: item.image,
      category: item.category,
      tags: item.tags
    });
    this.items.update(current => [...current, newItem]);
  }

  async deleteItem(id: string) {
    await this.apiService.delete(`/wardrobe/items/${id}`);
    this.items.update(current => current.filter(i => i.id !== id));
  }

  async logWear(id: string) {
    await this.apiService.post(`/wardrobe/items/${id}/wear`, {});
    this.items.update(current => 
      current.map(i => i.id === id ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i)
    );
  }

  async updateProfile(profile: IUserProfile) {
    const updated = await this.apiService.put<IUserProfile>('/wardrobe/profile', profile);
    this.userProfile.set(updated);
  }

  resetProfile() {
    this.userProfile.set({});
    this.updateProfile({});
  }
}