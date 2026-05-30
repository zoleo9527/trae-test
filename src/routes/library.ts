import { Router } from 'express';
import { getLibraryList, getLibraryDetail, getLibraryStats } from '../controllers/libraryController';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { paginationSchema } from '../schemas/common';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(paginationSchema), getLibraryList);
router.get('/:id', getLibraryDetail);
router.get('/:id/stats', getLibraryStats);

export default router;
