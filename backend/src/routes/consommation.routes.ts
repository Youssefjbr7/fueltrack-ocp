import { Router } from 'express';
import {
  getConsommations,
  getConsommationById,
  createConsommation,
  updateConsommation,
  deleteConsommation,
} from '../controllers/consommation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getConsommations);
router.get('/:id', getConsommationById);
router.post('/', authorize('ADMIN', 'MANAGER'), createConsommation);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateConsommation);
router.delete('/:id', authorize('ADMIN'), deleteConsommation);

export default router;
