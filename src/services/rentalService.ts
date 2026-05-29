import { AuditAction, InstrumentStatus, RentalStatus, EntityType, DepositStatus } from '../types/enums'
import prisma from '../lib/prisma'
import { generateOrderNo, calculateRentalFee, compareObjects } from '../lib/utils'
import { BusinessError } from '../middleware/errorHandler'
import { createAuditLog, getEntityAuditTrail } from './auditService'
import { createDeposit } from './depositService'
import { getEntityNotes } from './noteService'
import { toJsonString, fromJsonString, parseEvidenceUrls } from '../lib/jsonUtils'

interface CreateRentalParams {
  instrumentId: string
  customerName: string
  customerPhone: string
  customerIdCard?: string
  customerAddress?: string
  startDate: Date
  expectedEndDate: Date
  dailyRate: number
  depositAmount: number
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

interface ReturnRentalParams {
  rentalId: string
  actualEndDate?: Date
  hasDamage: boolean
  operatorId: string
  operatorName: string
  operatorRole: any
  idempotencyKey?: string
}

export const createRental = async (params: CreateRentalParams) => {
  const {
    instrumentId,
    customerName,
    customerPhone,
    customerIdCard,
    customerAddress,
    startDate,
    expectedEndDate,
    dailyRate,
    depositAmount,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const instrument = await tx.instrument.findUnique({
      where: { id: instrumentId },
    })

    if (!instrument) {
      throw new BusinessError('乐器不存在', 404, 404)
    }

    if (instrument.status !== InstrumentStatus.AVAILABLE) {
      throw new BusinessError(`乐器状态为${instrument.status}，不可租赁`, 400, 400)
    }

    if (expectedEndDate <= startDate) {
      throw new BusinessError('预计归还日期必须晚于租赁开始日期', 400, 400)
    }

    const rentalNo = generateOrderNo('RL')
    const depositNo = generateOrderNo('DP')

    let customer = await tx.customer.findUnique({
      where: { phone: customerPhone },
    })

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          idCard: customerIdCard,
          address: customerAddress,
        },
      })
    }

    const rental = await tx.rental.create({
      data: {
        rentalNo,
        instrumentId,
        customerId: customer.id,
        startDate,
        expectedEndDate,
        dailyRate,
        depositAmount,
        createdBy: operatorId,
      },
      include: {
        instrument: true,
        customer: true,
        creator: { select: { id: true, name: true, role: true } },
      },
    })

    await tx.deposit.create({
      data: {
        depositNo,
        rentalId: rental.id,
        amount: depositAmount,
        createdBy: operatorId,
      },
    })

    await tx.instrument.update({
      where: { id: instrumentId },
      data: { status: InstrumentStatus.RENTED },
    })

    const response = {
      success: true,
      data: rental,
      message: '租赁创建成功',
    }

    await createAuditLog({
      action: AuditAction.RENTAL_CREATE,
      entityType: EntityType.RENTAL,
      entityId: rental.id,
      newValue: rental,
      remark: `租赁创建，单号${rentalNo}，客户${customerName}，租期${startDate.toISOString().split('T')[0]}到${expectedEndDate.toISOString().split('T')[0]}`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return rental
  })
}

export const returnRental = async (params: ReturnRentalParams) => {
  const {
    rentalId,
    actualEndDate,
    hasDamage,
    operatorId,
    operatorName,
    operatorRole,
    idempotencyKey,
  } = params

  return prisma.$transaction(async (tx: any) => {
    const oldRental = await tx.rental.findUnique({
      where: { id: rentalId },
      include: { instrument: true, deposit: true },
    })

    if (!oldRental) {
      throw new BusinessError('租赁单不存在', 404, 404)
    }

    if (oldRental.status !== RentalStatus.ACTIVE) {
      throw new BusinessError(`租赁单状态为${oldRental.status}，不可归还`, 400, 400)
    }

    const returnDate = actualEndDate || new Date()
    const rentalFee = calculateRentalFee(
      Number(oldRental.dailyRate),
      oldRental.startDate,
      returnDate
    )

    const updatedRental = await tx.rental.update({
      where: { id: rentalId },
      data: {
        status: RentalStatus.RETURNED,
        actualEndDate: returnDate,
        handledBy: operatorId,
      },
      include: {
        instrument: true,
        customer: true,
        deposit: true,
        handler: { select: { id: true, name: true, role: true } },
      },
    })

    if (!hasDamage) {
      await tx.instrument.update({
        where: { id: oldRental.instrumentId },
        data: { status: InstrumentStatus.AVAILABLE },
      })
    } else {
      await tx.instrument.update({
        where: { id: oldRental.instrumentId },
        data: { status: InstrumentStatus.DAMAGED },
      })
    }

    const changes = compareObjects(
      { status: oldRental.status, actualEndDate: oldRental.actualEndDate },
      { status: updatedRental.status, actualEndDate: updatedRental.actualEndDate }
    )

    const response = {
      success: true,
      data: {
        ...updatedRental,
        rentalFee,
      },
      message: '归还成功',
    }

    await createAuditLog({
      action: AuditAction.RENTAL_RETURN,
      entityType: EntityType.RENTAL,
      entityId: rentalId,
      oldValue: oldRental,
      newValue: updatedRental,
      changes,
      remark: `租赁归还，单号${oldRental.rentalNo}，租金${rentalFee}元，${hasDamage ? '有损坏待处理' : '无损坏'}`,
      operatorId,
      operatorName,
      operatorRole,
      idempotencyKey,
      responseBody: response,
    })

    return { ...updatedRental, rentalFee }
  })
}

export const getRentalList = async (
  status?: RentalStatus,
  customerId?: string,
  instrumentId?: string,
  page = 1,
  pageSize = 20
) => {
  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (customerId) where.customerId = customerId
  if (instrumentId) where.instrumentId = instrumentId

  const [total, items] = await Promise.all([
    prisma.rental.count({ where }),
    prisma.rental.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        instrument: true,
        customer: true,
        deposit: true,
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

export const getRentalDetail = async (id: string) => {
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: {
      instrument: true,
      customer: true,
      deposit: true,
      damageClaims: {
        include: {
          creator: { select: { id: true, name: true, role: true } },
          handler: { select: { id: true, name: true, role: true } },
        },
      },
      creator: { select: { id: true, name: true, role: true } },
      handler: { select: { id: true, name: true, role: true } },
    },
  })

  if (!rental) {
    const auditTrail = await getEntityAuditTrail(EntityType.RENTAL, id)
    throw new BusinessError(
      `租赁单不存在，ID: ${id}`,
      404,
      404,
      { auditTrail, requestedId: id }
    )
  }

  const notes = await getEntityNotes(EntityType.RENTAL, id)
  const auditLogs = await getEntityAuditTrail(EntityType.RENTAL, id)

  const damageClaimsWithNotes = await Promise.all(
    rental.damageClaims.map(async (claim: any) => {
      const claimNotes = await getEntityNotes(EntityType.DAMAGE_CLAIM, claim.id)
      return {
        ...claim,
        evidenceUrls: parseEvidenceUrls(claim.evidenceUrls),
        notes: claimNotes,
      }
    })
  )

  return {
    ...rental,
    damageClaims: damageClaimsWithNotes,
    notes,
    auditLogs,
  }
}

export const getInstrumentList = async (
  status?: InstrumentStatus,
  category?: string,
  page = 1,
  pageSize = 20
) => {
  const where: Record<string, unknown> = {}

  if (status) where.status = status
  if (category) where.category = category

  const [total, items] = await Promise.all([
    prisma.instrument.count({ where }),
    prisma.instrument.findMany({
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
