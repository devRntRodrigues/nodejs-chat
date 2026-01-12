import supertest from 'supertest';
import { createApp } from '../../src/server';

interface CreateUserParams {
  name: string;
  username: string;
  password: string;
}

interface UserResponse {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserResult {
  user: UserResponse;
  token: string;
}

export async function createUser({
  name,
  username,
  password,
}: CreateUserParams): Promise<CreateUserResult> {
  const app = createApp();
  const request = supertest(app);

  const registerResponse = await request
    .post('/api/v1/auth/register')
    .send({ name, username, password })
    .expect(201);

  const { user, token } = registerResponse.body.data;

  return { user, token };
}
