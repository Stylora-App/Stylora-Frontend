import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WardrobeService } from '../../services/wardrobe.service';
import { ExploreService } from '../../services/explore.service';
import { TryOnStateService } from '../../services/try-on-state.service';
import { ExploreStateService } from '../../services/explore-state.service';
import { IconComponent } from '../ui/icons';
import type { ShoppingProductDto } from '@/openapi_generated/models/shopping-product-dto';

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

const TILE_FALLBACK_COLORS = ['#1E293B', '#3D1A24', '#292524', '#0F1F14', '#1C1712', '#1A2535'];

type Step = 'gender' | 'category' | 'results';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class ExploreComponent implements OnInit, OnDestroy {
  private exploreService       = inject(ExploreService);
  private wardrobeService      = inject(WardrobeService);
  private tryOnStateService    = inject(TryOnStateService);
  private exploreStateService  = inject(ExploreStateService);
  private router               = inject(Router);

  readonly skeletonItems = Array.from({ length: 10 }, (_, i) => i);

  step             = signal<Step>('gender');
  selectedGender   = signal<'women' | 'men' | null>(null);
  selectedCategory = signal<string | null>(null);
  products         = signal<ShoppingProductDto[]>([]);
  isLoading        = signal(false);
  error            = signal<string | null>(null);
  searchQuery      = signal('');
  hasMore          = signal(false);
  selectedProduct  = signal<ShoppingProductDto | null>(null);

  private currentPage = 1;
  private readonly PAGE_SIZE = 20;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestVersion = 0;

  get season()     { return this.wardrobeService.userProfile().subSeason || this.wardrobeService.userProfile().season; }
  get baseSeason() { return this.wardrobeService.userProfile().season; }
  get subSeason()  { return this.wardrobeService.userProfile().subSeason; }
  get palette()    { return this.wardrobeService.userProfile().palette || []; }
  get hasPalette() { return this.palette.length > 0; }

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
    return this.darkenHex(this.palette[index % this.palette.length], 0.48);
  }

  private darkenHex(hex: string, amount: number): string {
    const h = hex.replace('#', '');
    if (h.length !== 6) return '#1C1917';
    const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount));
    const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount));
    const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount));
    return `rgb(${r},${g},${b})`;
  }

  ngOnInit() {
    const state = this.exploreStateService;
    this.step.set(state.step());
    this.selectedGender.set(state.selectedGender());
    this.selectedCategory.set(state.selectedCategory());
    this.products.set(state.products());
    this.searchQuery.set(state.searchQuery());
    this.hasMore.set(state.hasMore());
    this.currentPage = state.currentPage;
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.cacheCurrentResults(this.buildCacheKey(), this.products(), this.hasMore(), this.currentPage);
    const state = this.exploreStateService;
    state.step.set(this.step());
    state.selectedGender.set(this.selectedGender());
    state.selectedCategory.set(this.selectedCategory());
    state.products.set(this.products());
    state.searchQuery.set(this.searchQuery());
    state.hasMore.set(this.hasMore());
    state.currentPage = this.currentPage;
  }

  goToAnalysis() { this.router.navigate(['/analysis']); }

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
    this.hasMore.set(false);
    this.currentPage = 1;
  }

  goBackToCategory() {
    this.step.set('category');
    this.selectedCategory.set(null);
    this.products.set([]);
    this.error.set(null);
    this.hasMore.set(false);
    this.currentPage = 1;
  }

  onCategorySelect(catId: string) {
    this.selectedCategory.set(catId === 'all' ? null : catId);
    this.step.set('results');
    this.loadResultsForCurrentTab();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    if (this.step() !== 'results') { this.selectedCategory.set(null); this.step.set('results'); }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.loadResultsForCurrentTab(), 400);
  }

  onSearchSubmit() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.step() !== 'results') { this.selectedCategory.set(null); this.step.set('results'); }
    this.loadResultsForCurrentTab();
  }

  onPillCategoryChange(catId: string) {
    this.selectedCategory.set(catId === 'all' ? null : catId);
    this.loadResultsForCurrentTab();
  }

  loadMore() { this.fetchProducts(false); }

  openProductModal(product: ShoppingProductDto) { this.selectedProduct.set(product); }
  closeModal() { this.selectedProduct.set(null); }

  goToWebsite(product: ShoppingProductDto) {
    window.open(product.url, '_blank', 'noopener,noreferrer');
    this.closeModal();
  }

  tryOnProduct(product: ShoppingProductDto) {
    this.tryOnStateService.pendingProduct.set(product);
    this.exploreStateService.cameFromExplore.set(true);
    this.closeModal();
    this.router.navigate(['/tryon']);
  }

  private loadResultsForCurrentTab(forceRefresh = false) {
    const cacheKey = this.buildCacheKey();
    if (!forceRefresh) {
      const cached = this.exploreStateService.getCachedResults(cacheKey);
      if (cached) {
        this.products.set(cached.products);
        this.hasMore.set(cached.hasMore);
        this.currentPage = cached.currentPage;
        this.error.set(null);
        this.isLoading.set(false);
        return;
      }
    }
    void this.fetchProducts(true, forceRefresh);
  }

  private buildCacheKey() {
    return [
      this.selectedGender() ?? 'unknown',
      this.selectedCategory() ?? 'all',
      this.searchQuery().trim().toLowerCase(),
      this.baseSeason ?? '',
      this.subSeason ?? '',
    ].join('|');
  }

  private cacheCurrentResults(cacheKey: string, products: ShoppingProductDto[], hasMore: boolean, currentPage: number) {
    this.exploreStateService.setCachedResults(cacheKey, { products, hasMore, currentPage });
  }

  async fetchProducts(reset: boolean, forceRefresh = false) {
    const cacheKey = this.buildCacheKey();
    const requestVersion = ++this.requestVersion;
    if (reset) { this.currentPage = 1; this.products.set([]); }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.exploreService.search({
        q:         this.searchQuery() || undefined,
        category:  this.selectedCategory() ?? 'all',
        gender:    this.selectedGender() ?? undefined,
        season:    this.baseSeason ?? undefined,
        subSeason: this.subSeason ?? undefined,
        palette:   this.palette,
        page:      this.currentPage,
        pageSize:  this.PAGE_SIZE,
      });
      const previousProducts = reset || forceRefresh ? [] : this.exploreStateService.getCachedResults(cacheKey)?.products ?? this.products();
      const nextProducts = reset ? (result.products ?? []) : [...previousProducts, ...(result.products ?? [])];
      const nextPage = reset ? 2 : this.currentPage + 1;
      this.cacheCurrentResults(cacheKey, nextProducts, result.hasMore ?? false, nextPage);
      if (requestVersion !== this.requestVersion || cacheKey !== this.buildCacheKey()) return;
      this.products.set(nextProducts);
      this.hasMore.set(result.hasMore ?? false);
      this.currentPage = nextPage;
    } catch (e: any) {
      if (requestVersion !== this.requestVersion || cacheKey !== this.buildCacheKey()) return;
      this.error.set(e.message || 'Something went wrong. Please try again.');
    } finally {
      if (requestVersion === this.requestVersion && cacheKey === this.buildCacheKey()) this.isLoading.set(false);
    }
  }
}
