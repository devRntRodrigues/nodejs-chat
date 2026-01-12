import { createServer } from 'http';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { createApp } from './server';
import { createSocketServer } from './config/socket';
import { setupSocketHandlers } from './socket/handlers';
import { logger } from './config/logger';

interface StartServerOptions {
  port?: number;
}

interface ServerInstances {
  httpServer: HTTPServer;
  io: SocketIOServer;
  port: number;
}

export async function startServer(options: StartServerOptions = {}): Promise<ServerInstances> {
  const { port = config.PORT } = options;

  await connectDB(process.env.MONGODB_URI || config.MONGO_URI);

  const app = createApp();

  const httpServer = createServer(app);

  const io = createSocketServer(httpServer);

  setupSocketHandlers(io);

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      resolve();
    });
  });

  const address = httpServer.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;

  logger.info(`🚀 API server running on http://localhost:${actualPort}`);
  logger.info(`📝 Environment: ${config.NODE_ENV}`);
  logger.info(`🔌 Socket.IO server ready`);

  return { httpServer, io, port: actualPort };
}

export async function stopServer({
  httpServer,
  io,
}: Pick<ServerInstances, 'httpServer' | 'io'>): Promise<void> {
  return new Promise<void>((resolve) => {
    io.close(() => {
      logger.info('Socket.IO server closed');
      httpServer.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDB();
        resolve();
      });
    });
  });
}

async function start() {
  try {
    const { httpServer, io } = await startServer();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      await stopServer({ httpServer, io });
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
