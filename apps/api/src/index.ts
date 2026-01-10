import { createServer } from 'http';
import { config } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './server';
import { createSocketServer } from './config/socket';
import { setupSocketHandlers } from './socket/handlers';
import { logger } from './config/logger';

async function start() {
  try {
    // Connect to database
    await connectDB(config.MONGO_URI);

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Create Socket.IO server
    const io = createSocketServer(httpServer);

    // Setup Socket.IO handlers
    setupSocketHandlers(io);

    // Start server
    httpServer.listen(config.PORT, () => {
      logger.info(`🚀 API server running on http://localhost:${config.PORT}`);
      logger.info(`📝 Environment: ${config.NODE_ENV}`);
      logger.info(`🔌 Socket.IO server ready`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      io.close(() => {
        logger.info('Socket.IO server closed');
        httpServer.close(async () => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
