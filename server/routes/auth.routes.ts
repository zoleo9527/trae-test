import { Router } from 'express';
import { loginController, meController } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { LoginSchema } from '../types/dto';

const router = Router();

router.post('/login', validate(LoginSchema), loginController);
router.get('/me', authenticate, meController);

export default router;
