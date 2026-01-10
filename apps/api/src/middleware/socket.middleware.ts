import type { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { logger } from '../config/logger';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      name: string;
      username: string;
    };
  };
}

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return next(new Error('Authentication error: Invalid token'));
    }

    const user = await User.findById(decoded.userId).select('_id name username');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.data.user = {
      id: user.id,
      name: user.name,
      username: user.username,
    };

    logger.info(`Socket authenticated for user: ${user.username}`);
    return next();
  } catch (error) {
    logger.error({ error }, 'Socket authentication error');
    return next(new Error('Authentication error'));
  }
}
