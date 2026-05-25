import express from 'express';
import {
  getAllPerformances,
  getPerformanceById,
  getPerformanceChain,
  createPerformance,
  updatePerformance,
  updatePerformanceStatus,
  deletePerformance
} from '../services/performanceService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ROLES } from '../data/models.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      venue: req.query.venue,
      type: req.query.type
    };
    const performances = getAllPerformances(filters);
    res.json(performances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const performance = getPerformanceById(req.params.id);
    if (!performance) {
      return res.status(404).json({ message: '演出不存在' });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/chain/:chainId', authenticateToken, (req, res) => {
  try {
    const chain = getPerformanceChain(req.params.chainId, req.user.role);
    if (!chain.performance) {
      return res.status(404).json({ message: '链条不存在' });
    }
    res.json(chain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, requireRole(ROLES.THEATER_MANAGER), (req, res) => {
  try {
    const performance = createPerformance(req.body, req.user.id);
    res.status(201).json(performance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, requireRole(ROLES.THEATER_MANAGER), (req, res) => {
  try {
    const performance = updatePerformance(req.params.id, req.body, req.user.id);
    res.json(performance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticateToken, requireRole(ROLES.THEATER_MANAGER), (req, res) => {
  try {
    const performance = updatePerformanceStatus(req.params.id, req.body.status, req.user.id);
    res.json(performance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, requireRole(ROLES.THEATER_MANAGER), (req, res) => {
  try {
    deletePerformance(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
