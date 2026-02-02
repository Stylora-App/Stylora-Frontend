export type ClothingCategory = 'top' | 'bottom' | 'shoes' | 'accessory' | 'fullbody';

export interface IWardrobeItem {
  id: string;
  image: string;
  category: ClothingCategory;
  tags: string[];
  color?: string;
  wearCount: number;
  lastWorn?: string;
  description?: string;
}

export interface ICreateWardrobeItemRequest {
  image: string;
  category: ClothingCategory;
  tags: string[];
}
