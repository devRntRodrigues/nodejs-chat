import { Router } from 'express';
import passport from 'passport';
import * as authController from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../../schemas/auth.schema';

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);

router.post(
  '/login',
  validate({ body: loginSchema }),
  passport.authenticate('local', { session: false }),
  authController.login
);

export default router;
