import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../config/logger';
import { User } from '../models/User';
import { AuthenticatedSocket } from '../middleware/socket.middleware';
import {
  socketSendMessageSchema,
  socketMarkReadSchema,
  socketTypingSchema,
  type SocketSendMessagePayload,
  type SocketMarkReadPayload,
  type SocketTypingPayload,
} from '../schemas/socket.schema';
import { onEvent } from './utils';
import { sendMessageService } from './services/message.socket.service';
import { markMessagesReadService } from './services/read.socket.service';
import { addUserSocket, removeUserSocket, getOnlineUserIds } from './presence.store';

export function setupSocketHandlers(io: SocketIOServer) {
  logger.info('Setting up Socket.IO handlers');

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { id: userId, username, name } = socket.data.user;

    logger.info(`Socket connected: ${socket.id} (User: ${username})`);

    socket.join(`user:${userId}`);

    const isFirstConnection = addUserSocket(userId, socket.id);

    if (isFirstConnection) {
      io.emit('user:online', { userId, username });
    }

    const onlineUsersList = getOnlineUserIds();
    socket.emit('users:online', { userIds: onlineUsersList });

    onEvent<SocketSendMessagePayload>(
      socket,
      'message:send',
      socketSendMessageSchema,
      async ({ to, content }, callback) => {
        const { message, conversation } = await sendMessageService({
          fromUserId: userId,
          toUserId: to,
          content,
        });

        callback?.({ success: true, message });

        socket.emit('message:sent', { message });

        io.to(`user:${to}`).emit('message:new', { message });

        io.to(`user:${to}`).emit('notification:new', {
          id: message._id.toString(),
          type: 'message',
          from: {
            id: userId,
            name,
            username,
          },
          message: `New message from @${username}`,
          preview: content.substring(0, 50),
          conversationId: conversation._id.toString(),
          timestamp: new Date(),
        });

        logger.info(`Message sent from ${username} to user ${to}`);
      },
      { invalidAckMessage: 'Invalid message data', errorAckMessage: 'Failed to send message' }
    );

    onEvent<SocketTypingPayload>(
      socket,
      'typing:start',
      socketTypingSchema,
      ({ to }) => {
        io.to(`user:${to}`).emit('typing:start', { from: userId, username });
      },
      { silentInvalid: true }
    );

    onEvent<SocketTypingPayload>(
      socket,
      'typing:stop',
      socketTypingSchema,
      ({ to }) => {
        io.to(`user:${to}`).emit('typing:stop', { from: userId });
      },
      { silentInvalid: true }
    );

    onEvent<SocketMarkReadPayload>(
      socket,
      'message:read',
      socketMarkReadSchema,
      async ({ messageIds }) => {
        const { modifiedCount, bySender } = await markMessagesReadService({
          userId,
          messageIds,
        });

        if (modifiedCount > 0) {
          bySender.forEach(({ senderId, messageIds }) => {
            io.to(`user:${senderId}`).emit('message:read', {
              messageIds,
              readBy: userId,
            });
          });

          logger.info(`User ${username} marked ${modifiedCount} messages as read`);
        }
      }
    );

    socket.on('disconnect', async () => {
      const wasLastConnection = removeUserSocket(userId, socket.id);

      if (wasLastConnection) {
        try {
          await User.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (error) {
          logger.error('Error updating lastSeen:', error);
        }

        io.emit('user:offline', { userId, username });
      }

      logger.info(`Socket disconnected: ${socket.id} (User: ${username})`);
    });
  });
}
