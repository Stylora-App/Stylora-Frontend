export type OutfitChatRole = 'assistant' | 'user';
export type OutfitChatStatus = 'follow_up' | 'not_enough_pieces' | 'out_of_scope' | 'success';

export interface IOutfitChatMessage {
  role: OutfitChatRole;
  content: string;
}

export interface IOutfitBoardItem {
  id: string;
  image: string;
  category: string;
  label: string;
  articleTypeLabel?: string;
  color?: string;
}

export interface IOutfitBoard {
  occasion: string;
  style: string;
  weatherSummary: string;
  gender: string;
  summary: string;
  palette: string[];
  items: IOutfitBoardItem[];
}

export interface IOutfitChatResponse {
  status: OutfitChatStatus;
  assistantMessage: string;
  missingFields: string[];
  missingRoles: string[];
  suggestedReplies: string[];
  hasMoreOutfits: boolean;
  outfit?: IOutfitBoard;
}
