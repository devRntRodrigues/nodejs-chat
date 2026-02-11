import { connect } from '@nats-io/transport-node';
import type { NatsConnection } from '@nats-io/nats-core';
import { logger } from '../config/logger';

let brokerConnection: NatsConnection | null = null;

export async function initBroker(): Promise<NatsConnection> {
  if (brokerConnection && !brokerConnection.isClosed()) {
    logger.debug('NATS broker already initialized');
    return brokerConnection;
  }

  logger.info('Initializing NATS broker connection...');

  try {
    brokerConnection = await connect({
      name: 'chat-api',
      servers: [process.env.NATS_URL || 'nats://localhost:4222'],
      debug: false,
      noEcho: false,
      maxReconnectAttempts: -1,
      reconnectTimeWait: 2000,
    });

    logger.info('NATS broker connected successfully');
    return brokerConnection;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize NATS broker');
    throw new Error('NATS broker initialization failed', { cause: error });
  }
}

export function getBrokerConnection(): NatsConnection {
  if (!brokerConnection || brokerConnection.isClosed()) {
    throw new Error('Broker not initialized. Call initBroker() first.');
  }
  return brokerConnection;
}

export function isBrokerReady(): boolean {
  return brokerConnection !== null && !brokerConnection.isClosed();
}
