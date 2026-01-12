import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import supertest from 'supertest';
import { startServer, stopServer } from '../../src/index';
import { createApp } from '../../src/server';
import { createUser } from '../utils/seed';
import { authHeader } from '../utils/http';
import { connectSocket, waitForEvent, emitWithAck, disconnectSocket } from '../utils/socket';

describe('Socket.IO E2E Tests', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let port: number;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    ({ httpServer, io, port } = await startServer({ port: 0 }));
    const app = createApp();
    request = supertest(app);
  });

  afterAll(async () => {
    await stopServer({ httpServer, io });
  });

  describe('Socket Authentication', () => {
    it('should fail to connect without token', async () => {
      return new Promise<void>((resolve) => {
        const socket = connectSocket({ port, token: '' });

        socket.on('connect_error', (error) => {
          expect(error).toBeDefined();
          socket.disconnect();
          resolve();
        });

        socket.on('connect', () => {
          socket.disconnect();
          throw new Error('Socket should not connect without token');
        });

        setTimeout(() => {
          socket.disconnect();
          resolve();
        }, 3000);
      });
    });

    it('should connect successfully with valid token', async () => {
      const user = await createUser({
        name: 'Socket Auth Test',
        username: 'socketauthtest',
        password: 'password123',
      });

      const socket = connectSocket({ port, token: user.token });

      await waitForEvent(socket, 'connect');

      expect(socket.connected).toBe(true);

      await disconnectSocket(socket);
    });
  });

  describe('Online/Offline Presence', () => {
    it('should receive users:online event on connection', async () => {
      const userA = await createUser({
        name: 'Presence User A',
        username: 'presenceusera',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });

      const onlineData = await waitForEvent<{ userIds: string[] }>(socketA, 'users:online');

      expect(onlineData).toHaveProperty('userIds');
      expect(Array.isArray(onlineData.userIds)).toBe(true);
      expect(onlineData.userIds).toContain(userA.user.id);

      await disconnectSocket(socketA);
    });

    it('should notify other users when a user comes online', async () => {
      const userA = await createUser({
        name: 'Online User A',
        username: 'onlineusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Online User B',
        username: 'onlineuserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      const onlinePromise = waitForEvent<{ userId: string; username: string }>(
        socketA,
        'user:online'
      );

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      const onlineEvent = await onlinePromise;
      expect(onlineEvent.userId).toBe(userB.user.id);
      expect(onlineEvent.username).toBe(userB.user.username);

      await disconnectSocket(socketA);
      await disconnectSocket(socketB);
    });

    it('should notify other users when a user goes offline', async () => {
      const userA = await createUser({
        name: 'Offline User A',
        username: 'offlineusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Offline User B',
        username: 'offlineuserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      const offlinePromise = waitForEvent<{ userId: string; username: string }>(
        socketA,
        'user:offline'
      );

      await disconnectSocket(socketB);

      const offlineEvent = await offlinePromise;
      expect(offlineEvent.userId).toBe(userB.user.id);
      expect(offlineEvent.username).toBe(userB.user.username);

      await disconnectSocket(socketA);
    });
  });

  describe('Message Sending and Receiving', () => {
    it('should send and receive messages with acknowledgement', async () => {
      const userA = await createUser({
        name: 'Message User A',
        username: 'messageusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Message User B',
        username: 'messageuserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      const messageNewPromise = waitForEvent<{ message: any }>(socketB, 'message:new');
      const messageSentPromise = waitForEvent<{ message: any }>(socketA, 'message:sent');

      const ackResponse = await emitWithAck<{ success: boolean; message: any }>(
        socketA,
        'message:send',
        {
          to: userB.user.id,
          content: 'Hello from A to B!',
        }
      );

      expect(ackResponse).toHaveProperty('success', true);
      expect(ackResponse).toHaveProperty('message');
      expect(ackResponse.message).toHaveProperty('content', 'Hello from A to B!');

      const sentEvent = await messageSentPromise;
      expect(sentEvent.message.content).toBe('Hello from A to B!');

      const newMessageEvent = await messageNewPromise;
      expect(newMessageEvent.message.content).toBe('Hello from A to B!');
      expect(newMessageEvent.message.from).toBeDefined();

      await disconnectSocket(socketA);
      await disconnectSocket(socketB);
    });

    it('should persist messages to database', async () => {
      const userA = await createUser({
        name: 'Persist User A',
        username: 'persistusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Persist User B',
        username: 'persistuserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      await emitWithAck(socketA, 'message:send', {
        to: userB.user.id,
        content: 'This message should persist',
      });

      await disconnectSocket(socketA);

      const response = await request
        .get(`/api/v1/messages/${userB.user.id}`)
        .set(authHeader(userA.token))
        .expect(200);

      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.messages[0].content).toBe('This message should persist');
    });

    it('should send notification:new event to recipient', async () => {
      const userA = await createUser({
        name: 'Notif User A',
        username: 'notifusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Notif User B',
        username: 'notifuserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      const notificationPromise = waitForEvent<any>(socketB, 'notification:new');

      await emitWithAck(socketA, 'message:send', {
        to: userB.user.id,
        content: 'Test notification',
      });

      const notification = await notificationPromise;
      expect(notification).toHaveProperty('type', 'message');
      expect(notification).toHaveProperty('from');
      expect(notification.from.id).toBe(userA.user.id);
      expect(notification).toHaveProperty('preview');

      await disconnectSocket(socketA);
      await disconnectSocket(socketB);
    });
  });

  describe('Read Receipts', () => {
    it('should mark messages as read and notify sender', async () => {
      const userA = await createUser({
        name: 'Read User A',
        username: 'readusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Read User B',
        username: 'readuserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      const ack1 = await emitWithAck<{ success: boolean; message: any }>(socketA, 'message:send', {
        to: userB.user.id,
        content: 'Message 1',
      });

      const ack2 = await emitWithAck<{ success: boolean; message: any }>(socketA, 'message:send', {
        to: userB.user.id,
        content: 'Message 2',
      });

      const messageId1 = ack1.message._id || ack1.message.id;
      const messageId2 = ack2.message._id || ack2.message.id;

      const readReceiptPromise = waitForEvent<{ messageIds: string[]; readBy: string }>(
        socketA,
        'message:read'
      );

      socketB.emit('message:read', {
        messageIds: [messageId1, messageId2],
      });

      const readReceipt = await readReceiptPromise;
      expect(readReceipt).toHaveProperty('messageIds');
      expect(readReceipt).toHaveProperty('readBy', userB.user.id);
      expect(readReceipt.messageIds).toContain(messageId1);
      expect(readReceipt.messageIds).toContain(messageId2);

      await disconnectSocket(socketA);
      await disconnectSocket(socketB);
    });
  });

  describe('Typing Indicators', () => {
    it('should broadcast typing start and stop events', async () => {
      const userA = await createUser({
        name: 'Typing User A',
        username: 'typingusera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'Typing User B',
        username: 'typinguserb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      const typingStartPromise = waitForEvent<{ from: string; username: string }>(
        socketB,
        'typing:start'
      );

      socketA.emit('typing:start', { to: userB.user.id });

      const typingStart = await typingStartPromise;
      expect(typingStart.from).toBe(userA.user.id);
      expect(typingStart.username).toBe(userA.user.username);
      const typingStopPromise = waitForEvent<{ from: string }>(socketB, 'typing:stop');
      socketA.emit('typing:stop', { to: userB.user.id });

      const typingStop = await typingStopPromise;
      expect(typingStop.from).toBe(userA.user.id);

      await disconnectSocket(socketA);
      await disconnectSocket(socketB);
    });
  });
});
