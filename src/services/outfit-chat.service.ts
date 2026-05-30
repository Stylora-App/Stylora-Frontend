import { Injectable, inject } from '@angular/core';
import { Api } from '@/openapi_generated/api';
import { generateOutfit } from '@/openapi_generated/fn/chat/generate-outfit';
import type { OutfitChatMessageDto } from '@/openapi_generated/models/outfit-chat-message-dto';
import type { OutfitChatResponse } from '@/openapi_generated/models/outfit-chat-response';

@Injectable({ providedIn: 'root' })
export class OutfitChatService {
  private api = inject(Api);

  send(messages: OutfitChatMessageDto[]): Promise<OutfitChatResponse> {
    return this.api.invoke(generateOutfit, { body: { messages } });
  }
}
