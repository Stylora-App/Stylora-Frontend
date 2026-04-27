export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'jumpsuit' | 'shoes' | 'outerwear' | 'accessories';

export interface IWardrobeItem {
  id: string;
  image: string;
  category: ClothingCategory;
  articleTypeLabel?: string;
  audienceTag?: string;
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
  category?: ClothingCategory;
  style?: string;
  color?: string;
  overrideValidationWarning?: boolean;
}

export interface IWardrobeValidationWarning {
  status: 'warning' | 'pass';
  isLikelyClothing: boolean;
  confidence: number;
  message: string;
  canOverride: boolean;
  nearestLabels: string[];
  suggestedCategory?: ClothingCategory;
  suggestedArticleType?: string;
  suggestedStyle?: string;
  suggestedColor?: string;
  suggestedColorFamily?: string;
  suggestedUsage?: string;
  suggestedGender?: string;
}

export interface ICreateWardrobeItemResponse {
  item?: IWardrobeItem;
  validation?: IWardrobeValidationWarning;
}
