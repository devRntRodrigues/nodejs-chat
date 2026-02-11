import type { Server as SocketIOServer } from 'socket.io';
import { logger } from '../../config/logger';
import { User } from '../../models/User';
import { addUserSocket, removeUserSocket, getOnlineUserIds } from '../../socket/presence.store';

export async function handleUserConnect(
  userId: string,
  socketId: string,
  username: string,
  _name: string | undefined,
  io: SocketIOServer
): Promise<{ isFirstConnection: boolean; onlineUserIds: string[] }> {
  const isFirstConnection = addUserSocket(userId, socketId);

  if (isFirstConnection) {
    io.emit('user:online', { userId, username });
    logger.info({ userId, username, socketId }, 'User came online');
  }

  const onlineUserIds = getOnlineUserIds();
  io.to(`user:${userId}`).emit('users:online', { userIds: onlineUserIds });

  return { isFirstConnection, onlineUserIds };
}

export async function handleUserDisconnect(
  userId: string,
  socketId: string,
  username: string,
  io: SocketIOServer
): Promise<{ wasLastConnection: boolean }> {
  const wasLastConnection = removeUserSocket(userId, socketId);

  if (wasLastConnection) {
    await User.findByIdAndUpdate(userId, {
      lastSeen: new Date(),
    });

    io.emit('user:offline', { userId, username });
    logger.info({ userId, username, socketId }, 'User went offline');
  }

  return { wasLastConnection };
}
