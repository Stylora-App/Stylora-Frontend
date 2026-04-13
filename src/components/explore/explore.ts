import { Component, inject, signal, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WardrobeService } from '../../services/wardrobe.service';
import { ExploreService } from '../../services/explore.service';
import { TryOnStateService } from '../../services/try-on-state.service';
import { IShoppingProduct } from '../../models';
import { IconComponent } from '../ui/icons';

const WOMEN_CATEGORIES = [
  { id: 'tops',        label: 'Tops',        tagline: 'Blouses, shirts & more' },
  { id: 'dresses',     label: 'Dresses',     tagline: 'From casual to formal' },
  { id: 'bottoms',     label: 'Bottoms',     tagline: 'Trousers, skirts & jeans' },
  { id: 'outerwear',   label: 'Outerwear',   tagline: 'Coats, jackets & blazers' },
  { id: 'shoes',       label: 'Shoes',       tagline: 'Heels, boots & sneakers' },
  { id: 'accessories', label: 'Accessories', tagline: 'Bags, jewellery & more' },
];

const MEN_CATEGORIES = [
  { id: 'tops',        label: 'Tops',        tagline: 'Shirts, polos & sweatshirts' },
  { id: 'bottoms',     label: 'Bottoms',     tagline: 'Trousers, jeans & chinos' },
  { id: 'outerwear',   label: 'Outerwear',   tagline: 'Coats, jackets & blazers' },
  { id: 'shoes',       label: 'Shoes',       tagline: 'Boots, sneakers & loafers' },
  { id: 'accessories', label: 'Accessories', tagline: 'Watches, bags & more' },
];

// Editorial fallbacks when no palette available
const TILE_FALLBACK_COLORS = ['#1E293B', '#3D1A24', '#292524', '#0F1F14', '#1C1712', '#1A2535'];

type Step = 'gender' | 'category' | 'results';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class ExploreComponent implements OnDestroy {
  private exploreService  = inject(ExploreService);
  private wardrobeService = inject(WardrobeService);
  private tryOnStateService = inject(TryOnStateService);

  /** Emitted when the user clicks "Try On" in the product modal */
  @Output() navigateToTryOn = new EventEmitter<void>();

  readonly skeletonItems = Array.from({ length: 10 }, (_, i) => i);

  step             = signal<Step>('gender');
  selectedGender   = signal<'women' | 'men' | null>(null);
  selectedCategory = signal<string | null>(null);

  products  = signal<IShoppingProduct[]>([]);
  isLoading = signal(false);
  error     = signal<string | null>(null);
  searchQuery = signal('');
  hasMore   = signal(false);

  /** Product whose modal is currently open. */
  selectedProduct = signal<IShoppingProduct | null>(null);

  private currentPage = 1;
  private readonly PAGE_SIZE = 20;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  get season()  { return this.wardrobeService.userProfile().season; }
  get palette() { return this.wardrobeService.userProfile().palette || []; }

  get visibleCategories() {
    return this.selectedGender() === 'men' ? MEN_CATEGORIES : WOMEN_CATEGORIES;
  }

  get seasonHeadline() {
    const s = this.season;
    return s ? `Curated for your ${s} palette` : 'Discover your next favourite look';
  }

  get activeCategoryLabel() {
    if (!this.selectedCategory()) return 'For You';
    return this.visibleCategories.find(c => c.id === this.selectedCategory())?.label ?? 'For You';
  }

  tilePaletteColor(index: number): string {
    if (!this.palette.length) return TILE_FALLBACK_COLORS[index % TILE_FALLBACK_COLORS.length];
    const hex = this.palette[index % this.palette.length];
    return this.darkenHex(hex, 0.48);
  }

  private darkenHex(hex: string, amount: number): string {
    const h = hex.replace('#', '');
    if (h.length !== 6) return '#1C1917';
    const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount));
    const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount));
    const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount));
    return `rgb(${r},${g},${b})`;
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  selectGender(g: 'women' | 'men') {
    this.selectedGender.set(g);
    this.step.set('category');
  }

  goBackToGender() {
    this.step.set('gender');
    this.selectedGender.set(null);
    this.selectedCategory.set(null);
    this.products.set([]);
    this.error.set(null);
    this.searchQuery.set('');
  }

  goBackToCategory() {
    this.step.set('category');
    this.selectedCategory.set(null);
    this.products.set([]);
    this.error.set(null);
  }

  onCategorySelect(catId: string) {
    this.selectedCategory.set(catId === 'all' ? null : catId);
    this.step.set('results');
    this.fetchProducts(true);
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    if (this.step() !== 'results') {
      this.selectedCategory.set(null);
      this.step.set('results');
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.fetchProducts(true), 400);
  }

  onSearchSubmit() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.step() !== 'results') {
      this.selectedCategory.set(null);
      this.step.set('results');
    }
    this.fetchProducts(true);
  }

  onPillCategoryChange(catId: string) {
    this.selectedCategory.set(catId === 'all' ? null : catId);
    this.fetchProducts(true);
  }

  loadMore() { this.fetchProducts(false); }

  openProductModal(product: IShoppingProduct) {
    this.selectedProduct.set(product);
  }

  closeModal() {
    this.selectedProduct.set(null);
  }

  goToWebsite(product: IShoppingProduct) {
    window.open(product.url, '_blank', 'noopener,noreferrer');
    this.closeModal();
  }

  tryOnProduct(product: IShoppingProduct) {
    this.tryOnStateService.pendingProduct.set(product);
    this.closeModal();
    this.navigateToTryOn.emit();
  }

  async fetchProducts(reset: boolean) {
    if (reset) {
      this.currentPage = 1;
      this.products.set([]);
    }
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.exploreService.search({
        q:        this.searchQuery() || undefined,
        category: this.selectedCategory() ?? 'all',
        gender:   this.selectedGender() ?? undefined,
        season:   this.season,
        palette:  this.palette,
        page:     this.currentPage,
        pageSize: this.PAGE_SIZE,
      });

      this.products.update(prev => reset ? result.products : [...prev, ...result.products]);
      this.hasMore.set(result.hasMore);
      this.currentPage = reset ? 2 : this.currentPage + 1;
    } catch (e: any) {
      this.error.set(e.message || 'Something went wrong. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

