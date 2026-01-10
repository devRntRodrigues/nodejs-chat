import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);

router.post('/login', passport.authenticate('local', { session: false }), authController.login);

export default router;
