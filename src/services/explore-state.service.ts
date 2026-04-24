import { Injectable, signal } from '@angular/core';
import { IShoppingProduct } from '../models';

type ExploreStep = 'gender' | 'category' | 'results';
interface ICachedExploreResult {
  products: IShoppingProduct[];
  hasMore: boolean;
  currentPage: number;
}

@Injectable({ providedIn: 'root' })
export class ExploreStateService {
  private readonly resultsCache = new Map<string, ICachedExploreResult>();
  private readonly MAX_CACHE_ENTRIES = 12;

  step             = signal<ExploreStep>('gender');
  selectedGender   = signal<'women' | 'men' | null>(null);
  selectedCategory = signal<string | null>(null);
  products         = signal<IShoppingProduct[]>([]);
  searchQuery      = signal('');
  hasMore          = signal(false);
  currentPage      = 1;

  /** Set when navigating to Try-On from Explore so the back button knows to return. */
  cameFromExplore  = signal(false);

  getCachedResults(key: string): ICachedExploreResult | null {
    const cached = this.resultsCache.get(key);
    if (!cached) return null;

    // Refresh insertion order to keep most recently used tabs warm.
    this.resultsCache.delete(key);
    this.resultsCache.set(key, cached);
    return {
      products: [...cached.products],
      hasMore: cached.hasMore,
      currentPage: cached.currentPage,
    };
  }

  setCachedResults(key: string, value: ICachedExploreResult) {
    this.resultsCache.delete(key);
    this.resultsCache.set(key, {
      products: [...value.products],
      hasMore: value.hasMore,
      currentPage: value.currentPage,
    });

    while (this.resultsCache.size > this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.resultsCache.keys().next().value;
      if (!oldestKey) break;
      this.resultsCache.delete(oldestKey);
    }
  }
}
