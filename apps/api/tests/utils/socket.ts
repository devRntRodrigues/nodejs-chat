import { io as ioClient, Socket } from 'socket.io-client';

interface ConnectSocketParams {
  port: number;
  token: string;
}

export function connectSocket({ port, token }: ConnectSocketParams): Socket {
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function waitForEvent<T = any>(
  socket: Socket,
  event: string,
  timeoutMs: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeoutMs);

    socket.once(event, (data: T) => {
      clearTimeout(timeout);
      resolve(data);
    });
  });
}

export function emitWithAck<T = any>(socket: Socket, event: string, payload: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ack on event: ${event}`));
    }, 5000);

    socket.emit(event, payload, (response: T) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

export function disconnectSocket(socket: Socket): Promise<void> {
  return new Promise((resolve) => {
    if (socket.connected) {
      socket.once('disconnect', () => {
        resolve();
      });
      socket.disconnect();
    } else {
      resolve();
    }
  });
}
