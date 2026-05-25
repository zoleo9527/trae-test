import express from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../services/notificationService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const filters = {};
    if (req.query.read !== undefined) {
      filters.read = req.query.read === 'true';
    }
    const notifications = getMyNotifications(req.user.id, filters);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const count = getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    const notification = markAsRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/all/read', authenticateToken, (req, res) => {
  try {
    const result = markAllAsRead(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
