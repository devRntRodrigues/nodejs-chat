import type { Express } from 'express';
import supertest from 'supertest';

export const makeRequest = (app: Express) => supertest(app);

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
