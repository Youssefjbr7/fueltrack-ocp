import { Router } from 'express';
import { login, getProfile, register, changePassword } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/register', authenticate, authorize('ADMIN'), register);
router.put('/change-password', authenticate, changePassword);

export default router;
