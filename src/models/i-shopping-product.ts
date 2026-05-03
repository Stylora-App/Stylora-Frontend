export interface IShoppingProduct {
  id: number;
  name: string;
  brandName: string;
  price: string;
  imageUrl: string;
  url: string;
  colour?: string;
  category?: string;
  articleTypeLabel?: string;
  audienceTag?: string;
  colorFamily?: string;
  outfitRole?: string;
  paletteMatch?: boolean;
}
