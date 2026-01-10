import type { Request } from 'express';
import { UnauthorizedError } from './errors';

export function requireAuthUser(req: Request): Express.User {
  const user = req.user;
  if (!user) throw new UnauthorizedError('Unauthorized');
  return user;
}

export function requireUserId(req: Request): string {
  return requireAuthUser(req).id;
}
