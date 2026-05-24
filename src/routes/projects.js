import express from 'express';
import { body, validationResult } from 'express-validator';
import projectService from '../services/projectService.js';
import { requirePermission, canAccessProject } from '../middleware/auth.js';

const router = express.Router();

router.get('/',
  (req, res) => {
    const projects = projectService.getProjectList(req.query, req.user);
    res.json({ data: projects });
  }
);

router.get('/stats',
  (req, res) => {
    const stats = projectService.getProjectStats(req.user);
    res.json({ data: stats });
  }
);

router.post('/',
  requirePermission('project:update'),
  body('name').notEmpty(),
  body('address').notEmpty(),
  body('owner_name').notEmpty(),
  body('owner_phone').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const project = projectService.createProject(req.body, req.user.id, req);
      res.json({ data: project });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id',
  canAccessProject,
  (req, res) => {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json({ data: project });
  }
);

router.get('/:id/detail',
  canAccessProject,
  (req, res) => {
    const detail = projectService.getProjectDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json({ data: detail });
  }
);

router.put('/:id',
  requirePermission('project:update'),
  canAccessProject,
  (req, res) => {
    try {
      const project = projectService.updateProject(req.params.id, req.body, req.user.id, req);
      res.json({ data: project });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
