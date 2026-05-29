import { Request } from 'express'
import { Role, EntityType as EntityTypeEnum } from './enums'

export { EntityTypeEnum as EntityType }

export interface AuthUser {
  id: string
  username: string
  name: string
  role: Role
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
  idempotencyKey?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
