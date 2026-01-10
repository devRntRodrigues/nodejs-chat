import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ConflictError } from '../utils/errors';

export interface RegisterUserResult {
  user: {
    id: string;
    name: string;
    username: string;
    createdAt: Date;
  };
  token: string;
}

export async function registerUser(
  name: string,
  username: string,
  password: string
): Promise<RegisterUserResult> {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new ConflictError('Username already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    username,
    passwordHash,
  });

  const token = generateToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
    },
    token,
  };
}
