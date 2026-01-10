import type { Socket } from 'socket.io';
import type { ZodTypeAny } from 'zod';
import { logger } from '../config/logger';

export type Ack = (payload: { success?: boolean; error?: string; [k: string]: unknown }) => void;

type OnEventOptions = {
  invalidAckMessage?: string;
  errorAckMessage?: string;
  silentInvalid?: boolean; // se true, ignora payload inválido sem log/ack
};

export function onEvent<T = unknown>(
  socket: Socket,
  event: string,
  schema: ZodTypeAny,
  handler: (payload: T, ack?: Ack) => Promise<void> | void,
  options?: OnEventOptions
) {
  socket.on(event, (raw: unknown, ack?: Ack) => {
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      if (!options?.silentInvalid) {
        const msg =
          options?.invalidAckMessage ?? parsed.error.issues[0]?.message ?? 'Invalid payload';
        if (typeof ack === 'function') ack({ error: msg });
      }
      return;
    }

    Promise.resolve(handler(parsed.data as T, ack)).catch((err) => {
      logger.error({ err, event }, 'socket handler failed');
      if (typeof ack === 'function') {
        ack({ error: options?.errorAckMessage ?? 'Internal error' });
      }
    });
  });
}
