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
  completeTask
} from '../services/taskService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', authenticateToken, (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type
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

router.get('/', authenticateToken, (req, res) => {
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
    const task = getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, remark } = req.body;
    const task = updateTaskStatus(req.params.id, status, remark, req.user.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/assign', authenticateToken, (req, res) => {
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
    const { remark } = req.body;
    const task = approveTask(req.params.id, remark || '', req.user.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/reject', authenticateToken, (req, res) => {
  try {
    const { remark } = req.body;
    const task = rejectTask(req.params.id, remark || '', req.user.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const { remark } = req.body;
    const task = completeTask(req.params.id, remark || '', req.user.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
