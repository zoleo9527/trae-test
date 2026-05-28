import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';

const authService = {
  async login(username, password) {
    if (!username || !password) {
      throw new ValidationError('用户名和密码不能为空');
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new AuthenticationError('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new AuthenticationError('账户已被禁用');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('用户名或密码错误');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department,
      },
    };
  },

  async getCurrentUser(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        department: true,
      },
    });
  },

  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('原密码错误');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  },
};

export default authService;
