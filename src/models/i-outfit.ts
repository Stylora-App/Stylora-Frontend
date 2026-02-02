import { IWardrobeItem } from './i-wardrobe-item';

export interface IOutfitSuggestion {
  topId: string;
  bottomId: string;
  shoeId: string;
  reasoning: string;
  styleTip: string;
}

export interface IOutfitRequest {
  items: IWardrobeItemDto[];
  occasion: string;
  weather: string;
}

export interface IWardrobeItemDto {
  id: string;
  image: string;
  category: string;
  tags: string[];
  color?: string;
  wearCount: number;
  lastWorn?: string;
  description?: string;
}
