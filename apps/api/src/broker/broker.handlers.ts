import type { Server as SocketIOServer } from 'socket.io';
import type { NatsConnection } from '@nats-io/nats-core';
import { logger } from '../config/logger';
import { sendMessageService } from '../socket/services/message.socket.service';
import { markMessagesReadService } from '../socket/services/read.socket.service';
import { registerHandler } from './broker.server';
import {
  messageSendBrokerSchema,
  messageReadBrokerSchema,
  typingEventSchema,
  presenceConnectSchema,
  presenceDisconnectSchema,
} from '../schemas/broker.schema';
import { handleUserConnect, handleUserDisconnect } from './services/presence.broker.service';
import { handleTypingStart, handleTypingStop } from './services/typing.broker.service';

export function setupBrokerHandlers(_connection: NatsConnection, io: SocketIOServer): void {
  logger.info('Setting up NATS broker handlers');

  registerHandler('message.send', async (payload, _msg) => {
    const parsed = messageSendBrokerSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ topic: 'message.send', issues: parsed.error.issues }, 'Invalid payload');
      return {
        success: false,
        error: 'Validation failed',
        details: parsed.error.issues,
      };
    }

    const { fromUserId, toUserId, content } = parsed.data;

    const { message, conversation } = await sendMessageService({
      fromUserId,
      toUserId,
      content,
    });

    const fromUser = message.from as { name?: string; username?: string };
    const name = fromUser?.name ?? '';
    const username = fromUser?.username ?? '';

    io.to(`user:${fromUserId}`).emit('message:sent', { message });
    io.to(`user:${toUserId}`).emit('message:new', { message });
    io.to(`user:${toUserId}`).emit('notification:new', {
      id: message._id.toString(),
      type: 'message',
      from: { id: fromUserId, name, username },
      message: `New message from @${username}`,
      preview: content.substring(0, 50),
      conversationId: conversation._id.toString(),
      timestamp: new Date(),
    });

    logger.info({ fromUserId, toUserId, messageId: message._id }, 'Message sent via broker');

    return {
      success: true,
      messageId: message._id.toString(),
      timestamp: new Date(),
    };
  });

  registerHandler('message.read', async (payload, _msg) => {
    const parsed = messageReadBrokerSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ topic: 'message.read', issues: parsed.error.issues }, 'Invalid payload');
      return {
        success: false,
        error: 'Validation failed',
        details: parsed.error.issues,
      };
    }

    const { userId, messageIds } = parsed.data;

    const { modifiedCount, bySender } = await markMessagesReadService({ userId, messageIds });

    if (modifiedCount > 0) {
      for (const { senderId, messageIds: ids } of bySender) {
        io.to(`user:${senderId}`).emit('message:read', {
          messageIds: ids,
          readBy: userId,
        });
      }
      logger.info({ userId, modifiedCount }, 'Messages marked read via broker');
    }

    return {
      success: true,
      messageIds,
      modifiedCount,
    };
  });

  registerHandler('typing.start', async (payload) => {
    const parsed = typingEventSchema.safeParse(payload);
    if (!parsed.success) {
      logger.debug({ issues: parsed.error.issues }, 'typing.start invalid payload');
      return { success: false, error: 'Validation failed' };
    }

    const { fromUserId, toUserId, username } = parsed.data;
    handleTypingStart(fromUserId, toUserId, username ?? '', io);
    return { success: true };
  });

  registerHandler('typing.stop', async (payload) => {
    const parsed = typingEventSchema.safeParse(payload);
    if (!parsed.success) {
      logger.debug({ issues: parsed.error.issues }, 'typing.stop invalid payload');
      return { success: false, error: 'Validation failed' };
    }

    const { fromUserId, toUserId } = parsed.data;
    handleTypingStop(fromUserId, toUserId, io);
    return { success: true };
  });

  registerHandler('presence.connect', async (payload) => {
    const parsed = presenceConnectSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ topic: 'presence.connect', issues: parsed.error.issues }, 'Invalid payload');
      return { success: false, error: 'Validation failed', details: parsed.error.issues };
    }

    const { userId, socketId, username, name } = parsed.data;
    const result = await handleUserConnect(userId, socketId, username, name, io);
    return { success: true, ...result };
  });

  registerHandler('presence.disconnect', async (payload) => {
    const parsed = presenceDisconnectSchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ topic: 'presence.disconnect', issues: parsed.error.issues }, 'Invalid payload');
      return { success: false, error: 'Validation failed', details: parsed.error.issues };
    }

    const { userId, socketId, username } = parsed.data;
    const result = await handleUserDisconnect(userId, socketId, username, io);
    return { success: true, ...result };
  });
}
