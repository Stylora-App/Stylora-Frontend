import { Injectable } from '@angular/core';
import { IShoppingProduct } from '../models';
import { environment } from '../environments/environment';

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
  private readonly API_HOST = 'asos2.p.rapidapi.com';
  private readonly API_BASE = 'https://asos2.p.rapidapi.com';

  getSeasonQuery(season?: string): string {
    if (!season) return 'fashion outfit trending';
    const lower = season.toLowerCase();
    const match = Object.keys(SEASON_TERMS).find(k => lower.includes(k));
    return match ? SEASON_TERMS[match] : 'fashion outfit trending';
  }

  async searchProducts(query: string, limit = 12, offset = 0): Promise<IShoppingProduct[]> {
    const key = environment.rapidApiKey;
    if (!key) throw new Error('NO_API_KEY');

    const params = new URLSearchParams({
      store: 'US',
      country: 'US',
      lang: 'en-US',
      currency: 'USD',
      q: query,
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`${this.API_BASE}/products/v2/list?${params}`, {
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': this.API_HOST,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('INVALID_API_KEY');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch products. Please try again.');
    }

    const data = await response.json();
    return (data.products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      brandName: p.brandName || 'ASOS',
      price: p.price?.current?.text || '',
      imageUrl: p.imageUrl ? `https:${p.imageUrl}` : '',
      url: p.url ? `https://www.asos.com/${p.url}` : 'https://www.asos.com',
      colour: p.colour,
    }));
  }
}

