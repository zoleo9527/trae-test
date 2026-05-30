import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { AuthPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'golf_reconciliation_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

export function getClientIp(req: any): string {
  return req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.[0] || 'unknown';
}

export function buildWhereClause(filters: Record<string, any>): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    if (key.endsWith('_start')) {
      const field = key.replace('_start', '');
      conditions.push(`${field} >= ?`);
      params.push(value);
    } else if (key.endsWith('_end')) {
      const field = key.replace('_end', '');
      conditions.push(`${field} <= ?`);
      params.push(value);
    } else if (key.endsWith('_min')) {
      const field = key.replace('_min', '');
      conditions.push(`${field} >= ?`);
      params.push(value);
    } else if (key.endsWith('_max')) {
      const field = key.replace('_max', '');
      conditions.push(`${field} <= ?`);
      params.push(value);
    } else if (key.endsWith('_like')) {
      const field = key.replace('_like', '');
      conditions.push(`${field} LIKE ?`);
      params.push(`%${value}%`);
    } else if (key.endsWith('_is_null')) {
      const field = key.replace('_is_null', '');
      if (value === true || value === 'true' || value === 1) {
        conditions.push(`${field} IS NULL`);
      } else {
        conditions.push(`${field} IS NOT NULL`);
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      }
    } else {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

export function logAudit(
  userId: number,
  module: string,
  action: string,
  targetType: string,
  targetId: number,
  oldValue: any = null,
  newValue: any = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
): void {
  db.prepare(`
    INSERT INTO audit_logs (user_id, module, action, target_type, target_id, old_value, new_value, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    module,
    action,
    targetType,
    targetId,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ipAddress,
    userAgent
  );
}
