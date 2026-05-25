import express from 'express';
import { login, getCurrentUser } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    
    const result = await login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
