import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { AuthPayload } from '../middleware/auth';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(
  plainPassword: string,
  hashedPassword: string
): boolean {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.expiresIn,
  } as any);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.secret as string) as AuthPayload;
}
