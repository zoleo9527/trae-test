import { Response, NextFunction } from 'express'
import crypto from 'crypto'
import { AuthenticatedRequest } from '../types'
import prisma from '../lib/prisma'

export const idempotencyMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string

  if (!idempotencyKey) {
    return next()
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '用户未认证',
      code: 401,
    })
  }

  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ body: req.body, method: req.method, path: req.path }))
    .digest('hex')

  try {
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    })

    if (existingKey) {
      if (existingKey.userId !== req.user.id) {
        return res.status(409).json({
          success: false,
          error: '幂等键已被其他用户使用',
          code: 409,
        })
      }

      if (existingKey.requestHash !== requestHash) {
        return res.status(422).json({
          success: false,
          error: '幂等键与请求内容不匹配',
          code: 422,
        })
      }

      if (existingKey.responseBody) {
        return res.status(200).json(existingKey.responseBody)
      }

      return res.status(409).json({
        success: false,
        error: '该请求正在处理中，请稍后重试',
        code: 409,
      })
    }

    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId: req.user.id,
        requestHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    req.idempotencyKey = idempotencyKey
    next()
  } catch (error) {
    next(error)
  }
}

export const saveIdempotentResponse = async (
  idempotencyKey: string,
  responseBody: unknown
) => {
  try {
    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: { responseBody: responseBody as object },
    })
  } catch (error) {
    console.error('保存幂等响应失败:', error)
  }
}
