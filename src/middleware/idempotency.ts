import { Response, NextFunction } from 'express'
import crypto from 'crypto'
import { AuthenticatedRequest } from '../types'
import prisma from '../lib/prisma'
import { toJsonString, fromJsonString } from '../lib/jsonUtils'

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
      if (existingKey.requestHash !== requestHash) {
        return res.status(422).json({
          success: false,
          error: '幂等键与请求内容不匹配',
          code: 422,
        })
      }

      if (existingKey.responseBody) {
        return res.status(200).json(fromJsonString(existingKey.responseBody))
      }

      const keyAge = Date.now() - new Date(existingKey.createdAt).getTime()
      if (keyAge < 60000) {
        return res.status(409).json({
          success: false,
          error: '该请求正在处理中，请稍后重试',
          code: 409,
        })
      }

      await prisma.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: {
          requestHash,
          responseBody: null,
          createdAt: new Date(),
        },
      })

      req.idempotencyKey = idempotencyKey
      return next()
    }

    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        requestHash,
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
      data: { responseBody: toJsonString(responseBody) },
    })
  } catch (error) {
    console.error('保存幂等响应失败:', error)
  }
}
