import type { Server as SocketIOServer } from 'socket.io';
import { logger } from '../config/logger';
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
import { getBrokerConnection } from '../broker/broker.module';
import { publish } from '../broker/broker.service';

export function setupSocketHandlers(io: SocketIOServer) {
  logger.info('Setting up Socket.IO handlers');

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { id: userId, username, name } = socket.data.user;

    logger.info(`Socket connected: ${socket.id} (User: ${username})`);

    socket.join(`user:${userId}`);

    publish(getBrokerConnection(), 'presence.connect', {
      userId,
      socketId: socket.id,
      username,
      name,
    });

    // --- DEPRECATED: Migrated to NATS broker handlers (apps/api/src/broker/broker.handlers.ts).
    //
    // onEvent<SocketSendMessagePayload>(socket, 'message:send', socketSendMessageSchema, async ({ to, content }, callback) => {
    //   const { message, conversation } = await sendMessageService({ fromUserId: userId, toUserId: to, content });
    //   callback?.({ success: true, message });
    //   socket.emit('message:sent', { message });
    //   io.to(`user:${to}`).emit('message:new', { message });
    //   io.to(`user:${to}`).emit('notification:new', { ... });
    //   logger.info(`Message sent from ${username} to user ${to}`);
    // }, { invalidAckMessage: 'Invalid message data', errorAckMessage: 'Failed to send message' });
    //
    // onEvent<SocketTypingPayload>(socket, 'typing:start', socketTypingSchema, ({ to }) => {
    //   io.to(`user:${to}`).emit('typing:start', { from: userId, username });
    // }, { silentInvalid: true });
    //
    // onEvent<SocketTypingPayload>(socket, 'typing:stop', socketTypingSchema, ({ to }) => {
    //   io.to(`user:${to}`).emit('typing:stop', { from: userId });
    // }, { silentInvalid: true });
    //
    // onEvent<SocketMarkReadPayload>(socket, 'message:read', socketMarkReadSchema, async ({ messageIds }) => {
    //   const { modifiedCount, bySender } = await markMessagesReadService({ userId, messageIds });
    //   if (modifiedCount > 0) { bySender.forEach(({ senderId, messageIds }) => { io.to(`user:${senderId}`).emit('message:read', { messageIds, readBy: userId }); }); }
    //   logger.info(`User ${username} marked ${modifiedCount} messages as read`);
    // });

    onEvent<SocketSendMessagePayload>(
      socket,
      'message:send',
      socketSendMessageSchema,
      async ({ to, content }, callback) => {
        try {
          const payload = {
            fromUserId: userId,
            toUserId: to,
            content,
          };
          publish(getBrokerConnection(), 'message.send', payload);
          callback?.({ success: true });
        } catch (err) {
          logger.error({ err, userId, to }, 'Forward message.send to broker failed');
          callback?.({ success: false, error: 'Failed to send message' });
        }
      },
      { invalidAckMessage: 'Invalid message data', errorAckMessage: 'Failed to send message' }
    );

    onEvent<SocketTypingPayload>(
      socket,
      'typing:start',
      socketTypingSchema,
      ({ to }) => {
        publish(getBrokerConnection(), 'typing.start', {
          fromUserId: userId,
          toUserId: to,
          username,
        });
      },
      { silentInvalid: true }
    );

    onEvent<SocketTypingPayload>(
      socket,
      'typing:stop',
      socketTypingSchema,
      ({ to }) => {
        publish(getBrokerConnection(), 'typing.stop', {
          fromUserId: userId,
          toUserId: to,
        });
      },
      { silentInvalid: true }
    );

    onEvent<SocketMarkReadPayload>(
      socket,
      'message:read',
      socketMarkReadSchema,
      async ({ messageIds }) => {
        publish(getBrokerConnection(), 'message.read', {
          userId,
          messageIds,
        });
      }
    );

    socket.on('disconnect', () => {
      publish(getBrokerConnection(), 'presence.disconnect', {
        userId,
        socketId: socket.id,
        username,
      });
      logger.info(`Socket disconnected: ${socket.id} (User: ${username})`);
    });
  });
}
