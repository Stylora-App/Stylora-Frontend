import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { IShoppingProduct } from '../models';

export interface IExploreResult {
  products: IShoppingProduct[];
  hasMore: boolean;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class ExploreService {
  private api = inject(ApiService);

  async search(params: {
    q?: string;
    category?: string;
    gender?: string;
    season?: string;
    subSeason?: string;
    palette?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<IExploreResult> {
    const queryParts: string[] = [];

    if (params.q)        queryParts.push(`q=${encodeURIComponent(params.q)}`);
    if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params.gender)   queryParts.push(`gender=${encodeURIComponent(params.gender)}`);
    if (params.season)   queryParts.push(`season=${encodeURIComponent(params.season)}`);
    if (params.subSeason) queryParts.push(`subSeason=${encodeURIComponent(params.subSeason)}`);
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

