import { Router } from 'express';
import passport from 'passport';
import * as messageController from '../../controllers/message.controller';
import { validate } from '../../middleware/validate.middleware';
import { getConversationsQuerySchema } from '../../schemas/message.schema';

const router = Router();

const requireAuth = passport.authenticate('jwt', { session: false });

router.get(
  '/',
  requireAuth,
  validate({ query: getConversationsQuerySchema }),
  messageController.getConversations
);

export default router;
