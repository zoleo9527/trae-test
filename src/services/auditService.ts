import { AuditAction, Role, EntityType } from '../types/enums'
import prisma from '../lib/prisma'
import { saveIdempotentResponse } from '../middleware/idempotency'
import { toJsonString, fromJsonString } from '../lib/jsonUtils'

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
  tx?: any
}

export const createAuditLog = async (params: AuditLogParams) => {
  const { idempotencyKey, responseBody, tx, ...logData } = params

  const client = tx || prisma

  const auditLog = await client.auditLog.create({
    data: {
      ...logData,
      oldValue: toJsonString(logData.oldValue),
      newValue: toJsonString(logData.newValue),
      changes: toJsonString(logData.changes),
      responseBody: toJsonString(responseBody),
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

  const deserializedItems = items.map((log: any) => ({
    ...log,
    oldValue: fromJsonString(log.oldValue),
    newValue: fromJsonString(log.newValue),
    changes: fromJsonString(log.changes),
    responseBody: fromJsonString(log.responseBody),
  }))

  return {
    items: deserializedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export const getEntityAuditTrail = async (entityType: EntityType, entityId: string) => {
  const logs = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'asc' },
    include: {
      operator: {
        select: { id: true, name: true, role: true },
      },
    },
  })

  return logs.map((log: any) => ({
    ...log,
    oldValue: fromJsonString(log.oldValue),
    newValue: fromJsonString(log.newValue),
    changes: fromJsonString(log.changes),
    responseBody: fromJsonString(log.responseBody),
  }))
}
