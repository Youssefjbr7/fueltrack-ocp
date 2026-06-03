import { Router } from 'express';
import {
  getEngins,
  getEnginById,
  createEngin,
  updateEngin,
  deleteEngin,
  getEnginStats,
} from '../controllers/engin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getEngins);
router.get('/:id', getEnginById);
router.get('/:id/stats', getEnginStats);
router.post('/', authorize('ADMIN', 'MANAGER'), createEngin);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateEngin);
router.delete('/:id', authorize('ADMIN'), deleteEngin);

export default router;
