import { Router } from 'express';
import {
  createProject,
  updateProject,
  getProject,
  getProjectList,
  addSupplier,
  getSuppliers,
  addComment,
  getDashboard,
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/suppliers', getSuppliers);
router.get('/', getProjectList);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.post('/:id/suppliers', addSupplier);
router.post('/:id/comments', addComment);

export default router;
