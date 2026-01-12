import { asyncHandler } from '../utils/asyncHandler';
import { registerUser } from '../services/auth.service';
import { generateToken } from '../utils/jwt';
import { requireUser } from '../utils/authUser';
import { created, ok } from '../utils/http';
import { validatedBody } from '../utils/validated';
import { registerSchema } from '../schemas/auth.schema';

export const register = asyncHandler(async (req, res) => {
  const { name, username, password } = validatedBody(req, registerSchema);

  const result = await registerUser(name, username, password);
  created(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const user = requireUser(req);

  const token = generateToken(user.id);

  ok(res, {
    user: { id: user.id, name: user.name, username: user.username },
    token,
  });
});
