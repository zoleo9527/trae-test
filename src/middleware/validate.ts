import { Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AuthenticatedRequest } from '../types'

export const validateRequest = (schema: ZodSchema) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      next(error)
    }
  }
}
