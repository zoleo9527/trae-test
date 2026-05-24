import express from 'express';
import { body, validationResult } from 'express-validator';
import reminderService from '../services/reminderService.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/my',
  (req, res) => {
    const reminders = reminderService.getRemindersByRecipient(req.user.id, req.query);
    res.json({ data: reminders });
  }
);

router.get('/my/upcoming',
  (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const reminders = reminderService.getUpcomingReminders(req.user.id, hours);
    res.json({ data: reminders });
  }
);

router.post('/',
  requirePermission('reminder:create'),
  body('type').isIn(['milestone', 'complaint', 'deadline', 'custom']),
  body('title').notEmpty(),
  body('content').notEmpty(),
  body('remind_at').notEmpty(),
  body('recipient_id').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reminder = reminderService.createReminder(req.body, req.user.id, req);
      res.json({ data: reminder });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id',
  (req, res) => {
    const reminder = reminderService.getReminderById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ error: '提醒不存在' });
    }
    res.json({ data: reminder });
  }
);

router.post('/process-pending',
  (req, res) => {
    const sent = reminderService.processPendingReminders();
    res.json({ data: sent, count: sent.length });
  }
);

router.delete('/:id',
  requirePermission('reminder:create'),
  (req, res) => {
    try {
      reminderService.deleteReminder(req.params.id, req.user.id, req);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
