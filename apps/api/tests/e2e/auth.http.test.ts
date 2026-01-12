import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import supertest from 'supertest';
import { startServer, stopServer } from '../../src/index';
import { createApp } from '../../src/server';

describe('Auth HTTP E2E Tests', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          username: 'johndoe',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        name: 'John Doe',
        username: 'johndoe',
      });
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should return 409 when username already exists', async () => {
      const userData = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'password123',
      };

      await request.post('/api/v1/auth/register').send(userData).expect(201);

      const response = await request.post('/api/v1/auth/register').send(userData).expect(409);

      expect(response.body).toHaveProperty('status', 409);
      expect(response.body).toHaveProperty('title');
    });

    it('should return 422 for invalid data', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          name: 'Test',
          // missing username and password
        })
        .expect(422);

      expect(response.body).toHaveProperty('status', 422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request.post('/api/v1/auth/register').send({
        name: 'Login Test',
        username: 'logintest',
        password: 'password123',
      });

      const response = await request
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.username).toBe('logintest');
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should return 401 for invalid credentials', async () => {
      await request
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 for correct username but wrong password', async () => {
      await request.post('/api/v1/auth/register').send({
        name: 'Wrong Pass Test',
        username: 'wrongpasstest',
        password: 'correctpassword',
      });

      // Try to login with wrong password
      await request
        .post('/api/v1/auth/login')
        .send({
          username: 'wrongpasstest',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
