import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getUsers, updateUser, deleteUser } from '../controllers/auth.controller';

const router = Router();

router.use(authenticate);

// Note: authorize prend des arguments séparés, pas un tableau
router.get('/', authorize('ADMIN', 'MANAGER'), getUsers);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;