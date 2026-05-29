import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import prisma from '../utils/prisma';
import { ErrorCodes, BusinessError, JwtPayload, Role } from '../types';
import { LoginDto } from '../types/dto';

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({
    where: { username: dto.username },
  });

  if (!user) {
    throw new BusinessError(ErrorCodes.UNAUTHORIZED, '用户名或密码错误');
  }

  if (!user.isActive) {
    throw new BusinessError(ErrorCodes.FORBIDDEN, '该账号已被禁用');
  }

  const isValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isValid) {
    throw new BusinessError(ErrorCodes.UNAUTHORIZED, '用户名或密码错误');
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    realName: user.realName,
    role: user.role as Role,
  };

  const token = jwt.sign(
    payload as object,
    config.jwtSecret as string,
    {
      expiresIn: config.jwtExpiresIn as string,
    } as any
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      phone: user.phone,
      storeName: user.storeName,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      phone: true,
      storeName: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '用户不存在或已被禁用');
  }

  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
