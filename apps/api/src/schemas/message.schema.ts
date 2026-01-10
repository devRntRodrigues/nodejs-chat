import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common.schema';

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

export const getMessagesQuerySchema = paginationSchema.partial();

export const getConversationsQuerySchema = paginationSchema.partial();

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type GetMessagesParams = z.infer<typeof getMessagesParamsSchema>;
