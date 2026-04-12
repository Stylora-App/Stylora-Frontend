import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { IShoppingProduct } from '../models';

export interface IExploreResult {
  products: IShoppingProduct[];
  hasMore: boolean;
  page: number;
  pageSize: number;
}

const SEASON_TERMS: Record<string, string> = {
  'light spring':  'bright pastel spring fashion coral peach',
  'true spring':   'warm spring fashion yellow orange',
  'bright spring': 'vivid bright fashion neon spring',
  'light summer':  'soft pastel blue lavender summer',
  'true summer':   'cool soft muted summer fashion',
  'soft summer':   'muted dusty rose summer fashion',
  'soft autumn':   'earth tones muted warm autumn',
  'true autumn':   'rust orange olive autumn fall',
  'dark autumn':   'deep warm wine burgundy autumn',
  'dark winter':   'deep cool black navy winter',
  'true winter':   'cool vivid red navy white winter',
  'bright winter': 'bright bold fuchsia winter fashion',
};

@Injectable({ providedIn: 'root' })
export class ExploreService {
  private api = inject(ApiService);

  getSeasonQuery(season?: string): string {
    if (!season) return 'fashion outfit trending';
    const lower = season.toLowerCase();
    const match = Object.keys(SEASON_TERMS).find(k => lower.includes(k));
    return match ? SEASON_TERMS[match] : 'fashion outfit trending';
  }

  async search(params: {
    q?: string;
    category?: string;
    gender?: string;
    season?: string;
    palette?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<IExploreResult> {
    const queryParts: string[] = [];

    if (params.q)        queryParts.push(`q=${encodeURIComponent(params.q)}`);
    if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params.gender)   queryParts.push(`gender=${encodeURIComponent(params.gender)}`);
    if (params.season)   queryParts.push(`season=${encodeURIComponent(params.season)}`);
    if (params.palette?.length) queryParts.push(`palette=${encodeURIComponent(params.palette.join(','))}`);
    if (params.page)     queryParts.push(`page=${params.page}`);
    if (params.pageSize) queryParts.push(`pageSize=${params.pageSize}`);

    const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
    const result = await this.api.get<IExploreResult>(`/explore${qs}`);

    // Normalise to frontend model shape
    result.products = result.products.map((p: any) => ({
      id:        p.id,
      name:      p.name,
      brandName: p.brandName ?? 'ASOS',
      price:     p.price ?? '',
      imageUrl:  p.imageUrl ?? '',
      url:       p.url ?? 'https://www.asos.com',
      colour:    p.colour,
      paletteMatch: p.paletteMatch ?? false,
    }));

    return result;
  }
}

