import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { IOutfitChatMessage, IOutfitChatResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OutfitChatService {
  private apiService = inject(ApiService);

  send(messages: IOutfitChatMessage[]) {
    return this.apiService.post<IOutfitChatResponse>('/chat/outfit', { messages });
  }
}
