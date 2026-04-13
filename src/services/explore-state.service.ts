import { Injectable, signal } from '@angular/core';
import { IShoppingProduct } from '../models';

type ExploreStep = 'gender' | 'category' | 'results';

@Injectable({ providedIn: 'root' })
export class ExploreStateService {
  step             = signal<ExploreStep>('gender');
  selectedGender   = signal<'women' | 'men' | null>(null);
  selectedCategory = signal<string | null>(null);
  products         = signal<IShoppingProduct[]>([]);
  searchQuery      = signal('');
  hasMore          = signal(false);
  currentPage      = 1;

  /** Set when navigating to Try-On from Explore so the back button knows to return. */
  cameFromExplore  = signal(false);
}
