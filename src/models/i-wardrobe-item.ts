export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'jumpsuit' | 'shoes';

export interface IWardrobeItem {
  id: string;
  image: string;
  category: ClothingCategory;
  style?: string;
  color?: string;
  wornCount: number;
  name?: string;
  validationStatus?: 'pass' | 'warning';
  validationConfidence?: number;
  validationMessage?: string;
  validatedAt?: string;
}

export interface ICreateWardrobeItemRequest {
  image: string;
  category: ClothingCategory;
  style?: string;
  overrideValidationWarning?: boolean;
}

export interface IWardrobeValidationWarning {
  status: 'warning' | 'pass';
  isLikelyClothing: boolean;
  confidence: number;
  message: string;
  canOverride: boolean;
  nearestLabels: string[];
}

export interface ICreateWardrobeItemResponse {
  item?: IWardrobeItem;
  validation?: IWardrobeValidationWarning;
}
