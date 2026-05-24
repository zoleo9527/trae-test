import express from 'express';
import authService from '../services/authService.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/',
  (req, res) => {
    const users = authService.getAllUsers();
    res.json({ data: users });
  }
);

router.get('/role/:role',
  (req, res) => {
    const users = authService.getUsersByRole(req.params.role);
    res.json({ data: users });
  }
);

router.get('/stats',
  (req, res) => {
    const stats = authService.getRoleStats();
    res.json({ data: stats });
  }
);

router.post('/',
  requireRole('admin'),
  (req, res) => {
    try {
      const user = authService.createUser(req.body, req.user.id, req);
      res.json({ data: user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/:id',
  (req, res) => {
    const user = authService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ data: user });
  }
);

router.put('/:id',
  requireRole('admin'),
  (req, res) => {
    try {
      const user = authService.updateUser(req.params.id, req.body, req.user.id, req);
      res.json({ data: user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
