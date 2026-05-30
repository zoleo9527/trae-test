import { Request, Response } from 'express';
import * as authService from '../services/auth';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  const result = authService.login(req, username, password);
  res.json(result);
}

export async function getCurrentUser(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  const result = authService.getCurrentUser(req.user.userId);
  res.json(result);
}

export async function logout(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  const result = authService.logout(req, req.user.userId);
  res.json(result);
}
