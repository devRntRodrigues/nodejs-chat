import {
  Msg,
  NatsConnection,
  PublishOptions,
  Subscription,
  SubscriptionOptions,
} from '@nats-io/nats-core';
import { logger } from '../config/logger';
import { omit } from 'lodash-es';

export type MqttHandler = (topic: string, payload: unknown, message: Msg) => void;

export const publish = (
  connection: NatsConnection,
  topic: string,
  payload: unknown,
  opts?: Partial<PublishOptions>
): void => {
  logger.info({ topic, payload }, 'Publishing message to topic');
  connection.publish(topic, JSON.stringify(payload), opts);
  logger.info({ topic, payload, opts }, 'Message published to topic');
};

export const subscribe = (
  connection: NatsConnection,
  topic: string,
  options?: Partial<SubscriptionOptions>
): Subscription => {
  logger.info({ topic, options }, 'Subscribing to topic');
  return connection.subscribe(topic, omit(options, ['onTimeout']));
};

export const reply = (connection: NatsConnection, message: Msg, payload: unknown) => {
  if (!message.reply) {
    logger.error({ message }, 'Message has no reply');
    return;
  }
  connection.publish(message.reply, JSON.stringify(payload));
  logger.info({ message, payload }, `Replied to message to topic ${message.reply}`);
};

export const closeBroker = async (connection: NatsConnection): Promise<void> => {
  try {
    logger.info('Draining NATS connection...');
    await connection.drain();

    logger.info('NATS connection drained successfully');
  } catch (error) {
    await connection.close();
    logger.error({ err: error }, 'Error draining NATS connection');
  }
};
