'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    if (socketRef.current) return;

    const s = getSocket(token);
    socketRef.current = s;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleUsersOnline = ({ userIds }: { userIds: string[] }) => {
      setOnlineUsers(new Set(userIds));
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    s.on('user:online', handleUserOnline);
    s.on('user:offline', handleUserOffline);
    s.on('users:online', handleUsersOnline);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('user:online', handleUserOnline);
      s.off('user:offline', handleUserOffline);
      s.off('users:online', handleUsersOnline);

      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers(new Set());
    };
  }, [isAuthenticated, token]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
      onlineUsers,
    }),
    [isConnected, onlineUsers]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
