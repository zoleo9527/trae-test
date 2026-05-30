import { Router } from 'express';
import { login, getCurrentUser, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '../schemas/auth';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export default router;
