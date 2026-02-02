export interface ISeasonAnalysisResult {
  season: string;
  subSeason: string;
  description: string;
  recommendedColors: string[];
  bestMetals: string;
}

export interface ISeasonAnalysisRequest {
  imageBase64: string;
}
