import { AuditAction, DamageClaimStatus, DamageSeverity, EntityType, RentalStatus } from '../types/enums'
import prisma from '../lib/prisma'
import { generateOrderNo, compareObjects } from '../lib/utils'
import { BusinessError } from '../middleware/errorHandler'
import { createAuditLog, getEntityAuditTrail } from './auditService'
import { getEntityNotes } from './noteService'
import { toJsonString, fromJsonString, parseEvidenceUrls, toEvidenceUrlsString } from '../lib/jsonUtils'

interface CreateDamageClaimParams {
  rentalId: string
  instrumentId: string
  severity: DamageSeverity
  description: string
  estimatedCost: number
  evidenceUrls: string[]
  liabilityParty?: string
  liabilityReason?: string
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const createDamageClaim = async (params: CreateDamageClaimParams) => {
  const {
    rentalId,
    instrumentId,
    severity,
    description,
    estimatedCost,
    evidenceUrls,
    liabilityParty,
    liabilityReason,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const rental = await tx.rental.findUnique({
      where: { id: rentalId },
      include: { customer: true },
    })

    if (!rental) {
      throw new BusinessError('租赁单不存在', 404, 404)
    }

    const claimNo = generateOrderNo('DM')

    const damageClaim = await tx.damageClaim.create({
      data: {
        claimNo,
        rentalId,
        instrumentId,
        severity,
        description,
        estimatedCost,
        evidenceUrls: toEvidenceUrlsString(evidenceUrls),
        liabilityParty,
        liabilityReason,
        reportedAt: new Date(),
        createdBy: operatorId,
      },
      include: {
        instrument: true,
        rental: { include: { customer: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    })

    const response = {
      success: true,
      data: damageClaim,
      message: '损坏申诉创建成功',
    }

    await createAuditLog({
      action: AuditAction.DAMAGE_REPORT,
      entityType: EntityType.DAMAGE_CLAIM,
      entityId: damageClaim.id,
      newValue: damageClaim,
      remark: `损坏申诉创建，单号${claimNo}，${severity}损坏，预估费用${estimatedCost}元`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return damageClaim
  })
}

interface DisputeDamageClaimParams {
  claimId: string
  disputeReason: string
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const disputeDamageClaim = async (params: DisputeDamageClaimParams) => {
  const {
    claimId,
    disputeReason,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const oldClaim = await tx.damageClaim.findUnique({
      where: { id: claimId },
    })

    if (!oldClaim) {
      throw new BusinessError('损坏申诉不存在', 404, 404)
    }

    if (oldClaim.status !== DamageClaimStatus.PENDING && oldClaim.status !== DamageClaimStatus.CONFIRMED) {
      throw new BusinessError(`当前状态${oldClaim.status}不允许申诉`, 400, 400)
    }

    const updatedClaim = await tx.damageClaim.update({
      where: { id: claimId },
      data: {
        status: DamageClaimStatus.DISPUTED,
        customerDispute: true,
        disputeReason,
        disputedAt: new Date(),
      },
    })

    const changes = compareObjects(
      { status: oldClaim.status, customerDispute: oldClaim.customerDispute },
      { status: updatedClaim.status, customerDispute: updatedClaim.customerDispute }
    )

    const response = {
      success: true,
      data: updatedClaim,
      message: '客户申诉已提交',
    }

    await createAuditLog({
      action: AuditAction.DAMAGE_DISPUTE,
      entityType: EntityType.DAMAGE_CLAIM,
      entityId: claimId,
      oldValue: oldClaim,
      newValue: updatedClaim,
      changes,
      remark: `客户对损坏判定提出申诉，单号${oldClaim.claimNo}，申诉理由：${disputeReason}`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedClaim
  })
}

interface RejectDisputeParams {
  claimId: string
  rejectReason: string
  finalCost: number
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const rejectDispute = async (params: RejectDisputeParams) => {
  const {
    claimId,
    rejectReason,
    finalCost,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const oldClaim = await tx.damageClaim.findUnique({
      where: { id: claimId },
    })

    if (!oldClaim) {
      throw new BusinessError('损坏申诉不存在', 404, 404)
    }

    if (oldClaim.status !== DamageClaimStatus.DISPUTED) {
      throw new BusinessError(`当前状态${oldClaim.status}不允许驳回`, 400, 400)
    }

    const updatedClaim = await tx.damageClaim.update({
      where: { id: claimId },
      data: {
        status: DamageClaimStatus.REJECTED,
        rejectReason,
        finalCost,
        closedAt: new Date(),
        handledBy: operatorId,
      },
      include: {
        handler: { select: { id: true, name: true, role: true } },
      },
    })

    const changes = compareObjects(
      { status: oldClaim.status, finalCost: oldClaim.finalCost },
      { status: updatedClaim.status, finalCost }
    )

    const response = {
      success: true,
      data: updatedClaim,
      message: '申诉已驳回',
    }

    await createAuditLog({
      action: AuditAction.DAMAGE_REJECT,
      entityType: EntityType.DAMAGE_CLAIM,
      entityId: claimId,
      oldValue: oldClaim,
      newValue: updatedClaim,
      changes,
      remark: `驳回客户申诉，单号${oldClaim.claimNo}，驳回原因：${rejectReason}，最终赔偿${finalCost}元`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedClaim
  })
}

interface ResolveDisputeParams {
  claimId: string
  resolvedReason: string
  finalCost: number
  liabilityParty?: string
  liabilityReason?: string
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const resolveDispute = async (params: ResolveDisputeParams) => {
  const {
    claimId,
    resolvedReason,
    finalCost,
    liabilityParty,
    liabilityReason,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const oldClaim = await tx.damageClaim.findUnique({
      where: { id: claimId },
    })

    if (!oldClaim) {
      throw new BusinessError('损坏申诉不存在', 404, 404)
    }

    if (oldClaim.status !== DamageClaimStatus.DISPUTED) {
      throw new BusinessError(`当前状态${oldClaim.status}不允许重新判定`, 400, 400)
    }

    const updatedClaim = await tx.damageClaim.update({
      where: { id: claimId },
      data: {
        status: DamageClaimStatus.RESOLVED,
        resolvedReason,
        finalCost,
        liabilityParty,
        liabilityReason,
        closedAt: new Date(),
        handledBy: operatorId,
      },
      include: {
        handler: { select: { id: true, name: true, role: true } },
      },
    })

    const changes = compareObjects(
      {
        status: oldClaim.status,
        finalCost: oldClaim.finalCost,
        liabilityParty: oldClaim.liabilityParty,
      },
      {
        status: updatedClaim.status,
        finalCost,
        liabilityParty,
      }
    )

    const response = {
      success: true,
      data: updatedClaim,
      message: '申诉已通过，重新判定完成',
    }

    await createAuditLog({
      action: AuditAction.DAMAGE_RESOLVE,
      entityType: EntityType.DAMAGE_CLAIM,
      entityId: claimId,
      oldValue: oldClaim,
      newValue: updatedClaim,
      changes,
      remark: `通过客户申诉并重新判定，单号${oldClaim.claimNo}，原因：${resolvedReason}，最终赔偿${finalCost}元`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedClaim
  })
}

export const confirmDamageClaim = async (
  claimId: string,
  operatorId: string,
  operatorName: string,
  operatorRole: any,
  idempotencyKey?: string
) => {
  return prisma.$transaction(async (tx: any) => {
    const oldClaim = await tx.damageClaim.findUnique({
      where: { id: claimId },
    })

    if (!oldClaim) {
      throw new BusinessError('损坏申诉不存在', 404, 404)
    }

    if (oldClaim.status !== DamageClaimStatus.PENDING) {
      throw new BusinessError(`当前状态${oldClaim.status}不允许确认`, 400, 400)
    }

    const updatedClaim = await tx.damageClaim.update({
      where: { id: claimId },
      data: {
        status: DamageClaimStatus.CONFIRMED,
        finalCost: oldClaim.estimatedCost,
        handledBy: operatorId,
      },
    })

    const response = {
      success: true,
      data: updatedClaim,
      message: '损坏判定已确认，客户无异议',
    }

    await createAuditLog({
      action: AuditAction.DAMAGE_CONFIRM,
      entityType: EntityType.DAMAGE_CLAIM,
      entityId: claimId,
      oldValue: oldClaim,
      newValue: updatedClaim,
      remark: `确认损坏判定，单号${oldClaim.claimNo}，客户无异议`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedClaim
  })
}

export const closeDamageClaim = async (
  claimId: string,
  operatorId: string,
  operatorName: string,
  operatorRole: any,
  idempotencyKey?: string
) => {
  return prisma.$transaction(async (tx: any) => {
    const oldClaim = await tx.damageClaim.findUnique({
      where: { id: claimId },
    })

    if (!oldClaim) {
      throw new BusinessError('损坏申诉不存在', 404, 404)
    }

    if (![DamageClaimStatus.CONFIRMED, DamageClaimStatus.REJECTED, DamageClaimStatus.RESOLVED].includes(oldClaim.status)) {
      throw new BusinessError(`当前状态${oldClaim.status}不允许结案`, 400, 400)
    }

    const updatedClaim = await tx.damageClaim.update({
      where: { id: claimId },
      data: {
        status: DamageClaimStatus.CLOSED,
        closedAt: new Date(),
      },
    })

    const response = {
      success: true,
      data: updatedClaim,
      message: '损坏申诉已结案',
    }

    await createAuditLog({
      action: AuditAction.DAMAGE_CLOSE,
      entityType: EntityType.DAMAGE_CLAIM,
      entityId: claimId,
      oldValue: oldClaim,
      newValue: updatedClaim,
      remark: `损坏申诉结案，单号${oldClaim.claimNo}`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedClaim
  })
}

export const getDamageClaimList = async (
  status?: DamageClaimStatus,
  rentalId?: string,
  instrumentId?: string,
  page = 1,
  pageSize = 20
) => {
  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (rentalId) where.rentalId = rentalId
  if (instrumentId) where.instrumentId = instrumentId

  const [total, items] = await Promise.all([
    prisma.damageClaim.count({ where }),
    prisma.damageClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        instrument: true,
        rental: { include: { customer: true } },
        maintenance: true,
        creator: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } },
      },
    }),
  ])

  const itemsWithEvidence = items.map((item: any) => ({
    ...item,
    evidenceUrls: parseEvidenceUrls(item.evidenceUrls),
  }))

  return {
    items: itemsWithEvidence,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export const getDamageClaimDetail = async (id: string) => {
  const claim = await prisma.damageClaim.findUnique({
    where: { id },
    include: {
      instrument: true,
      rental: { include: { customer: true, deposit: true } },
      maintenance: true,
      creator: { select: { id: true, name: true, role: true } },
      handler: { select: { id: true, name: true, role: true } },
    },
  })

  if (!claim) {
    const auditTrail = await getEntityAuditTrail(EntityType.DAMAGE_CLAIM, id)
    throw new BusinessError(
      `损坏申诉不存在，ID: ${id}`,
      404,
      404,
      { auditTrail, requestedId: id }
    )
  }

  const notes = await getEntityNotes(EntityType.DAMAGE_CLAIM, id)
  const auditLogs = await getEntityAuditTrail(EntityType.DAMAGE_CLAIM, id)

  return {
    ...claim,
    evidenceUrls: parseEvidenceUrls(claim.evidenceUrls),
    notes,
    auditLogs,
  }
}

export const getEvidenceChain = async (claimId: string) => {
  const claim = await prisma.damageClaim.findUnique({
    where: { id: claimId },
    select: {
      evidenceUrls: true,
      description: true,
      severity: true,
      estimatedCost: true,
      disputeReason: true,
      rejectReason: true,
      resolvedReason: true,
    },
  })

  if (!claim) {
    throw new BusinessError('损坏申诉不存在', 404, 404)
  }

  const notes = await getEntityNotes(EntityType.DAMAGE_CLAIM, claimId)
  const auditLogs = await getEntityAuditTrail(EntityType.DAMAGE_CLAIM, claimId)

  return {
    evidence: {
      photos: parseEvidenceUrls(claim.evidenceUrls),
      description: claim.description,
      severity: claim.severity,
      estimatedCost: claim.estimatedCost,
    },
    disputes: {
      customerDispute: claim.disputeReason,
      rejectReason: claim.rejectReason,
      resolvedReason: claim.resolvedReason,
    },
    timeline: [
      ...notes.map((n: any) => ({
        type: 'NOTE',
        time: n.createdAt,
        content: n.content,
        isSupplement: n.isSupplement,
        supplementReason: n.supplementReason,
        operator: { id: n.creator.id, name: n.creator.name, role: n.creator.role },
      })),
      ...auditLogs.map((a: any) => ({
        type: 'AUDIT',
        action: a.action,
        time: a.createdAt,
        content: a.remark,
        changes: a.changes,
        operator: { id: a.operatorId, name: a.operator.name, role: a.operator.role },
      })),
    ].sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()),
  }
}
