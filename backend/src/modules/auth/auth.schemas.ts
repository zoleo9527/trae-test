import { z } from 'zod';
import { Role } from '../../types/enums';

export const loginSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  password: z.string().min(6, '密码至少6个字符'),
});

export const createUserSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  realName: z.string().min(2, '真实姓名至少2个字符'),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(Role),
  permissions: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  realName: z.string().min(2, '真实姓名至少2个字符').optional(),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, '原密码至少6个字符'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
  confirmPassword: z.string().min(6, '确认密码至少6个字符'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export const userIdSchema = z.object({
  id: z.string().uuid('用户ID格式不正确'),
});
