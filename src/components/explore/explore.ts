import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { ExploreService } from '../../services/explore.service';
import { IShoppingProduct } from '../../models';
import { IconComponent } from '../ui/icons';

const CATEGORIES = [
  { id: 'all',         label: 'For You' },
  { id: 'tops',        label: 'Tops' },
  { id: 'bottoms',     label: 'Bottoms' },
  { id: 'dresses',     label: 'Dresses' },
  { id: 'shoes',       label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' },
];

const CATEGORY_SUFFIXES: Record<string, string> = {
  tops:        ' top blouse shirt',
  bottoms:     ' pants trousers skirt jeans',
  dresses:     ' dress',
  shoes:       ' shoes boots heels sneakers',
  accessories: ' bag accessories jewelry',
};

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class ExploreComponent implements OnInit {
  private exploreService = inject(ExploreService);
  private wardrobeService = inject(WardrobeService);

  readonly categories = CATEGORIES;

  products         = signal<IShoppingProduct[]>([]);
  isLoading        = signal(false);
  error            = signal<string | null>(null);
  searchQuery      = signal('');
  selectedCategory = signal('all');
  hasMore          = signal(false);
  readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8];

  private offset = 0;

  get season()  { return this.wardrobeService.userProfile().season; }
  get palette() { return this.wardrobeService.userProfile().palette || []; }

  get seasonHeadline() {
    const s = this.season;
    return s ? `Curated picks for your ${s} palette` : 'Discover your next favourite look';
  }

  ngOnInit() {
    this.fetchProducts(true);
  }

  private buildQuery(): string {
    const base   = this.searchQuery() || this.exploreService.getSeasonQuery(this.season);
    const suffix = CATEGORY_SUFFIXES[this.selectedCategory()] ?? '';
    return `${base}${suffix}`;
  }

  async fetchProducts(reset: boolean) {
    if (reset) {
      this.offset = 0;
      this.products.set([]);
    }
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const items = await this.exploreService.searchProducts(this.buildQuery(), 12, this.offset);
      this.products.update(p => reset ? items : [...p, ...items]);
      this.hasMore.set(items.length === 12);
      this.offset += items.length;
    } catch (e: any) {
      if (e.message === 'NO_API_KEY') {
        this.error.set('RapidAPI key is not configured. Add it to src/environments/environment.ts.');
      } else if (e.message === 'INVALID_API_KEY') {
        this.error.set('The RapidAPI key is invalid or has exceeded its quota.');
      } else {
        this.error.set(e.message || 'Something went wrong. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch() {
    this.fetchProducts(true);
  }

  onCategoryChange(cat: string) {
    this.selectedCategory.set(cat);
    this.fetchProducts(true);
  }

  loadMore() {
    this.fetchProducts(false);
  }
}

