import express from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService.js';

const router = express.Router();

router.post('/login',
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = authService.login(req.body.username, req.body.password, req);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }
);

router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

export default router;
