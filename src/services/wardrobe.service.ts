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
    this.initializeData();
  }

  private async initializeData() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    try {
      const [items, profile] = await Promise.all([
        this.apiService.get<WardrobeItem[]>('/wardrobe/items'),
        this.apiService.get<UserProfile>('/wardrobe/profile')
      ]);
      this.items.set(items);
      this.userProfile.set(profile);
    } catch (e) {
      console.warn('Failed to load from API, using local storage fallback', e);
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    const storedItems = localStorage.getItem('stylora_items');
    const storedProfile = localStorage.getItem('stylora_profile');
    if (storedItems) this.items.set(JSON.parse(storedItems));
    if (storedProfile) this.userProfile.set(JSON.parse(storedProfile));
  }

  private saveToLocalStorage() {
    localStorage.setItem('stylora_items', JSON.stringify(this.items()));
    localStorage.setItem('stylora_profile', JSON.stringify(this.userProfile()));
  }

  async addItem(item: Omit<WardrobeItem, 'id' | 'wearCount'>) {
    try {
      const newItem = await this.apiService.post<WardrobeItem>('/wardrobe/items', {
        image: item.image,
        category: item.category,
        tags: item.tags
      });
      this.items.update(current => [...current, newItem]);
    } catch (e) {
      console.warn('Failed to add item via API, adding locally', e);
      const localItem: WardrobeItem = {
        ...item,
        id: crypto.randomUUID(),
        wearCount: 0
      };
      this.items.update(current => [...current, localItem]);
      this.saveToLocalStorage();
    }
  }

  async deleteItem(id: string) {
    try {
      await this.apiService.delete(`/wardrobe/items/${id}`);
      this.items.update(current => current.filter(i => i.id !== id));
    } catch (e) {
      console.warn('Failed to delete item via API, deleting locally', e);
      this.items.update(current => current.filter(i => i.id !== id));
      this.saveToLocalStorage();
    }
  }

  async logWear(id: string) {
    try {
      await this.apiService.post(`/wardrobe/items/${id}/wear`, {});
      this.items.update(current => 
        current.map(i => i.id === id ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i)
      );
    } catch (e) {
      console.warn('Failed to log wear via API, logging locally', e);
      this.items.update(current => 
        current.map(i => i.id === id ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i)
      );
      this.saveToLocalStorage();
    }
  }

  async updateProfile(profile: UserProfile) {
    try {
      const updated = await this.apiService.put<UserProfile>('/wardrobe/profile', profile);
      this.userProfile.set(updated);
    } catch (e) {
      console.warn('Failed to update profile via API, updating locally', e);
      this.userProfile.set(profile);
      this.saveToLocalStorage();
    }
  }

  resetProfile() {
    this.userProfile.set({});
    this.updateProfile({});
  }
}