import type { ChatUser, ChatMessage, Conversation } from '@/types/chat';
import { apiGet } from './http';

export const chatApi = {
  async getUsers(): Promise<ChatUser[]> {
    const { users } = await apiGet<{ users: ChatUser[] }>('/api/v1/users');
    return users;
  },

  async getMessages(userId: string): Promise<ChatMessage[]> {
    const { messages } = await apiGet<{ messages: ChatMessage[] }>(`/api/v1/messages/${userId}`);
    return messages;
  },

  async getConversations(): Promise<Conversation[]> {
    const { conversations } = await apiGet<{ conversations: Conversation[] }>(
      '/api/v1/conversations'
    );
    return conversations;
  },

  async getUnreadCounts(): Promise<Record<string, number>> {
    const { unreadCounts } = await apiGet<{ unreadCounts: Record<string, number> }>(
      '/api/v1/messages/unread/counts'
    );
    return unreadCounts;
  },
};
