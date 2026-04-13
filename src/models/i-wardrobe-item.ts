export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'jumpsuit' | 'shoes';

export interface IWardrobeItem {
  id: string;
  image: string;
  category: ClothingCategory;
  style?: string;
  color?: string;
  wornCount: number;
  name?: string;
}

export interface ICreateWardrobeItemRequest {
  image: string;
  category: ClothingCategory;
  style?: string;
}
