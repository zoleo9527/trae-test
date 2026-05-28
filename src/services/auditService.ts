import { AuditAction, Role } from '@prisma/client'
import prisma from '../lib/prisma'
import { EntityType } from '../types'
import { saveIdempotentResponse } from '../middleware/idempotency'

interface AuditLogParams {
  action: AuditAction
  entityType: EntityType
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  changes?: Record<string, { old: unknown; new: unknown }>
  remark?: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  idempotencyKey?: string
  responseBody?: unknown
}

export const createAuditLog = async (params: AuditLogParams) => {
  const { idempotencyKey, responseBody, ...logData } = params

  const auditLog = await prisma.auditLog.create({
    data: {
      ...logData,
      oldValue: logData.oldValue as object,
      newValue: logData.newValue as object,
      changes: logData.changes as object,
      idempotencyKey,
    },
  })

  if (idempotencyKey && responseBody) {
    await saveIdempotentResponse(idempotencyKey, responseBody)
  }

  return auditLog
}

export const getAuditLogs = async (
  entityType?: EntityType,
  entityId?: string,
  action?: AuditAction,
  operatorId?: string,
  page = 1,
  pageSize = 20
) => {
  const where: Record<string, unknown> = {}

  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (action) where.action = action
  if (operatorId) where.operatorId = operatorId

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export const getEntityAuditTrail = async (entityType: EntityType, entityId: string) => {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'asc' },
    include: {
      operator: {
        select: { id: true, name: true, role: true },
      },
    },
  })
}
