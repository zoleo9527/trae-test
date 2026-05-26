import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ code: 400, message: e.errors[0].message });
    }
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  res.json({
    code: 0,
    data: req.user,
  });
});

export default router;
