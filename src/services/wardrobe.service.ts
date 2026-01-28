import { Injectable, signal, computed, effect } from '@angular/core';

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
  readonly items = signal<WardrobeItem[]>([]);
  readonly userProfile = signal<UserProfile>({});

  constructor() {
    this.loadData();
    
    // Save on change
    effect(() => {
      localStorage.setItem('stylora_items', JSON.stringify(this.items()));
      localStorage.setItem('stylora_profile', JSON.stringify(this.userProfile()));
    });
  }

  private loadData() {
    const storedItems = localStorage.getItem('stylora_items');
    const storedProfile = localStorage.getItem('stylora_profile');
    if (storedItems) this.items.set(JSON.parse(storedItems));
    if (storedProfile) this.userProfile.set(JSON.parse(storedProfile));
  }

  addItem(item: Omit<WardrobeItem, 'id' | 'wearCount'>) {
    const newItem: WardrobeItem = {
      ...item,
      id: crypto.randomUUID(),
      wearCount: 0
    };
    this.items.update(current => [...current, newItem]);
  }

  deleteItem(id: string) {
    this.items.update(current => current.filter(i => i.id !== id));
  }

  logWear(id: string) {
    this.items.update(current => 
      current.map(i => i.id === id ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i)
    );
  }

  updateProfile(profile: UserProfile) {
    this.userProfile.set(profile);
  }

  resetProfile() {
    this.userProfile.set({});
  }
}