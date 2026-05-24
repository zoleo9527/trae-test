import express from 'express';
import { body, validationResult } from 'express-validator';
import complaintService from '../services/complaintService.js';
import { requirePermission, canAccessComplaint } from '../middleware/auth.js';

const router = express.Router();

router.get('/',
  (req, res) => {
    const complaints = complaintService.getComplaintList(req.query, req.user);
    res.json({ data: complaints });
  }
);

router.get('/stats',
  (req, res) => {
    const stats = complaintService.getComplaintStats(req.user);
    res.json({ data: stats });
  }
);

router.post('/',
  requirePermission('complaint:create'),
  body('project_id').notEmpty(),
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('category').isIn(['quality', 'schedule', 'cost', 'service', 'other']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const complaint = complaintService.createComplaint(req.body, req.user.id, req);
      res.json({ data: complaint });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id',
  canAccessComplaint,
  (req, res) => {
    const complaint = complaintService.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: '客诉不存在' });
    }
    res.json({ data: complaint });
  }
);

router.get('/:id/detail',
  canAccessComplaint,
  (req, res) => {
    const detail = complaintService.getComplaintDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: '客诉不存在' });
    }
    res.json({ data: detail });
  }
);

router.put('/:id',
  requirePermission('complaint:update'),
  canAccessComplaint,
  (req, res) => {
    try {
      const complaint = complaintService.updateComplaint(
        req.params.id,
        req.body,
        req.user.id,
        req,
        req.body.reason
      );
      res.json({ data: complaint });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/:id/status',
  requirePermission('complaint:process'),
  canAccessComplaint,
  body('status').notEmpty(),
  (req, res) => {
    try {
      const complaint = complaintService.updateStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req,
        req.body.reason
      );
      res.json({ data: complaint });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/:id/assign',
  requirePermission('complaint:assign'),
  canAccessComplaint,
  body('handler_id').notEmpty(),
  (req, res) => {
    try {
      const complaint = complaintService.assignHandler(
        req.params.id,
        req.body.handler_id,
        req.user.id,
        req,
        req.body.reason
      );
      res.json({ data: complaint });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id/versions',
  canAccessComplaint,
  (req, res) => {
    const versions = complaintService.getVersionHistory(req.params.id);
    res.json({ data: versions });
  }
);

router.get('/:id/comments',
  canAccessComplaint,
  (req, res) => {
    const comments = complaintService.getComments(req.params.id);
    res.json({ data: comments });
  }
);

router.post('/:id/comments',
  canAccessComplaint,
  body('content').notEmpty(),
  (req, res) => {
    try {
      const comment = complaintService.addComment(
        req.params.id,
        req.user.id,
        req.body.content,
        req.body.attachments,
        req
      );
      res.json({ data: comment });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
