import { AuditAction, InstrumentStatus } from '@prisma/client'
import prisma from '../lib/prisma'
import { generateOrderNo, compareObjects } from '../lib/utils'
import { BusinessError } from '../middleware/errorHandler'
import { createAuditLog } from './auditService'

interface CreateMaintenanceParams {
  instrumentId: string
  damageClaimId?: string
  type: string
  description: string
  partsCost?: number
  laborCost?: number
  startedAt?: Date
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const createMaintenance = async (params: CreateMaintenanceParams) => {
  const {
    instrumentId,
    damageClaimId,
    type,
    description,
    partsCost = 0,
    laborCost = 0,
    startedAt,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx) => {
    const instrument = await tx.instrument.findUnique({
      where: { id: instrumentId },
    })

    if (!instrument) {
      throw new BusinessError('乐器不存在', 404, 404)
    }

    const maintenanceNo = generateOrderNo('MT')
    const totalCost = Number((partsCost + laborCost).toFixed(2))

    const maintenance = await tx.maintenance.create({
      data: {
        maintenanceNo,
        instrumentId,
        damageClaimId,
        type,
        description,
        partsCost,
        laborCost,
        totalCost,
        startedAt: startedAt || new Date(),
        createdBy: operatorId,
      },
      include: {
        instrument: true,
        damageClaim: true,
        creator: { select: { id: true, name: true, role: true } },
      },
    })

    await tx.instrument.update({
      where: { id: instrumentId },
      data: { status: InstrumentStatus.IN_MAINTENANCE },
    })

    const response = {
      success: true,
      data: maintenance,
      message: '维修单创建成功',
    }

    await createAuditLog({
      action: AuditAction.MAINTENANCE_CREATE,
      entityType: 'MAINTENANCE',
      entityId: maintenance.id,
      newValue: maintenance,
      remark: `维修单创建，单号${maintenanceNo}，类型${type}，预估费用${totalCost}元`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return maintenance
  })
}

interface CompleteMaintenanceParams {
  maintenanceId: string
  partsCost: number
  laborCost: number
  technicianNotes?: string
  completedAt?: Date
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const completeMaintenance = async (params: CompleteMaintenanceParams) => {
  const {
    maintenanceId,
    partsCost,
    laborCost,
    technicianNotes,
    completedAt,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx) => {
    const oldMaintenance = await tx.maintenance.findUnique({
      where: { id: maintenanceId },
      include: { instrument: true },
    })

    if (!oldMaintenance) {
      throw new BusinessError('维修单不存在', 404, 404)
    }

    if (oldMaintenance.isCompleted) {
      throw new BusinessError('该维修单已完成，不可重复操作', 400, 400)
    }

    const totalCost = Number((partsCost + laborCost).toFixed(2))

    const updatedMaintenance = await tx.maintenance.update({
      where: { id: maintenanceId },
      data: {
        partsCost,
        laborCost,
        totalCost,
        technicianNotes,
        isCompleted: true,
        completedAt: completedAt || new Date(),
        handledBy: operatorId,
      },
      include: {
        instrument: true,
        damageClaim: true,
        handler: { select: { id: true, name: true, role: true } },
      },
    })

    const hasUnresolvedDamage = await tx.damageClaim.findFirst({
      where: {
        instrumentId: oldMaintenance.instrumentId,
        status: { in: ['PENDING', 'DISPUTED'] },
      },
    })

    if (!hasUnresolvedDamage) {
      await tx.instrument.update({
        where: { id: oldMaintenance.instrumentId },
        data: { status: InstrumentStatus.AVAILABLE },
      })
    } else {
      await tx.instrument.update({
        where: { id: oldMaintenance.instrumentId },
        data: { status: InstrumentStatus.DAMAGED },
      })
    }

    const changes = compareObjects(
      {
        partsCost: oldMaintenance.partsCost,
        laborCost: oldMaintenance.laborCost,
        totalCost: oldMaintenance.totalCost,
        isCompleted: oldMaintenance.isCompleted,
      },
      {
        partsCost,
        laborCost,
        totalCost,
        isCompleted: true,
      }
    )

    const response = {
      success: true,
      data: updatedMaintenance,
      message: '维修完成',
    }

    await createAuditLog({
      action: AuditAction.MAINTENANCE_COMPLETE,
      entityType: 'MAINTENANCE',
      entityId: maintenanceId,
      oldValue: oldMaintenance,
      newValue: updatedMaintenance,
      changes,
      remark: `维修完成，单号${oldMaintenance.maintenanceNo}，实际费用${totalCost}元`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedMaintenance
  })
}

export const getMaintenanceList = async (
  instrumentId?: string,
  damageClaimId?: string,
  isCompleted?: boolean,
  page = 1,
  pageSize = 20
) => {
  const where: Record<string, unknown> = {}

  if (instrumentId) where.instrumentId = instrumentId
  if (damageClaimId) where.damageClaimId = damageClaimId
  if (typeof isCompleted === 'boolean') where.isCompleted = isCompleted

  const [total, items] = await Promise.all([
    prisma.maintenance.count({ where }),
    prisma.maintenance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        instrument: true,
        damageClaim: true,
        creator: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { creator: { select: { id: true, name: true, role: true } } },
        },
      },
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

export const getMaintenanceDetail = async (id: string) => {
  const maintenance = await prisma.maintenance.findUnique({
    where: { id },
    include: {
      instrument: true,
      damageClaim: true,
      creator: { select: { id: true, name: true, role: true } },
      handler: { select: { id: true, name: true, role: true } },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { id: true, name: true, role: true } } },
      },
    },
  })

  if (!maintenance) {
    const auditTrail = await prisma.auditLog.findMany({
      where: { entityType: 'MAINTENANCE', entityId: id },
      orderBy: { createdAt: 'asc' },
      include: { operator: { select: { id: true, name: true, role: true } } },
    })
    ;(maintenance as any).auditTrail = auditTrail
  }

  return maintenance
}

export const getMaintenanceCostSummary = async (
  startDate?: Date,
  endDate?: Date
) => {
  const where: Record<string, unknown> = { isCompleted: true }

  if (startDate) where.completedAt = { gte: startDate }
  if (endDate) {
    if (!where.completedAt) where.completedAt = {}
    ;(where.completedAt as any).lte = endDate
  }

  const maintenances = await prisma.maintenance.findMany({
    where,
    select: {
      partsCost: true,
      laborCost: true,
      totalCost: true,
      type: true,
      instrument: { select: { category: true } },
    },
  })

  const summary = {
    totalCount: maintenances.length,
    totalPartsCost: maintenances.reduce((sum, m) => sum + Number(m.partsCost), 0),
    totalLaborCost: maintenances.reduce((sum, m) => sum + Number(m.laborCost), 0),
    totalCost: maintenances.reduce((sum, m) => sum + Number(m.totalCost), 0),
    byType: {} as Record<string, { count: number; cost: number }>,
    byCategory: {} as Record<string, { count: number; cost: number }>,
  }

  maintenances.forEach((m) => {
    if (!summary.byType[m.type]) {
      summary.byType[m.type] = { count: 0, cost: 0 }
    }
    summary.byType[m.type].count++
    summary.byType[m.type].cost += Number(m.totalCost)

    const category = m.instrument.category
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = { count: 0, cost: 0 }
    }
    summary.byCategory[category].count++
    summary.byCategory[category].cost += Number(m.totalCost)
  })

  return summary
}
