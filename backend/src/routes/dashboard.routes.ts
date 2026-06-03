import { Router } from 'express';
import { getDashboardStats, getAlerts } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/alerts', getAlerts);

export default router;
