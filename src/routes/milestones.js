import express from 'express';
import { body, validationResult } from 'express-validator';
import milestoneService from '../services/milestoneService.js';
import { requirePermission, canAccessMilestone } from '../middleware/auth.js';

const router = express.Router();

router.get('/',
  (req, res) => {
    const milestones = milestoneService.getMilestoneList(req.query, req.user);
    res.json({ data: milestones });
  }
);

router.get('/upcoming',
  (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const milestones = milestoneService.getUpcomingMilestones(days, req.user);
    res.json({ data: milestones });
  }
);

router.post('/',
  requirePermission('milestone:create'),
  body('project_id').notEmpty(),
  body('name').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const milestone = milestoneService.createMilestone(req.body, req.user.id, req);
      res.json({ data: milestone });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id',
  canAccessMilestone,
  (req, res) => {
    const milestone = milestoneService.getMilestoneById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ error: '节点不存在' });
    }
    res.json({ data: milestone });
  }
);

router.put('/:id',
  requirePermission('milestone:update'),
  canAccessMilestone,
  (req, res) => {
    try {
      const milestone = milestoneService.updateMilestone(req.params.id, req.body, req.user.id, req);
      res.json({ data: milestone });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/:id/complete',
  requirePermission('milestone:update'),
  canAccessMilestone,
  (req, res) => {
    try {
      const milestone = milestoneService.completeMilestone(
        req.params.id,
        req.body.actual_date,
        req.user.id,
        req
      );
      res.json({ data: milestone });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/check-delayed',
  (req, res) => {
    const delayed = milestoneService.checkDelayedMilestones();
    res.json({ data: delayed, count: delayed.length });
  }
);

export default router;
