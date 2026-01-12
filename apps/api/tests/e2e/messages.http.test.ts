import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import supertest from 'supertest';
import { startServer, stopServer } from '../../src/index';
import { createApp } from '../../src/server';
import { createUser } from '../utils/seed';
import { authHeader } from '../utils/http';
import { connectSocket, waitForEvent, emitWithAck, disconnectSocket } from '../utils/socket';

describe('Messages HTTP E2E Tests', () => {
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

  describe('GET /api/v1/messages/:userId', () => {
    it('should return 401 without token', async () => {
      await request.get('/api/v1/messages/someuserid').expect(401);
    });

    it('should return paginated messages between two users', async () => {
      const userA = await createUser({
        name: 'User A',
        username: 'usera',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'User B',
        username: 'userb',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });

      await waitForEvent(socketA, 'connect');

      await emitWithAck(socketA, 'message:send', {
        to: userB.user.id,
        content: 'Hello from A to B - Message 1',
      });

      await emitWithAck(socketA, 'message:send', {
        to: userB.user.id,
        content: 'Hello from A to B - Message 2',
      });

      await emitWithAck(socketA, 'message:send', {
        to: userB.user.id,
        content: 'Hello from A to B - Message 3',
      });

      await disconnectSocket(socketA);

      // Now fetch messages via HTTP as user A
      const response = await request
        .get(`/api/v1/messages/${userB.user.id}`)
        .set(authHeader(userA.token))
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('messages');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.messages.length).toBe(3);

      // Verify message structure
      const firstMessage = response.body.data.messages[0];
      expect(firstMessage).toHaveProperty('_id');
      expect(firstMessage).toHaveProperty('content');
      expect(firstMessage).toHaveProperty('from');
      expect(firstMessage).toHaveProperty('to');
      expect(firstMessage).toHaveProperty('createdAt');
    });

    it('should respect limit query parameter', async () => {
      const userA = await createUser({
        name: 'User C',
        username: 'userc',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'User D',
        username: 'userd',
        password: 'password123',
      });

      const socketA = connectSocket({ port, token: userA.token });
      await waitForEvent(socketA, 'connect');

      for (let i = 1; i <= 5; i++) {
        await emitWithAck(socketA, 'message:send', {
          to: userB.user.id,
          content: `Message ${i}`,
        });
      }

      await disconnectSocket(socketA);

      const response = await request
        .get(`/api/v1/messages/${userB.user.id}`)
        .set(authHeader(userA.token))
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.data.messages.length).toBe(3);
    });
  });

  describe('GET /api/v1/messages/unread/counts', () => {
    it('should return 401 without token', async () => {
      await request.get('/api/v1/messages/unread/counts').expect(401);
    });

    it('should return correct unread message counts', async () => {
      const userA = await createUser({
        name: 'User E',
        username: 'usere',
        password: 'password123',
      });

      const userB = await createUser({
        name: 'User F',
        username: 'userf',
        password: 'password123',
      });

      const userC = await createUser({
        name: 'User G',
        username: 'userg',
        password: 'password123',
      });

      const socketB = connectSocket({ port, token: userB.token });
      await waitForEvent(socketB, 'connect');

      await emitWithAck(socketB, 'message:send', {
        to: userA.user.id,
        content: 'Message from B to A - 1',
      });

      await emitWithAck(socketB, 'message:send', {
        to: userA.user.id,
        content: 'Message from B to A - 2',
      });

      await disconnectSocket(socketB);

      const socketC = connectSocket({ port, token: userC.token });
      await waitForEvent(socketC, 'connect');

      await emitWithAck(socketC, 'message:send', {
        to: userA.user.id,
        content: 'Message from C to A - 1',
      });

      await emitWithAck(socketC, 'message:send', {
        to: userA.user.id,
        content: 'Message from C to A - 2',
      });

      await emitWithAck(socketC, 'message:send', {
        to: userA.user.id,
        content: 'Message from C to A - 3',
      });

      await disconnectSocket(socketC);

      // Wait a bit for messages to be fully persisted
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request
        .get('/api/v1/messages/unread/counts')
        .set(authHeader(userA.token))
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('unreadCounts');

      // unreadCounts is an object with userId keys
      const unreadCounts = response.body.data.unreadCounts;
      expect(typeof unreadCounts).toBe('object');

      // Should have unread messages from 2 different users
      const userIds = Object.keys(unreadCounts);
      expect(userIds.length).toBe(2);

      const totalUnread = Object.values<number>(unreadCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalUnread).toBe(5); // 2 from B + 3 from C
    });

    it('should return empty array when no unread messages', async () => {
      const user = await createUser({
        name: 'User H',
        username: 'userh',
        password: 'password123',
      });

      const response = await request
        .get('/api/v1/messages/unread/counts')
        .set(authHeader(user.token))
        .expect(200);

      expect(response.body.data.unreadCounts).toEqual({});
    });
  });
});
