'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { chatApi } from '@/lib/chatApi';
import type { ChatMessage } from '@/types/chat';

export function useChat() {
  const { socket, onlineUsers } = useSocket();
  const { user } = useAuth();
  const { addNotification, incrementUnread, markAsRead, getUnreadCount, syncUnreadCounts } =
    useNotifications();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const syncUnread = async () => {
      try {
        const counts = await chatApi.getUnreadCounts();
        syncUnreadCounts(counts);
      } catch (error) {
        console.error('Failed to sync unread counts:', error);
      }
    };

    syncUnread();
  }, [user, syncUnreadCounts]);

  useEffect(() => {
    if (!selectedUserId) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const fetchedMessages = await chatApi.getMessages(selectedUserId);
        setMessages((prev) => ({
          ...prev,
          [selectedUserId]: fetchedMessages,
        }));
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!messages[selectedUserId]) {
      loadMessages();
    }
  }, [messages, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || !socket || !user) return;

    const conversationMessages = messages[selectedUserId] || [];
    const unreadMessageIds = conversationMessages
      .filter((msg) => {
        const fromId = typeof msg.from === 'string' ? msg.from : msg.from._id;
        return fromId === selectedUserId && !msg.read;
      })
      .map((msg) => msg._id);

    if (unreadMessageIds.length > 0) {
      socket.emit('message:read', { messageIds: unreadMessageIds });
    }
  }, [selectedUserId, messages, socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageNew = ({ message }: { message: ChatMessage }) => {
      const fromId = typeof message.from === 'string' ? message.from : message.from._id;
      const toId = typeof message.to === 'string' ? message.to : message.to._id;
      const conversationUserId = fromId === user?.id ? toId : fromId;

      setMessages((prev) => ({
        ...prev,
        [conversationUserId]: [...(prev[conversationUserId] || []), message],
      }));

      if (selectedUserId === conversationUserId) {
        socket.emit('message:read', { messageIds: [message._id] });
      } else {
        incrementUnread(conversationUserId);
      }
    };

    const handleMessageSent = ({ message }: { message: ChatMessage }) => {
      const toId = typeof message.to === 'string' ? message.to : message.to._id;

      setMessages((prev) => ({
        ...prev,
        [toId]: [...(prev[toId] || []), message],
      }));
    };

    const handleTypingStart = ({ from, username }: { from: string; username: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [from]: username,
      }));

      setTimeout(() => {
        setTypingUsers((prev) => {
          const newState = { ...prev };
          delete newState[from];
          return newState;
        });
      }, 3000);
    };

    const handleTypingStop = ({ from }: { from: string }) => {
      setTypingUsers((prev) => {
        const newState = { ...prev };
        delete newState[from];
        return newState;
      });
    };

    const handleMessageRead = ({ messageIds }: { messageIds: string[] }) => {
      setMessages((prev) => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach((userId) => {
          newMessages[userId] = newMessages[userId].map((msg) =>
            messageIds.includes(msg._id)
              ? { ...msg, read: true, readAt: new Date().toISOString() }
              : msg
          );
        });
        return newMessages;
      });
    };

    const handleNotificationNew = (data: {
      id: string;
      type: string;
      from: { id: string; name: string; username: string };
      message: string;
      preview: string;
      conversationId: string;
      timestamp: Date;
    }) => {
      if (selectedUserId !== data.conversationId) {
        addNotification(data);
      }
    };

    socket.on('message:new', handleMessageNew);
    socket.on('message:sent', handleMessageSent);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('message:sent', handleMessageSent);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
      socket.off('notification:new', handleNotificationNew);
    };
  }, [socket, user, selectedUserId, addNotification, incrementUnread]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !selectedUserId || !content.trim()) return;

      socket.emit(
        'message:send',
        {
          to: selectedUserId,
          content: content.trim(),
        },
        (response: { success?: boolean; error?: string }) => {
          if (response.error) {
            console.log('response', response);
            console.error('Failed to send message:', response.error);
          }
        }
      );
    },
    [socket, selectedUserId]
  );

  const sendTypingStart = useCallback(() => {
    if (!socket || !selectedUserId) return;
    socket.emit('typing:start', { to: selectedUserId });
  }, [socket, selectedUserId]);

  const sendTypingStop = useCallback(() => {
    if (!socket || !selectedUserId) return;
    socket.emit('typing:stop', { to: selectedUserId });
  }, [socket, selectedUserId]);

  // Mark as read when selecting a conversation
  const selectUser = useCallback(
    (userId: string) => {
      setSelectedUserId(userId);
      markAsRead(userId);
    },
    [markAsRead]
  );

  return {
    selectedUserId,
    setSelectedUserId: selectUser,
    messages: messages[selectedUserId || ''] || [],
    loading,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    typingUsername: selectedUserId ? typingUsers[selectedUserId] || null : null,
    onlineUsers,
    getUnreadCount,
  };
}
