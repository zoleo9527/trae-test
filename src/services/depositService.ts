import { AuditAction, DepositStatus, EntityType, RentalStatus } from '../types/enums'
import prisma from '../lib/prisma'
import { compareObjects } from '../lib/utils'
import { BusinessError } from '../middleware/errorHandler'
import { createAuditLog, getEntityAuditTrail } from './auditService'
import { getEntityNotes } from './noteService'
import { toJsonString, fromJsonString } from '../lib/jsonUtils'

interface CreateDepositParams {
  rentalId: string
  amount: number
  operatorId: string
}

export const createDeposit = async (params: CreateDepositParams) => {
  const { rentalId, amount, operatorId } = params

  const existingDeposit = await prisma.deposit.findUnique({
    where: { rentalId },
  })

  if (existingDeposit) {
    throw new BusinessError('该租赁单已有押金记录', 400, 400)
  }

  const depositNo = `DP${Date.now()}`

  const deposit = await prisma.deposit.create({
    data: {
      depositNo,
      rentalId,
      amount,
      createdBy: operatorId,
    },
  })

  return deposit
}

interface SettleDepositParams {
  depositId: string
  refundAmount: number
  deductAmount: number
  deductReason?: string
  paymentMethod?: string
  transactionId?: string
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const settleDeposit = async (params: SettleDepositParams) => {
  const {
    depositId,
    refundAmount,
    deductAmount,
    deductReason,
    paymentMethod,
    transactionId,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const oldDeposit = await tx.deposit.findUnique({
      where: { id: depositId },
      include: { rental: true },
    })

    if (!oldDeposit) {
      throw new BusinessError('押金单不存在', 404, 404)
    }

    if (oldDeposit.status !== DepositStatus.HELD && oldDeposit.status !== DepositStatus.DISPUTED) {
      throw new BusinessError(`押金单状态不允许结算`, 400, 400)
    }

    const totalAmount = Number(oldDeposit.amount)
    if (Math.abs(refundAmount + deductAmount - totalAmount) > 0.01) {
      throw new BusinessError('退款金额+扣款金额必须等于押金总额', 400, 400)
    }

    let status: DepositStatus
    if (deductAmount === 0) {
      status = DepositStatus.REFUNDED
    } else if (refundAmount === 0) {
      status = DepositStatus.DEDUCTED
    } else {
      status = DepositStatus.PARTIAL_REFUNDED
    }

    const updatedDeposit = await tx.deposit.update({
      where: { id: depositId },
      data: {
        status,
        refundAmount,
        deductAmount,
        deductReason,
        paymentMethod,
        transactionId,
        settledAt: new Date(),
        handledBy: operatorId,
      },
      include: {
        rental: {
          update: {
            status: RentalStatus.SETTLED,
          },
        },
        handler: { select: { id: true, name: true, role: true } },
      },
    })

    if (oldDeposit.rental) {
      await tx.rental.update({
        where: { id: oldDeposit.rentalId },
        data: { status: RentalStatus.SETTLED },
      })
    }

    const changes = compareObjects(
      {
        status: oldDeposit.status,
        refundAmount: oldDeposit.refundAmount,
        deductAmount: oldDeposit.deductAmount,
      },
      {
        status,
        refundAmount,
        deductAmount,
      }
    )

    let auditAction: AuditAction
    if (deductAmount === 0) {
      auditAction = AuditAction.DEPOSIT_REFUND
    } else if (refundAmount === 0) {
      auditAction = AuditAction.DEPOSIT_DEDUCT
    } else {
      auditAction = AuditAction.DEPOSIT_PARTIAL_REFUND
    }

    const response = {
      success: true,
      data: updatedDeposit,
      message: '押金结算完成',
    }

    await createAuditLog({
      action: auditAction,
      entityType: EntityType.DEPOSIT,
      entityId: depositId,
      oldValue: oldDeposit,
      newValue: updatedDeposit,
      changes,
      remark: `押金结算，单号${oldDeposit.depositNo}，退款${refundAmount}元，扣款${deductAmount}元`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedDeposit
  })
}

export const markDepositDisputed = async (
  depositId: string,
  operatorId: string,
  operatorName: string,
  operatorRole: any,
  idempotencyKey?: string
) => {
  return prisma.$transaction(async (tx: any) => {
    const oldDeposit = await tx.deposit.findUnique({
      where: { id: depositId },
    })

    if (!oldDeposit) {
      throw new BusinessError('押金单不存在', 404, 404)
    }

    const updatedDeposit = await tx.deposit.update({
      where: { id: depositId },
      data: { status: DepositStatus.DISPUTED },
    })

    const response = {
      success: true,
      data: updatedDeposit,
      message: '押金标记为有争议',
    }

    await createAuditLog({
      action: AuditAction.DEPOSIT_DISPUTE,
      entityType: EntityType.DEPOSIT,
      entityId: depositId,
      oldValue: oldDeposit,
      newValue: updatedDeposit,
      remark: `押金${oldDeposit.depositNo}标记为有争议`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return updatedDeposit
  })
}

export const getDepositList = async (
  status?: DepositStatus,
  rentalId?: string,
  page = 1,
  pageSize = 20
) => {
  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (rentalId) where.rentalId = rentalId

  const [total, items] = await Promise.all([
    prisma.deposit.count({ where }),
    prisma.deposit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        rental: {
          include: { customer: true, instrument: true },
        },
        creator: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } },
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

export const getDepositDetail = async (id: string) => {
  const deposit = await prisma.deposit.findUnique({
    where: { id },
    include: {
      rental: {
        include: {
          customer: true,
          instrument: true,
          damageClaims: true,
        },
      },
      creator: { select: { id: true, name: true, role: true } },
      handler: { select: { id: true, name: true, role: true } },
    },
  })

  if (!deposit) {
    const auditTrail = await getEntityAuditTrail(EntityType.DEPOSIT, id)
    throw new BusinessError(
      `押金单不存在，ID: ${id}`,
      404,
      404,
      { auditTrail, requestedId: id }
    )
  }

  const notes = await getEntityNotes(EntityType.DEPOSIT, id)
  const auditLogs = await getEntityAuditTrail(EntityType.DEPOSIT, id)

  return {
    ...deposit,
    notes,
    auditLogs,
  }
}
