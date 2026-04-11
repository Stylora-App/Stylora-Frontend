export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'jumpsuit' | 'shoes';

export interface IWardrobeItem {
  id: string;
  image: string;
  category: ClothingCategory;
  style?: string;
  color?: string;
  wornCount: number;
}

export interface ICreateWardrobeItemRequest {
  image: string;
  category: ClothingCategory;
  style?: string;
}
