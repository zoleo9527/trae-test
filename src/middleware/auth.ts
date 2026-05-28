import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { verifyToken, hasPermission } from '../lib/auth'
import { Role } from '@prisma/client'

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌',
      code: 401,
    })
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
      code: 401,
    })
  }

  req.user = {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    role: payload.role as Role,
  }

  next()
}

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证',
        code: 401,
      })
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: `权限不足，需要: ${permission}`,
        code: 403,
      })
    }

    next()
  }
}

export const requireRoles = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证',
        code: 401,
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `需要以下角色之一: ${roles.join(', ')}`,
        code: 403,
      })
    }

    next()
  }
}
