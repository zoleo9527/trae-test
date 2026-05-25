import express from 'express';
import {
  getMyTasks,
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  assignTask,
  getOverdueTasks,
  approveTask,
  rejectTask,
  completeTask,
  checkTaskPermission
} from '../services/taskService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ROLES } from '../data/models.js';

const router = express.Router();

router.get('/my', authenticateToken, (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type,
      active: req.query.active
    };
    const tasks = getMyTasks(req.user.id, req.user.role, filters);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/overdue', authenticateToken, (req, res) => {
  try {
    const tasks = getOverdueTasks(req.user.id, req.user.role);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticateToken, requireRole(ROLES.THEATER_MANAGER), (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      chainId: req.query.chainId,
      performanceId: req.query.performanceId
    };
    const tasks = getAllTasks(filters);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const task = checkTaskPermission(req.params.id, req.user.id, req.user.role);
    res.json(task);
  } catch (error) {
    if (error.message === '任务不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权操作此任务') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    checkTaskPermission(req.params.id, req.user.id, req.user.role);
    const { status, remark } = req.body;
    const task = updateTaskStatus(req.params.id, status, remark, req.user.id);
    res.json(task);
  } catch (error) {
    if (error.message === '任务不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权操作此任务') {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/assign', authenticateToken, requireRole(ROLES.THEATER_MANAGER), (req, res) => {
  try {
    const { assigneeId } = req.body;
    const task = assignTask(req.params.id, req.user.id, assigneeId);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/approve', authenticateToken, (req, res) => {
  try {
    checkTaskPermission(req.params.id, req.user.id, req.user.role);
    const { remark } = req.body;
    const task = approveTask(req.params.id, remark || '', req.user.id);
    res.json(task);
  } catch (error) {
    if (error.message === '任务不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权操作此任务') {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/reject', authenticateToken, (req, res) => {
  try {
    checkTaskPermission(req.params.id, req.user.id, req.user.role);
    const { remark } = req.body;
    const task = rejectTask(req.params.id, remark || '', req.user.id);
    res.json(task);
  } catch (error) {
    if (error.message === '任务不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权操作此任务') {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    checkTaskPermission(req.params.id, req.user.id, req.user.role);
    const { remark } = req.body;
    const task = completeTask(req.params.id, remark || '', req.user.id);
    res.json(task);
  } catch (error) {
    if (error.message === '任务不存在') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === '无权操作此任务') {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

export default router;
