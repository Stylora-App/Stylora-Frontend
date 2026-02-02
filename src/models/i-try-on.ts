export interface ITryOnRequest {
  personImageBase64: string;
  clothingImageBase64: string;
}

export interface ITryOnResponse {
  generatedImage: string;
}
