import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WardrobeService } from '../../services/wardrobe.service';
import { AuthService } from '../../services/auth.service';
import { OutfitChatService } from '../../services/outfit-chat.service';
import { NotificationService } from '../../services/notification.service';
import { IOutfitChatMessage, IOutfitChatResponse } from '../../models';
import { IconComponent } from '../ui/icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  wardrobeService = inject(WardrobeService);
  authService = inject(AuthService);
  outfitChatService = inject(OutfitChatService);
  notificationService = inject(NotificationService);

  draftMessage = signal('');
  isSending = signal(false);
  latestResponse = signal<IOutfitChatResponse | null>(null);
  selectedBoardItemIndex = signal(0);
  messages = signal<IOutfitChatMessage[]>([
    {
      role: 'assistant',
      content: 'Describe the occasion and weather, and I will build an outfit only from your Stylora wardrobe.'
    }
  ]);

  readonly quickPrompts = [
    'Build me a rainy work outfit',
    'Create a sunny weekend look',
    'Plan an elegant dinner outfit for cool weather'
  ];

  readonly activeOutfit = computed(() => this.latestResponse()?.outfit ?? null);
  readonly hasUserStartedConversation = computed(() =>
    this.messages().some(message => message.role === 'user')
  );
  readonly canShuffle = computed(() =>
    this.latestResponse()?.status === 'success' && !!this.latestResponse()?.hasMoreOutfits
  );
  readonly outputTitle = computed(() => {
    const response = this.latestResponse();
    if (!response) {
      return 'Outfit board';
    }

    switch (response.status) {
      case 'success':
        return 'Outfit ready';
      case 'follow_up':
        return 'Need one more detail';
      case 'not_enough_pieces':
        return 'Wardrobe needs more pieces';
      default:
        return 'Stylist scope';
    }
  });

  async sendMessage(messageOverride?: string) {
    const content = (messageOverride ?? this.draftMessage()).trim();
    if (!content || this.isSending()) {
      return;
    }

    const nextMessages = [...this.messages(), { role: 'user' as const, content }];
    this.messages.set(nextMessages);
    this.draftMessage.set('');
    this.isSending.set(true);

    try {
      const response = await this.outfitChatService.send(nextMessages);
      this.latestResponse.set(response);
      this.selectedBoardItemIndex.set(0);
      this.messages.update(messages => [
        ...messages,
        { role: 'assistant', content: response.assistantMessage }
      ]);
    } catch (error) {
      console.error(error);
      this.notificationService.error('The stylist could not respond right now. Please try again.');
    } finally {
      this.isSending.set(false);
    }
  }

  sendSuggestedReply(reply: string) {
    this.sendMessage(reply);
  }

  shuffleOutfit() {
    if (!this.canShuffle() || this.isSending()) {
      return;
    }

    this.sendMessage('Shuffle another option');
  }

  clearChat() {
    if (this.isSending()) {
      return;
    }

    this.draftMessage.set('');
    this.latestResponse.set(null);
    this.selectedBoardItemIndex.set(0);
    this.messages.set([
      {
        role: 'assistant',
        content: 'Describe the occasion and weather, and I will build an outfit only from your Stylora wardrobe.'
      }
    ]);
  }

  handleComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectBoardItem(index: number) {
    this.selectedBoardItemIndex.set(index);
  }

  getBoardOffset(index: number) {
    const total = this.activeOutfit()?.items.length ?? 0;
    if (total <= 1) {
      return 0;
    }

    let offset = index - this.selectedBoardItemIndex();
    const half = total / 2;

    if (offset > half) {
      offset -= total;
    } else if (offset < -half) {
      offset += total;
    }

    if (total % 2 === 0 && Math.abs(offset) === half) {
      offset = -half;
    }

    return offset;
  }

  getBoardDistance(index: number) {
    return Math.abs(this.getBoardOffset(index));
  }

  getBoardZIndex(index: number) {
    return 20 - this.getBoardDistance(index);
  }

  getBoardTranslateX(index: number) {
    const offset = this.getBoardOffset(index);
    const distance = Math.abs(offset);

    if (distance === 0) {
      return 0;
    }

    if (distance === 1) {
      return offset * 8.1;
    }

    return Math.sign(offset) * (0.9 + ((distance - 2) * 1.1));
  }

  getBoardTranslateY(index: number) {
    const distance = this.getBoardDistance(index);
    return distance === 0 ? 0 : distance === 1 ? 0.7 : 1.1 + ((distance - 2) * 0.18);
  }

  getBoardRotation(index: number) {
    const offset = this.getBoardOffset(index);
    const distance = Math.abs(offset);

    if (distance === 0) {
      return 0;
    }

    if (distance === 1) {
      return offset * -5;
    }

    return offset * -2.2;
  }

  getBoardScale(index: number) {
    const distance = this.getBoardDistance(index);

    if (distance === 0) {
      return 1;
    }

    if (distance === 1) {
      return 0.9;
    }

    return Math.max(0.76, 0.84 - ((distance - 2) * 0.06));
  }

  getBoardOpacity(index: number) {
    const distance = this.getBoardDistance(index);

    if (distance === 0) {
      return 1;
    }

    if (distance === 1) {
      return 0.8;
    }

    return Math.max(0.34, 0.5 - ((distance - 2) * 0.08));
  }
}
