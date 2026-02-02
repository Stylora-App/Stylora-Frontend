import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface WardrobeItem {
  id: string;
  image: string; // Base64
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'fullbody';
  tags: string[]; // e.g., 'office', 'sport', 'date'
  color?: string;
  wearCount: number;
  lastWorn?: string;
  description?: string;
}

export interface UserProfile {
  season?: string;
  subSeason?: string;
  palette?: string[];
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WardrobeService {
  private apiService = inject(ApiService);
  
  readonly items = signal<WardrobeItem[]>([]);
  readonly userProfile = signal<UserProfile>({});
  private isInitialized = false;

  constructor() {
    // Don't auto-initialize - wait for explicit call after auth check
  }

  async initializeData() {
    try {
      const [items, profile] = await Promise.all([
        this.apiService.get<WardrobeItem[]>('/wardrobe/items'),
        this.apiService.get<UserProfile>('/wardrobe/profile')
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

  async addItem(item: Omit<WardrobeItem, 'id' | 'wearCount'>) {
    const newItem = await this.apiService.post<WardrobeItem>('/wardrobe/items', {
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

  async updateProfile(profile: UserProfile) {
    const updated = await this.apiService.put<UserProfile>('/wardrobe/profile', profile);
    this.userProfile.set(updated);
  }

  resetProfile() {
    this.userProfile.set({});
    this.updateProfile({});
  }
}