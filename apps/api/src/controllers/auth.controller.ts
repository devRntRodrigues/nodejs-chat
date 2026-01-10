import { asyncHandler } from '../utils/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { registerUser } from '../services/auth.service';
import { generateToken } from '../utils/jwt';

export const register = asyncHandler(async (req, res) => {
  const { name, username, password } = req.body;

  const result = await registerUser(name, username, password);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const token = generateToken(user.id);

  res.json({
    user: { id: user.id, name: user.name, username: user.username },
    token,
  });
});
