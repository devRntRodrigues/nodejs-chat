import type { Request } from 'express';
import { UnauthorizedError } from './errors';

export function requireUser(req: Request): Express.User {
  const user = req.user;
  if (!user) throw new UnauthorizedError('Authentication required');
  return user;
}

export function requireUserId(req: Request): string {
  return requireUser(req).id;
}
