import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UnauthorizedError } from '../utils/errors';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: unknown, user: Express.User | false | null) => {
      if (err) return next(err);

      if (!user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      req.user = user;
      return next();
    }
  )(req, res, next);
};
