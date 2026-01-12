import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import messagesRoutes from './messages.routes';
import conversationsRoutes from './conversations.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/messages', messagesRoutes);
router.use('/conversations', conversationsRoutes);

export default router;
