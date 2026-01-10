import pino from 'pino';
import { config } from './env';

const isDevelopment = config.NODE_ENV === 'development';

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});
