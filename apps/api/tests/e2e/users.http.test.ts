import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import supertest from 'supertest';
import { startServer, stopServer } from '../../src/index';
import { createApp } from '../../src/server';
import { createUser } from '../utils/seed';
import { authHeader } from '../utils/http';

describe('Users HTTP E2E Tests', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    ({ httpServer, io } = await startServer({ port: 0 }));
    const app = createApp();
    request = supertest(app);
  });

  afterAll(async () => {
    await stopServer({ httpServer, io });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return 401 without token', async () => {
      await request.get('/api/v1/users/me').expect(401);
    });

    it('should return user data with valid token', async () => {
      const { user, token } = await createUser({
        name: 'Test User',
        username: 'testuser',
        password: 'password123',
      });

      const response = await request.get('/api/v1/users/me').set(authHeader(token)).expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toMatchObject({
        id: user.id,
        name: user.name,
        username: user.username,
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return 401 without token', async () => {
      await request.get('/api/v1/users').expect(401);
    });

    it('should return list of users with valid token', async () => {
      const { token } = await createUser({
        name: 'User One',
        username: 'userone',
        password: 'password123',
      });

      await createUser({
        name: 'User Two',
        username: 'usertwo',
        password: 'password123',
      });

      await createUser({
        name: 'User Three',
        username: 'userthree',
        password: 'password123',
      });

      const response = await request.get('/api/v1/users').set(authHeader(token)).expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);

      response.body.data.users.forEach((user: { _id: string; name: string; username: string }) => {
        expect(user).toHaveProperty('_id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('username');
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should exclude password from user objects', async () => {
      const { token } = await createUser({
        name: 'Security Test',
        username: 'securitytest',
        password: 'password123',
      });

      const response = await request.get('/api/v1/users').set(authHeader(token)).expect(200);

      response.body.data.users.forEach((user: { _id: string; name: string; username: string }) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('passwordHash');
      });
    });
  });
});
