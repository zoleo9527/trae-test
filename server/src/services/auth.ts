import db from '../db';
import { ApiResponse, AuthPayload, User } from '../types';
import { comparePassword, generateToken, getClientIp, logAudit } from '../utils';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export function login(req: any, username: string, password: string): ApiResponse<LoginResponse> {
  const userStmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = userStmt.get(username) as User | undefined;

  if (!user) {
    return {
      success: false,
      message: '用户名或密码错误'
    };
  }

  if (!comparePassword(password, user.password_hash)) {
    logAudit(user.id, 'auth', 'login_failed', 'user', user.id, null, { username }, getClientIp(req), req.headers['user-agent']);
    return {
      success: false,
      message: '用户名或密码错误'
    };
  }

  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const payload: AuthPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name
  };

  const token = generateToken(payload);

  const { password_hash: _, ...userWithoutPassword } = user;

  logAudit(user.id, 'auth', 'login', 'user', user.id, null, userWithoutPassword, getClientIp(req), req.headers['user-agent']);

  return {
    success: true,
    message: '登录成功',
    data: {
      token,
      user: userWithoutPassword
    }
  };
}

export function getCurrentUser(userId: number): ApiResponse<Omit<User, 'password_hash'>> {
  const userStmt = db.prepare('SELECT id, username, role, name, phone, created_at, last_login_at FROM users WHERE id = ?');
  const user = userStmt.get(userId) as Omit<User, 'password_hash'> | undefined;

  if (!user) {
    return {
      success: false,
      message: '用户不存在'
    };
  }

  return {
    success: true,
    message: '获取成功',
    data: user
  };
}

export function logout(req: any, userId: number): ApiResponse {
  logAudit(userId, 'auth', 'logout', 'user', userId, null, null, getClientIp(req), req.headers['user-agent']);
  return {
    success: true,
    message: '登出成功'
  };
}
