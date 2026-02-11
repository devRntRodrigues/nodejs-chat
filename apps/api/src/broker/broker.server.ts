import type { Msg, NatsConnection } from '@nats-io/nats-core';
import { reply } from './broker.service';
import { logger } from '../config/logger';

export type BrokerHandler = (payload: unknown, message: Msg) => Promise<unknown> | unknown;

const handlers = new Map<string, BrokerHandler>();

export const startBrokerServer = (connection: NatsConnection) => {
  brokerServerListener(connection);
  logger.info('NATS broker server started');
};

export const registerHandler = (topic: string, handler: BrokerHandler) => {
  handlers.set(topic, handler);
};

export const getHandler = (topic: string): BrokerHandler | undefined => {
  return handlers.get(topic);
};

async function handleBrokerMessage(connection: NatsConnection, msg: Msg): Promise<void> {
  const handler = getHandler(msg.subject);

  if (!handler) {
    reply(connection, msg, {
      error: 'Handler not found',
      subject: msg.subject,
    });
    return;
  }

  // Parse JSON payload with specific error handling
  let payload: unknown;
  try {
    payload = JSON.parse(msg.data.toString());
  } catch (parseError) {
    logger.error({ topic: msg.subject, error: parseError }, 'Invalid JSON payload');
    if (msg.reply) {
      reply(connection, msg, {
        error: 'Invalid JSON format',
        message: parseError instanceof Error ? parseError.message : 'Failed to parse message',
      });
    }
    return;
  }

  // Handle the message with parsed payload
  try {
    const response = await Promise.resolve(handler(payload, msg));

    if (msg.reply && response !== undefined) {
      reply(connection, msg, response);
    }
  } catch (error) {
    logger.error({ topic: msg.subject, error }, 'Handler error');
    if (msg.reply) {
      reply(connection, msg, {
        error: 'Internal handler error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const brokerServerListener = (connection: NatsConnection) => {
  connection.subscribe('>', {
    callback: (err: Error | null, msg: Msg) => {
      if (err) {
        logger.error({ err }, 'Error subscribing to topic');
        return;
      }
      void handleBrokerMessage(connection, msg);
    },
  });
};
