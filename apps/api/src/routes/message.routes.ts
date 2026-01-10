import { Router } from 'express';
import passport from 'passport';
import * as messageController from '../controllers/message.controller';
import { validate } from '../middleware/validate.middleware';
import { getMessagesParamsSchema, getMessagesQuerySchema } from '../schemas/message.schema';

const router = Router();

const requireAuth = passport.authenticate('jwt', { session: false });

router.get('/unread/counts', requireAuth, messageController.getUnreadCountsController);

router.get(
  '/:userId',
  requireAuth,
  validate({
    params: getMessagesParamsSchema,
    query: getMessagesQuerySchema,
  }),
  messageController.getMessages
);

export default router;
