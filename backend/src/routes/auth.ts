import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../data/database';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '请输入用户名和密码' });
    }

    const user = await db.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    db.addOperationLog(
      user.id,
      user.name,
      '登录',
      'Auth',
      user.id,
      '用户登录系统'
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/me', async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未登录' });
    }

    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
