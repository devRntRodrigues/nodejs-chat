import type { Server as SocketIOServer } from 'socket.io';
import { logger } from '../../config/logger';

export function handleTypingStart(
  fromUserId: string,
  toUserId: string,
  username: string,
  io: SocketIOServer
): void {
  io.to(`user:${toUserId}`).emit('typing:start', { from: fromUserId, username });
  logger.debug({ fromUserId, toUserId }, 'Typing started');
}

export function handleTypingStop(fromUserId: string, toUserId: string, io: SocketIOServer): void {
  io.to(`user:${toUserId}`).emit('typing:stop', { from: fromUserId });
  logger.debug({ fromUserId, toUserId }, 'Typing stopped');
}
