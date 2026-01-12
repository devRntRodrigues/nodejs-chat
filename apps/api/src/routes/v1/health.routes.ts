import { Router } from 'express';
import { ok } from '../../utils/http';

const router = Router();

router.get('/', (_req, res) => {
  ok(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
