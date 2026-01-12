import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import passport from './config/passport';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
      customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );
  app.use(express.json());

  app.use(passport.initialize());

  const authLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 10, // 10 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/v1/auth', authLimiter);

  app.use('/api', routes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      type: 'https://api.chat.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'The requested resource was not found',
      instance: _req.path,
    });
  });

  app.use(errorHandler);

  return app;
}
