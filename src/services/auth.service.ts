import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { config } from '../config';
import { JwtPayload, Role } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: Role;
    phone?: string;
  };
}

export class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { username: data.username, isActive: true },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error('用户名或密码错误');
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    logger.info(`用户登录成功: ${user.username} (${user.role})`);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as Role,
        phone: user.phone || undefined,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  }
}

export default new AuthService();
