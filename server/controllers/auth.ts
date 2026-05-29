import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { login, getCurrentUser } from '../services/auth';

export async function loginController(req: Request, res: Response) {
  const result = await login(req.body);
  return sendSuccess(res, result, '登录成功');
}

export async function meController(req: Request, res: Response) {
  const user = await getCurrentUser(req.user.userId);
  return sendSuccess(res, user);
}
