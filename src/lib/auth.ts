import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'instrument-rental-secret-key-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  id: string
  username: string
  name: string
  role: Role
}

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10)
}

export const comparePassword = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash)
}

export const generateToken = (user: JWTPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export const rolePermissions: Record<Role, string[]> = {
  [Role.STORE_OWNER]: [
    'rental:read', 'rental:create', 'rental:return',
    'deposit:read', 'deposit:settle', 'deposit:dispute',
    'damage:read', 'damage:resolve', 'damage:close',
    'maintenance:read', 'maintenance:create', 'maintenance:complete',
    'note:read', 'note:create', 'note:supplement',
    'audit:read',
  ],
  [Role.RENTAL_ADVISOR]: [
    'rental:read', 'rental:create', 'rental:return',
    'deposit:read',
    'damage:read', 'damage:create', 'damage:report',
    'maintenance:read',
    'note:read', 'note:create',
  ],
  [Role.MAINTENANCE_TECH]: [
    'maintenance:read', 'maintenance:create', 'maintenance:update', 'maintenance:complete',
    'damage:read', 'damage:assess',
    'note:read', 'note:create',
  ],
}

export const hasPermission = (role: Role, permission: string): boolean => {
  return rolePermissions[role]?.includes(permission) || false
}
