export interface ISeasonAnalysisResult {
  id?: string;
  season: string;
  subSeason: string;
  description: string;
  recommendedColors: string[];
  bestMetals: string;
  hairColor?: string;
  hairDetail?: string;
  eyeColor?: string;
  eyeDetail?: string;
  skinTone?: string;
  skinDetail?: string;
  undertone?: string;
  contrast?: string;
}

export interface ISeasonAnalysisRequest {
  imageBase64: string;
}
