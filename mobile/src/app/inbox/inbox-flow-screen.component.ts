import { Component, Input } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RideApiService } from '../services/ride-api.service';

@Component({
  selector: 'app-inbox-flow-screen',
  templateUrl: './inbox-flow-screen.component.html',
  standalone: false,
})
export class InboxFlowScreenComponent {
  @Input({ required: true }) vm!: any;

  constructor(
    private readonly auth: AuthService,
    private readonly api: RideApiService,
  ) {}

  openConversation(conversation: any) {
    this.vm.selectedRide = {
      ...this.vm.selectedRide,
      id: conversation.rideId || this.vm.selectedRide.id || 1,
      driverId: conversation.receiverId || this.vm.selectedRide.driverId || 2,
      driver: conversation.name || this.vm.selectedRide.driver,
      owner: conversation.name || this.vm.selectedRide.owner,
      photo: conversation.image || this.vm.selectedRide.photo,
    };
    conversation.unread = 0;
    conversation.seen = true;
    this.vm.goTo('/chat');
    this.vm.loadChatHistory();
  }

  attachChatFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.vm.attachedFileName = file.name;
    this.vm.attachedFileType = file.type.startsWith('image/') ? 'image' : 'file';
    this.vm.attachedPreviewUrl = '';
    if (this.vm.attachedFileType === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        this.vm.attachedPreviewUrl = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    }
    this.vm.presentToast(`${file.name} attached`);
  }

  clearChatAttachment() {
    this.vm.attachedFileName = '';
    this.vm.attachedPreviewUrl = '';
    this.vm.attachedFileType = 'file';
  }

  private clearTypingState() {
    this.vm.isTyping = false;
    if (this.vm.typingTimer) {
      window.clearTimeout(this.vm.typingTimer);
      this.vm.typingTimer = undefined;
    }
  }

  onChatDraftChange(value: string) {
    this.vm.chatDraft = value;
    this.vm.isTyping = Boolean(value.trim());
    if (this.vm.typingTimer) window.clearTimeout(this.vm.typingTimer);
    this.vm.typingTimer = window.setTimeout(() => this.clearTypingState(), 1500);
    const currentUserId = this.auth.user?.user_id || 1;
    const receiverId = this.vm.selectedRide.driverId && this.vm.selectedRide.driverId !== currentUserId ? this.vm.selectedRide.driverId : 2;
    if (this.auth.isAuthenticated && this.auth.token !== 'demo-token') {
      this.api.sendTyping({ rideId: this.vm.selectedRide.id || 1, receiverId, isTyping: Boolean(value.trim()) }).subscribe({ error: () => undefined });
    }
  }

  sendChatMessage() {
    const text = this.vm.chatDraft.trim();
    if (!text && !this.vm.attachedFileName) {
      this.vm.presentToast('Type a message or attach a file');
      return;
    }
    const messageText = text || `Shared file: ${this.vm.attachedFileName}`;
    const sentMessage = {
      id: Date.now(),
      from: 'me' as const,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: this.vm.attachedFileName || undefined,
      attachmentType: this.vm.attachedFileName ? this.vm.attachedFileType : undefined,
      previewUrl: this.vm.attachedPreviewUrl || undefined,
    };
    this.vm.chats = [...this.vm.chats, sentMessage];
    this.vm.chatDraft = '';
    this.clearTypingState();
    this.clearChatAttachment();
    this.vm.liveActivity = 'Message sent - realtime sync pending';
    const currentUserId = this.auth.user?.user_id || 1;
    const receiverId = this.vm.selectedRide.driverId && this.vm.selectedRide.driverId !== currentUserId ? this.vm.selectedRide.driverId : 2;
    this.api.sendMessage({
      rideId: this.vm.selectedRide.id || 1,
      receiverId,
      message: sentMessage.text,
      attachmentUrl: sentMessage.attachment ? `local://${sentMessage.attachment}` : undefined,
    }).subscribe({
      next: () => {
        this.vm.liveActivity = 'Message delivered - realtime event sent';
        this.vm.loadConversations();
      },
      error: () => {
        this.vm.liveActivity = 'Message saved locally - backend not connected';
      },
    });
  }

  deleteChatMessage(messageId: number) {
    this.vm.chats = this.vm.chats.filter((chat: any) => chat.id !== messageId);
    this.vm.presentToast('Message deleted');
  }
}
