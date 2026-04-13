export interface ITryOnRequest {
  personImageBase64: string;
  clothingImageBase64: string;
  clothingImageUrl?: string;
}

export interface ITryOnResponse {
  generatedImage: string;
}

export interface ILastTryOnPhoto {
  personImageBase64: string | null;
}
