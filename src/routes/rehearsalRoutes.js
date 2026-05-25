import express from 'express';
import {
  getAllRehearsals,
  getRehearsalById,
  createRehearsal,
  updateRehearsal,
  updateRehearsalStatus,
  reportIssue,
  resolveIssue,
  requestRehearsalArrangement
} from '../services/rehearsalService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ROLES } from '../data/models.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(ROLES.THEATER_MANAGER, ROLES.BACKEND_COORDINATOR), (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      performanceId: req.query.performanceId,
      chainId: req.query.chainId,
      coordinator: req.query.coordinator
    };
    const rehearsals = getAllRehearsals(filters);
    res.json(rehearsals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticateToken, requireRole(ROLES.THEATER_MANAGER, ROLES.BACKEND_COORDINATOR), (req, res) => {
  try {
    const rehearsal = getRehearsalById(req.params.id);
    if (!rehearsal) {
      return res.status(404).json({ message: '排练不存在' });
    }
    res.json(rehearsal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, requireRole(ROLES.BACKEND_COORDINATOR), (req, res) => {
  try {
    const rehearsal = createRehearsal(req.body, req.user.id);
    res.status(201).json(rehearsal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, requireRole(ROLES.BACKEND_COORDINATOR), (req, res) => {
  try {
    const rehearsal = updateRehearsal(req.params.id, req.body, req.user.id);
    res.json(rehearsal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticateToken, requireRole(ROLES.BACKEND_COORDINATOR), (req, res) => {
  try {
    const rehearsal = updateRehearsalStatus(req.params.id, req.body.status, req.user.id);
    res.json(rehearsal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/issues', authenticateToken, (req, res) => {
  try {
    const issue = reportIssue(req.params.id, req.body.content, req.user.id);
    res.status(201).json(issue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:rehearsalId/issues/:issueId/resolve', authenticateToken, requireRole(ROLES.BACKEND_COORDINATOR), (req, res) => {
  try {
    const issue = resolveIssue(req.params.rehearsalId, req.params.issueId, req.user.id);
    res.json(issue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/arrangement-request', authenticateToken, (req, res) => {
  try {
    const { performanceId, description } = req.body;
    const task = requestRehearsalArrangement(performanceId, description, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
