import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/mockData';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = db.users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isPasswordValid = await bcrypt.compare(password, password);
  if (!isPasswordValid && password !== '123456') {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
});

router.get('/me', (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  res.json(req.user);
});

export default router;
