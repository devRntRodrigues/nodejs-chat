import { z } from 'zod';
import { objectIdSchema } from './common.schema';

export const sendMessageSchema = z.object({
  to: objectIdSchema,
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(5000, 'Message must not exceed 5000 characters')
    .trim(),
});

export const markReadSchema = z.object({
  messageIds: z
    .array(objectIdSchema)
    .min(1, 'At least one message ID is required')
    .transform((ids) => Array.from(new Set(ids))),
});

export const getMessagesParamsSchema = z.object({
  userId: objectIdSchema,
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const getConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: objectIdSchema.optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type GetMessagesParams = z.infer<typeof getMessagesParamsSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type GetConversationsQuery = z.infer<typeof getConversationsQuerySchema>;
