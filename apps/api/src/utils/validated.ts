import type { Request } from 'express';
import type { z, ZodTypeAny } from 'zod';

export function validatedBody<TSchema extends ZodTypeAny>(
  req: Request,
  _schema: TSchema
): z.infer<TSchema> {
  return req.body as z.infer<TSchema>;
}

export function validatedParams<TSchema extends ZodTypeAny>(
  req: Request,
  _schema: TSchema
): z.infer<TSchema> {
  return req.params as z.infer<TSchema>;
}

export function validatedQuery<TSchema extends ZodTypeAny>(
  req: Request,
  _schema: TSchema
): z.infer<TSchema> {
  return req.query as z.infer<TSchema>;
}
