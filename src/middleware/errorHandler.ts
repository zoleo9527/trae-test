import { Response, NextFunction } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import logger from '../lib/logger'
import { ZodError } from 'zod'

export const errorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  logger.error('请求处理错误:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    body: req.body,
    query: req.query,
  })

  let response: ApiResponse = {
    success: false,
    error: '服务器内部错误',
    code: 500,
  }

  let statusCode = 500

  if (err instanceof ZodError) {
    statusCode = 400
    response = {
      success: false,
      error: '请求参数验证失败',
      message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      code: 400,
    }
  } else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } }
    if (prismaError.code === 'P2002') {
      statusCode = 409
      response = {
        success: false,
        error: '数据唯一约束冲突',
        message: `${prismaError.meta?.target?.join(', ') || '字段'}已存在`,
        code: 409,
      }
    } else if (prismaError.code === 'P2025') {
      statusCode = 404
      response = {
        success: false,
        error: '记录不存在',
        code: 404,
      }
    }
  } else if (err.name === 'BusinessError') {
    const businessError = err as unknown as { statusCode: number; code: number; details?: any }
    statusCode = businessError.statusCode || 400
    response = {
      success: false,
      error: err.message,
      code: businessError.code || 400,
      ...(businessError.details && { details: businessError.details }),
    }
  }

  res.status(statusCode).json(response)
}

export class BusinessError extends Error {
  statusCode: number
  code: number
  details?: any

  constructor(message: string, statusCode = 400, code = 400, details?: any) {
    super(message)
    this.name = 'BusinessError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}
