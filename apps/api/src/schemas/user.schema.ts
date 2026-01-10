import { z } from 'zod';
import { objectIdSchema } from './common.schema';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: objectIdSchema.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
