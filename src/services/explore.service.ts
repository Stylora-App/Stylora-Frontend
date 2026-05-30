import { Injectable, inject } from '@angular/core';
import { Api } from '@/openapi_generated/api';
import { search } from '@/openapi_generated/fn/explore/search';
import type { ExploreResultDto } from '@/openapi_generated/models/explore-result-dto';

@Injectable({ providedIn: 'root' })
export class ExploreService {
  private api = inject(Api);

  async search(params: {
    q?: string;
    category?: string;
    gender?: string;
    season?: string;
    subSeason?: string;
    palette?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<ExploreResultDto> {
    const result = await this.api.invoke(search, {
      q:         params.q,
      category:  params.category as any,
      gender:    params.gender as any,
      season:    params.season,
      subSeason: params.subSeason,
      palette:   params.palette?.join(','),
      page:      params.page,
      pageSize:  params.pageSize
    });

    result.products = (result.products ?? []).map((p: any) => ({
      id:           p.id,
      name:         p.name,
      brandName:    p.brandName ?? 'ASOS',
      price:        p.price ?? '',
      imageUrl:     p.imageUrl ?? '',
      url:          p.url ?? 'https://www.asos.com',
      colour:       p.colour,
      paletteMatch: p.paletteMatch ?? false,
    }));

    return result;
  }
}
