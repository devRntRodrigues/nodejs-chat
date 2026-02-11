import { z } from 'zod';
import { objectIdSchema } from './common.schema';

export const typingEventSchema = z.object({
  fromUserId: objectIdSchema,
  toUserId: objectIdSchema,
  username: z.string().min(1).optional(),
});

export const presenceConnectSchema = z.object({
  userId: objectIdSchema,
  socketId: z.string().min(1),
  username: z.string().min(1),
  name: z.string().min(1).optional(),
});

export const presenceDisconnectSchema = z.object({
  userId: objectIdSchema,
  socketId: z.string().min(1),
  username: z.string().min(1),
});

export const messageSendBrokerSchema = z.object({
  fromUserId: objectIdSchema,
  toUserId: objectIdSchema,
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(5000, 'Message must not exceed 5000 characters')
    .trim(),
  messageId: z.string().optional(),
});

export const messageReadBrokerSchema = z.object({
  userId: objectIdSchema,
  messageIds: z
    .array(objectIdSchema)
    .min(1, 'At least one message ID is required')
    .transform((ids) => Array.from(new Set(ids))),
});

export type TypingEventPayload = z.infer<typeof typingEventSchema>;
export type PresenceConnectPayload = z.infer<typeof presenceConnectSchema>;
export type PresenceDisconnectPayload = z.infer<typeof presenceDisconnectSchema>;
export type MessageSendBrokerPayload = z.infer<typeof messageSendBrokerSchema>;
export type MessageReadBrokerPayload = z.infer<typeof messageReadBrokerSchema>;
