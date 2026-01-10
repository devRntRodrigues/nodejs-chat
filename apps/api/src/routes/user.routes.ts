import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { listUsersQuerySchema } from '../schemas/user.schema';

const router = Router();

router.get('/me', requireAuth, userController.getCurrentUser);

router.get(
  '/',
  requireAuth,
  validate({ query: listUsersQuerySchema.partial() }),
  userController.getAllUsers
);

export default router;
