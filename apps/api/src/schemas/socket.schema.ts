import { z } from 'zod';
import { objectIdSchema } from './common.schema';

export const socketSendMessageSchema = z.object({
  to: objectIdSchema,
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(5000, 'Message must not exceed 5000 characters')
    .trim(),
});

export const socketMarkReadSchema = z.object({
  messageIds: z
    .array(objectIdSchema)
    .min(1, 'At least one message ID is required')
    .transform((ids) => Array.from(new Set(ids))),
});

export const socketTypingSchema = z.object({
  to: objectIdSchema,
});

export type SocketSendMessagePayload = z.infer<typeof socketSendMessageSchema>;
export type SocketMarkReadPayload = z.infer<typeof socketMarkReadSchema>;
export type SocketTypingPayload = z.infer<typeof socketTypingSchema>;
