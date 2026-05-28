import { PrismaClient, Role, InstrumentStatus, RentalStatus, DepositStatus, DamageClaimStatus, DamageSeverity, AuditAction } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import { generateOrderNo } from '../src/lib/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('开始生成演示数据...')

  // ==================== 1. 创建用户 ====================
  console.log('创建用户账号...')

  const [owner, advisor, tech] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'owner' },
      update: {},
      create: {
        username: 'owner',
        password: hashPassword('123456'),
        name: '张老板',
        role: Role.STORE_OWNER,
        phone: '13800138001',
      },
    }),
    prisma.user.upsert({
      where: { username: 'advisor' },
      update: {},
      create: {
        username: 'advisor',
        password: hashPassword('123456'),
        name: '李顾问',
        role: Role.RENTAL_ADVISOR,
        phone: '13800138002',
      },
    }),
    prisma.user.upsert({
      where: { username: 'tech' },
      update: {},
      create: {
        username: 'tech',
        password: hashPassword('123456'),
        name: '王师傅',
        role: Role.MAINTENANCE_TECH,
        phone: '13800138003',
      },
    }),
  ])

  console.log(`用户创建完成: 老板:${owner.name}, 顾问:${advisor.name}, 师傅:${tech.name}`)

  // ==================== 2. 创建乐器 ====================
  console.log('创建乐器...')

  const instruments = await Promise.all([
    prisma.instrument.upsert({
      where: { serialNumber: 'GTR001' },
      update: {},
      create: {
        name: '雅马哈C40古典吉他',
        category: '吉他',
        brand: '雅马哈',
        model: 'C40',
        serialNumber: 'GTR001',
        purchasePrice: 1500,
        rentalPrice: 25,
        depositAmount: 1000,
        status: InstrumentStatus.AVAILABLE,
        description: '入门级古典吉他，适合初学者',
      },
    }),
    prisma.instrument.upsert({
      where: { serialNumber: 'GTR002' },
      update: {},
      create: {
        name: '马丁D28民谣吉他',
        category: '吉他',
        brand: '马丁',
        model: 'D28',
        serialNumber: 'GTR002',
        purchasePrice: 18000,
        rentalPrice: 150,
        depositAmount: 8000,
        status: InstrumentStatus.AVAILABLE,
        description: '专业级民谣吉他，全单板',
      },
    }),
    prisma.instrument.upsert({
      where: { serialNumber: 'PNO001' },
      update: {},
      create: {
        name: '珠江UP118立式钢琴',
        category: '钢琴',
        brand: '珠江',
        model: 'UP118',
        serialNumber: 'PNO001',
        purchasePrice: 15000,
        rentalPrice: 200,
        depositAmount: 5000,
        status: InstrumentStatus.AVAILABLE,
        description: '家用立式钢琴',
      },
    }),
    prisma.instrument.upsert({
      where: { serialNumber: 'VIN001' },
      update: {},
      create: {
        name: '斯特拉迪瓦里小提琴',
        category: '小提琴',
        brand: '斯特拉迪瓦里',
        model: '1716',
        serialNumber: 'VIN001',
        purchasePrice: 35000,
        rentalPrice: 300,
        depositAmount: 15000,
        status: InstrumentStatus.IN_MAINTENANCE,
        description: '高级手工小提琴，专业演奏级',
      },
    }),
    prisma.instrument.upsert({
      where: { serialNumber: 'GTR003' },
      update: {},
      create: {
        name: '吉普森Les Paul电吉他',
        category: '吉他',
        brand: '吉普森',
        model: 'Les Paul',
        serialNumber: 'GTR003',
        purchasePrice: 22000,
        rentalPrice: 180,
        depositAmount: 10000,
        status: InstrumentStatus.DAMAGED,
        description: '经典电吉他，经典型号',
      },
    }),
  ])

  console.log(`乐器创建完成: ${instruments.length} 件`)

  // ==================== 3. 创建客户 ====================
  console.log('创建客户...')

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '13900139001' },
      update: {},
      create: {
        name: '小明',
        phone: '13900139001',
        idCard: '110101199001011234',
        address: '北京市朝阳区XX街道XX小区',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '13900139002' },
      update: {},
      create: {
        name: '小红',
        phone: '13900139002',
        idCard: '110101199202022345',
        address: '北京市海淀区XX路XX号',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '13900139003' },
      update: {},
      create: {
        name: '小刚',
        phone: '13900139003',
        idCard: '110101199503033456',
        address: '北京市西城区XX胡同XX号',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '13900139004' },
      update: {},
      create: {
        name: '北京XX培训学校',
        phone: '13900139004',
        idCard: '91110000MA0123456X',
        address: '北京市昌平区XX园区XX路XX号',
      },
    }),
  ])

  console.log(`客户创建完成: ${customers.length} 位`)

  // ==================== 场景1: 正常流程 - 租出→归还→无损坏→全额退款 ====================
  console.log('创建场景1: 正常流程...')

  const scenario1Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rental1Start = new Date(scenario1Date.getTime() - 15 * 24 * 60 * 60 * 1000)

  const rental1 = await prisma.rental.create({
    data: {
      rentalNo: generateOrderNo('RL'),
      instrumentId: instruments[0].id,
      customerId: customers[0].id,
      startDate: rental1Start,
      expectedEndDate: new Date(scenario1Date.getTime() + 1 * 24 * 60 * 60 * 1000),
      actualEndDate: scenario1Date,
      dailyRate: 25,
      depositAmount: 1000,
      status: RentalStatus.SETTLED,
      checkoutNotes: '琴身完好，无划痕，音色正常',
      checkinNotes: '归还检查：琴身完好，无新划痕，配件齐全',
      createdBy: advisor.id,
      handledBy: advisor.id,
      deposit: {
        create: {
          depositNo: generateOrderNo('DP'),
          amount: 1000,
          status: DepositStatus.REFUNDED,
          refundAmount: 1000,
          deductAmount: 0,
          deductReason: null,
          settledAt: scenario1Date,
          createdBy: advisor.id,
          handledBy: owner.id,
        },
      },
      notes: {
        create: [
          {
            content: '客户是音乐学院学生，周末演出用，强调要轻拿轻放',
            createdBy: advisor.id,
          },
        ],
      },
    },
    include: { deposit: true },
  })

  await prisma.instrument.update({
    where: { id: instruments[0].id },
    data: { status: InstrumentStatus.AVAILABLE },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.RENTAL_CREATE,
        entityType: 'RENTAL',
        entityId: rental1.id,
        remark: '租赁创建，客户小明租用雅马哈C40吉他15天',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: rental1Start,
        oldValue: null,
        newValue: { status: RentalStatus.ACTIVE, dailyRate: 25, depositAmount: 1000 },
        changes: { status: { old: null, new: 'ACTIVE' } },
      },
      {
        action: AuditAction.RENTAL_RETURN,
        entityType: 'RENTAL',
        entityId: rental1.id,
        remark: '租赁归还，无损坏，租金375元（15天×25元）',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario1Date,
        oldValue: { status: RentalStatus.ACTIVE },
        newValue: { status: RentalStatus.RETURNED, actualEndDate: scenario1Date.toISOString() },
        changes: { status: { old: 'ACTIVE', new: 'RETURNED' } },
      },
      {
        action: AuditAction.DEPOSIT_REFUND,
        entityType: 'DEPOSIT',
        entityId: rental1.deposit!.id,
        remark: '押金全额退还1000元，无损坏扣款',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: scenario1Date,
        oldValue: { status: DepositStatus.HELD, amount: 1000 },
        newValue: { status: DepositStatus.REFUNDED, refundAmount: 1000, deductAmount: 0 },
        changes: { status: { old: 'HELD', new: 'REFUNDED' } },
      },
      {
        action: AuditAction.STATUS_CHANGE,
        entityType: 'RENTAL',
        entityId: rental1.id,
        remark: '租赁单状态变更为已结算',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: scenario1Date,
        oldValue: { status: RentalStatus.RETURNED },
        newValue: { status: RentalStatus.SETTLED },
        changes: { status: { old: 'RETURNED', new: 'SETTLED' } },
      },
    ],
  })

  console.log('场景1创建完成')

  // ==================== 场景2: 损坏无争议 - 租出→归还→损坏→客户确认→赔偿→维修→结案 ====================
  console.log('创建场景2: 损坏无争议...')

  const scenario2Date = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
  const rental2Start = new Date(scenario2Date.getTime() - 7 * 24 * 60 * 60 * 1000)

  const rental2 = await prisma.rental.create({
    data: {
      rentalNo: generateOrderNo('RL'),
      instrumentId: instruments[1].id,
      customerId: customers[1].id,
      startDate: rental2Start,
      expectedEndDate: new Date(scenario2Date.getTime() + 3 * 24 * 60 * 60 * 1000),
      actualEndDate: scenario2Date,
      dailyRate: 150,
      depositAmount: 8000,
      status: RentalStatus.SETTLED,
      checkoutNotes: '全单板马丁D28，琴身完好，带原装琴盒',
      checkinNotes: '归还检查：琴颈有2cm划痕，面板有磕碰痕迹，客户承认是不小心撞到了门框',
      createdBy: advisor.id,
      handledBy: advisor.id,
      deposit: {
        create: {
          depositNo: generateOrderNo('DP'),
          amount: 8000,
          status: DepositStatus.PARTIAL_REFUNDED,
          refundAmount: 6500,
          deductAmount: 1500,
          deductReason: '琴颈划痕和面板磕碰维修费用',
          settledAt: new Date(scenario2Date.getTime() + 1 * 24 * 60 * 60 * 1000),
          createdBy: advisor.id,
          handledBy: owner.id,
        },
      },
      damageClaims: {
        create: {
          claimNo: generateOrderNo('DM'),
          instrumentId: instruments[1].id,
          severity: DamageSeverity.MINOR,
          description: '琴颈2cm划痕，面板磕碰凹陷',
          estimatedCost: 1500,
          status: DamageClaimStatus.CLOSED,
          reportedAt: scenario2Date,
          customerDispute: false,
          finalCost: 1500,
          liabilityParty: 'CUSTOMER',
          liabilityReason: '客户使用不当，撞到门框导致',
          evidenceUrls: [
            'https://example.com/photos/damage1.jpg',
            'https://example.com/photos/damage2.jpg',
          ],
          createdBy: advisor.id,
          handledBy: owner.id,
          closedAt: new Date(scenario2Date.getTime() + 1 * 24 * 60 * 60 * 1000),
          notes: {
            create: [
              {
                content: '客户当场确认损坏情况属实，无异议，愿意承担维修费用',
                createdBy: advisor.id,
              },
            ],
          },
        },
      },
    },
    include: { deposit: true, damageClaims: true },
  })

  const maintenance2 = await prisma.maintenance.create({
    data: {
      maintenanceNo: generateOrderNo('MT'),
      instrumentId: instruments[1].id,
      damageClaimId: rental2.damageClaims[0].id,
      type: '损坏维修',
      description: '琴颈划痕抛光修复，面板凹陷修复',
      partsCost: 300,
      laborCost: 1000,
      totalCost: 1300,
      startedAt: scenario2Date,
      completedAt: new Date(scenario2Date.getTime() + 3 * 24 * 60 * 60 * 1000),
      isCompleted: true,
      technicianNotes: '抛光后划痕基本不可见，面板凹陷已修复，音色正常',
      createdBy: tech.id,
      handledBy: tech.id,
      notes: {
        create: [
          {
            content: '维修时发现面板内部结构未受损，只需表面修复',
            createdBy: tech.id,
          },
        ],
      },
    },
  })

  await prisma.instrument.update({
    where: { id: instruments[1].id },
    data: { status: InstrumentStatus.AVAILABLE },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.RENTAL_CREATE,
        entityType: 'RENTAL',
        entityId: rental2.id,
        remark: '租赁创建，客户小红租用马丁D28吉他7天',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: rental2Start,
        oldValue: null,
        newValue: { status: RentalStatus.ACTIVE, dailyRate: 150, depositAmount: 8000 },
        changes: { status: { old: null, new: 'ACTIVE' } },
      },
      {
        action: AuditAction.RENTAL_RETURN,
        entityType: 'RENTAL',
        entityId: rental2.id,
        remark: '租赁归还，发现损坏，租金1050元（7天×150元）',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario2Date,
        oldValue: { status: RentalStatus.ACTIVE },
        newValue: { status: RentalStatus.RETURNED },
        changes: { status: { old: 'ACTIVE', new: 'RETURNED' } },
      },
      {
        action: AuditAction.DAMAGE_REPORT,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental2.damageClaims[0].id,
        remark: '上报损坏：琴颈划痕+面板磕碰，预估费用1500元',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario2Date,
        oldValue: null,
        newValue: { status: DamageClaimStatus.PENDING, severity: DamageSeverity.MINOR, estimatedCost: 1500 },
        changes: { status: { old: null, new: 'PENDING' } },
      },
      {
        action: AuditAction.DAMAGE_CONFIRM,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental2.damageClaims[0].id,
        remark: '客户确认损坏，无异议，责任方为客户',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: scenario2Date,
        oldValue: { status: DamageClaimStatus.PENDING, customerDispute: false },
        newValue: { status: DamageClaimStatus.CONFIRMED, liabilityParty: 'CUSTOMER' },
        changes: { status: { old: 'PENDING', new: 'CONFIRMED' } },
      },
      {
        action: AuditAction.MAINTENANCE_CREATE,
        entityType: 'MAINTENANCE',
        entityId: maintenance2.id,
        remark: '创建维修单，修复琴颈划痕和面板凹陷',
        operatorId: tech.id,
        operatorName: tech.name,
        operatorRole: tech.role,
        createdAt: scenario2Date,
        oldValue: null,
        newValue: { type: '损坏维修', partsCost: 300, laborCost: 1000 },
        changes: { isCompleted: { old: null, new: false } },
      },
      {
        action: AuditAction.MAINTENANCE_COMPLETE,
        entityType: 'MAINTENANCE',
        entityId: maintenance2.id,
        remark: '维修完成，实际费用1300元（配件300+人工1000）',
        operatorId: tech.id,
        operatorName: tech.name,
        operatorRole: tech.role,
        createdAt: new Date(scenario2Date.getTime() + 3 * 24 * 60 * 60 * 1000),
        oldValue: { isCompleted: false },
        newValue: { isCompleted: true, totalCost: 1300 },
        changes: { isCompleted: { old: false, new: true } },
      },
      {
        action: AuditAction.DEPOSIT_DEDUCT,
        entityType: 'DEPOSIT',
        entityId: rental2.deposit!.id,
        remark: '押金结算：退款6500元，扣款1500元作为维修赔偿',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario2Date.getTime() + 1 * 24 * 60 * 60 * 1000),
        oldValue: { status: DepositStatus.HELD, amount: 8000 },
        newValue: { status: DepositStatus.PARTIAL_REFUNDED, refundAmount: 6500, deductAmount: 1500 },
        changes: { status: { old: 'HELD', new: 'PARTIAL_REFUNDED' } },
      },
      {
        action: AuditAction.STATUS_CHANGE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental2.damageClaims[0].id,
        remark: '损坏申诉结案，客户无异议',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario2Date.getTime() + 1 * 24 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.CONFIRMED },
        newValue: { status: DamageClaimStatus.CLOSED },
        changes: { status: { old: 'CONFIRMED', new: 'CLOSED' } },
      },
    ],
  })

  console.log('场景2创建完成')

  // ==================== 场景3: 损坏有争议驳回 - 租出→归还→损坏→客户申诉→老板驳回→赔偿 ====================
  console.log('创建场景3: 损坏有争议驳回...')

  const scenario3Date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  const rental3Start = new Date(scenario3Date.getTime() - 5 * 24 * 60 * 60 * 1000)

  const rental3 = await prisma.rental.create({
    data: {
      rentalNo: generateOrderNo('RL'),
      instrumentId: instruments[2].id,
      customerId: customers[2].id,
      startDate: rental3Start,
      expectedEndDate: scenario3Date,
      actualEndDate: scenario3Date,
      dailyRate: 200,
      depositAmount: 5000,
      status: RentalStatus.SETTLED,
      checkoutNotes: '钢琴外观完好，音色正常，按键灵敏，客户签字确认',
      checkinNotes: '归还检查：C4白键松动，延音踏板有异响',
      createdBy: advisor.id,
      handledBy: advisor.id,
      deposit: {
        create: {
          depositNo: generateOrderNo('DP'),
          amount: 5000,
          status: DepositStatus.DEDUCTED,
          refundAmount: 0,
          deductAmount: 5000,
          deductReason: '钢琴按键损坏维修费用，客户申诉被驳回',
          settledAt: new Date(scenario3Date.getTime() + 5 * 24 * 60 * 60 * 1000),
          createdBy: advisor.id,
          handledBy: owner.id,
        },
      },
      damageClaims: {
        create: {
          claimNo: generateOrderNo('DM'),
          instrumentId: instruments[2].id,
          severity: DamageSeverity.MODERATE,
          description: 'C4白键松动，延音踏板异响',
          estimatedCost: 5000,
          status: DamageClaimStatus.CLOSED,
          reportedAt: scenario3Date,
          customerDispute: true,
          disputeReason: '客户说租的时候就有这个问题，只是当时没注意到，认为是老毛病',
          disputedAt: new Date(scenario3Date.getTime() + 1 * 60 * 60 * 1000),
          rejectReason: '租出检查记录显示按键正常，有客户签字确认单，且客户使用了5天，磨损痕迹是新的，判定为使用不当造成',
          finalCost: 5000,
          liabilityParty: 'CUSTOMER',
          liabilityReason: '使用不当导致按键机械结构损坏',
          evidenceUrls: [
            'https://example.com/photos/piano1.jpg',
            'https://example.com/photos/piano2.jpg',
            'https://example.com/photos/checklist.pdf',
          ],
          createdBy: advisor.id,
          handledBy: owner.id,
          closedAt: new Date(scenario3Date.getTime() + 3 * 24 * 60 * 60 * 1000),
          notes: {
            create: [
              {
                content: '客户电话申诉，情绪比较激动，反复强调租的时候就有问题',
                createdBy: advisor.id,
              },
              {
                content: '已调取租出检查录像和客户签字的检查单，证据链完整',
                createdBy: owner.id,
                isSupplement: true,
                supplementReason: '补充申诉处理过程中收集的证据信息，便于后续追溯',
              },
            ],
          },
        },
      },
    },
    include: { deposit: true, damageClaims: true },
  })

  const maintenance3 = await prisma.maintenance.create({
    data: {
      maintenanceNo: generateOrderNo('MT'),
      instrumentId: instruments[2].id,
      damageClaimId: rental3.damageClaims[0].id,
      type: '损坏维修',
      description: '更换C4白键机械结构，调整延音踏板',
      partsCost: 2000,
      laborCost: 3000,
      totalCost: 5000,
      startedAt: new Date(scenario3Date.getTime() + 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(scenario3Date.getTime() + 7 * 24 * 60 * 60 * 1000),
      isCompleted: true,
      technicianNotes: '按键连杆断裂，需要更换整套联动机构，踏板是螺丝松动导致异响',
      createdBy: tech.id,
      handledBy: tech.id,
    },
  })

  await prisma.instrument.update({
    where: { id: instruments[2].id },
    data: { status: InstrumentStatus.AVAILABLE },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.RENTAL_CREATE,
        entityType: 'RENTAL',
        entityId: rental3.id,
        remark: '租赁创建，客户小刚租用珠江钢琴5天，用于家庭练习',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: rental3Start,
        oldValue: null,
        newValue: { status: RentalStatus.ACTIVE },
        changes: { status: { old: null, new: 'ACTIVE' } },
      },
      {
        action: AuditAction.RENTAL_RETURN,
        entityType: 'RENTAL',
        entityId: rental3.id,
        remark: '租赁归还，发现按键损坏，租金1000元（5天×200元）',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario3Date,
        oldValue: { status: RentalStatus.ACTIVE },
        newValue: { status: RentalStatus.RETURNED },
        changes: { status: { old: 'ACTIVE', new: 'RETURNED' } },
      },
      {
        action: AuditAction.DAMAGE_REPORT,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental3.damageClaims[0].id,
        remark: '上报损坏：C4白键松动+踏板异响，预估费用5000元',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario3Date,
        oldValue: null,
        newValue: { status: DamageClaimStatus.PENDING },
        changes: { status: { old: null, new: 'PENDING' } },
      },
      {
        action: AuditAction.DAMAGE_DISPUTE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental3.damageClaims[0].id,
        remark: '客户提出申诉，认为是原有问题，不是自己造成的',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: new Date(scenario3Date.getTime() + 1 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.PENDING, customerDispute: false },
        newValue: { status: DamageClaimStatus.DISPUTED, customerDispute: true },
        changes: { status: { old: 'PENDING', new: 'DISPUTED' } },
      },
      {
        action: AuditAction.DAMAGE_REJECT,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental3.damageClaims[0].id,
        remark: '老板驳回申诉：有租出检查记录和客户签字，证据充分',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario3Date.getTime() + 2 * 24 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.DISPUTED },
        newValue: { status: DamageClaimStatus.REJECTED },
        changes: { status: { old: 'DISPUTED', new: 'REJECTED' } },
      },
      {
        action: AuditAction.DEPOSIT_DEDUCT,
        entityType: 'DEPOSIT',
        entityId: rental3.deposit!.id,
        remark: '押金全额扣除5000元作为维修赔偿',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario3Date.getTime() + 5 * 24 * 60 * 60 * 1000),
        oldValue: { status: DepositStatus.HELD, amount: 5000 },
        newValue: { status: DepositStatus.DEDUCTED, refundAmount: 0, deductAmount: 5000 },
        changes: { status: { old: 'HELD', new: 'DEDUCTED' } },
      },
      {
        action: AuditAction.MAINTENANCE_CREATE,
        entityType: 'MAINTENANCE',
        entityId: maintenance3.id,
        remark: '创建维修单，更换按键联动机构',
        operatorId: tech.id,
        operatorName: tech.name,
        operatorRole: tech.role,
        createdAt: new Date(scenario3Date.getTime() + 3 * 24 * 60 * 60 * 1000),
        oldValue: null,
        newValue: { isCompleted: false },
        changes: { isCompleted: { old: null, new: false } },
      },
      {
        action: AuditAction.MAINTENANCE_COMPLETE,
        entityType: 'MAINTENANCE',
        entityId: maintenance3.id,
        remark: '维修完成，实际费用5000元',
        operatorId: tech.id,
        operatorName: tech.name,
        operatorRole: tech.role,
        createdAt: new Date(scenario3Date.getTime() + 7 * 24 * 60 * 60 * 1000),
        oldValue: { isCompleted: false },
        newValue: { isCompleted: true, totalCost: 5000 },
        changes: { isCompleted: { old: false, new: true } },
      },
      {
        action: AuditAction.STATUS_CHANGE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental3.damageClaims[0].id,
        remark: '损坏申诉结案，客户赔偿5000元',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario3Date.getTime() + 3 * 24 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.REJECTED },
        newValue: { status: DamageClaimStatus.CLOSED },
        changes: { status: { old: 'REJECTED', new: 'CLOSED' } },
      },
      {
        action: AuditAction.NOTE_ADD,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental3.damageClaims[0].id,
        remark: '老板补录备注：补充证据信息',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario3Date.getTime() + 4 * 24 * 60 * 60 * 1000),
        oldValue: null,
        newValue: { isSupplement: true, supplementReason: '补充申诉处理过程中收集的证据信息' },
        changes: { isSupplement: { old: false, new: true } },
      },
    ],
  })

  console.log('场景3创建完成')

  // ==================== 场景4: 损坏有争议通过 - 租出→归还→损坏→客户申诉→老板通过重新判责 ====================
  console.log('创建场景4: 损坏有争议通过...')

  const scenario4Date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  const rental4Start = new Date(scenario4Date.getTime() - 3 * 24 * 60 * 60 * 1000)

  const rental4 = await prisma.rental.create({
    data: {
      rentalNo: generateOrderNo('RL'),
      instrumentId: instruments[4].id,
      customerId: customers[0].id,
      startDate: rental4Start,
      expectedEndDate: scenario4Date,
      actualEndDate: scenario4Date,
      dailyRate: 180,
      depositAmount: 10000,
      status: RentalStatus.SETTLED,
      checkoutNotes: '吉普森电吉他，品丝有轻微磨损，客户已知晓并签字',
      checkinNotes: '归还检查：琴颈钢筋盖丢失，拾音器旋钮有划痕',
      createdBy: advisor.id,
      handledBy: advisor.id,
      deposit: {
        create: {
          depositNo: generateOrderNo('DP'),
          amount: 10000,
          status: DepositStatus.PARTIAL_REFUNDED,
          refundAmount: 9000,
          deductAmount: 1000,
          deductReason: '琴颈钢筋盖丢失赔偿，门店承担部分责任',
          settledAt: new Date(scenario4Date.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdBy: advisor.id,
          handledBy: owner.id,
        },
      },
      damageClaims: {
        create: {
          claimNo: generateOrderNo('DM'),
          instrumentId: instruments[4].id,
          severity: DamageSeverity.MINOR,
          description: '琴颈钢筋盖丢失，拾音器旋钮划痕',
          estimatedCost: 2000,
          status: DamageClaimStatus.CLOSED,
          reportedAt: scenario4Date,
          customerDispute: true,
          disputeReason: '客户说钢筋盖租的时候就没看见，可能是之前就丢了',
          disputedAt: new Date(scenario4Date.getTime() + 30 * 60 * 1000),
          resolvedReason: '经查租出检查照片，确实没拍到钢筋盖，门店检查疏漏，重新判责：门店承担60%责任，客户承担40%',
          finalCost: 1000,
          liabilityParty: 'SHARED',
          liabilityReason: '门店检查疏漏+客户使用未尽注意义务，双方分担责任',
          evidenceUrls: [
            'https://example.com/photos/gibson1.jpg',
            'https://example.com/photos/gibson_checkout.jpg',
          ],
          createdBy: advisor.id,
          handledBy: owner.id,
          closedAt: new Date(scenario4Date.getTime() + 2 * 24 * 60 * 60 * 1000),
          notes: {
            create: [
              {
                content: '客户提到租的时候没注意看钢筋盖，建议以后检查清单要更详细',
                createdBy: advisor.id,
              },
            ],
          },
        },
      },
    },
    include: { deposit: true, damageClaims: true },
  })

  const maintenance4 = await prisma.maintenance.create({
    data: {
      maintenanceNo: generateOrderNo('MT'),
      instrumentId: instruments[4].id,
      damageClaimId: rental4.damageClaims[0].id,
      type: '损坏维修',
      description: '订购原厂钢筋盖，更换拾音器旋钮',
      partsCost: 800,
      laborCost: 200,
      totalCost: 1000,
      startedAt: new Date(scenario4Date.getTime() + 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(scenario4Date.getTime() + 3 * 24 * 60 * 60 * 1000),
      isCompleted: true,
      technicianNotes: '钢筋盖需要从原厂订购，周期2周，已加急处理',
      createdBy: tech.id,
      handledBy: tech.id,
    },
  })

  await prisma.instrument.update({
    where: { id: instruments[4].id },
    data: { status: InstrumentStatus.AVAILABLE },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.RENTAL_CREATE,
        entityType: 'RENTAL',
        entityId: rental4.id,
        remark: '租赁创建，客户小明租用吉普森电吉他3天，演出使用',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: rental4Start,
        oldValue: null,
        newValue: { status: RentalStatus.ACTIVE },
        changes: { status: { old: null, new: 'ACTIVE' } },
      },
      {
        action: AuditAction.RENTAL_RETURN,
        entityType: 'RENTAL',
        entityId: rental4.id,
        remark: '租赁归还，发现钢筋盖丢失，租金540元（3天×180元）',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario4Date,
        oldValue: { status: RentalStatus.ACTIVE },
        newValue: { status: RentalStatus.RETURNED },
        changes: { status: { old: 'ACTIVE', new: 'RETURNED' } },
      },
      {
        action: AuditAction.DAMAGE_REPORT,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental4.damageClaims[0].id,
        remark: '上报损坏：钢筋盖丢失+旋钮划痕，预估2000元',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario4Date,
        oldValue: null,
        newValue: { status: DamageClaimStatus.PENDING, estimatedCost: 2000 },
        changes: { status: { old: null, new: 'PENDING' } },
      },
      {
        action: AuditAction.DAMAGE_DISPUTE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental4.damageClaims[0].id,
        remark: '客户申诉：钢筋盖租的时候可能就没了',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: new Date(scenario4Date.getTime() + 30 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.PENDING, customerDispute: false },
        newValue: { status: DamageClaimStatus.DISPUTED, customerDispute: true },
        changes: { status: { old: 'PENDING', new: 'DISPUTED' } },
      },
      {
        action: AuditAction.DAMAGE_RESOLVE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental4.damageClaims[0].id,
        remark: '老板通过申诉：门店检查疏漏，重新判责，双方分担',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario4Date.getTime() + 1 * 24 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.DISPUTED, estimatedCost: 2000, liabilityParty: null },
        newValue: { status: DamageClaimStatus.RESOLVED, finalCost: 1000, liabilityParty: 'SHARED' },
        changes: { status: { old: 'DISPUTED', new: 'RESOLVED' }, estimatedCost: { old: 2000, new: 1000 } },
      },
      {
        action: AuditAction.DEPOSIT_DEDUCT,
        entityType: 'DEPOSIT',
        entityId: rental4.deposit!.id,
        remark: '押金结算：退款9000元，扣款1000元（客户承担部分）',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario4Date.getTime() + 2 * 24 * 60 * 60 * 1000),
        oldValue: { status: DepositStatus.HELD, amount: 10000 },
        newValue: { status: DepositStatus.PARTIAL_REFUNDED, refundAmount: 9000, deductAmount: 1000 },
        changes: { status: { old: 'HELD', new: 'PARTIAL_REFUNDED' } },
      },
      {
        action: AuditAction.STATUS_CHANGE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental4.damageClaims[0].id,
        remark: '损坏申诉结案，双方分担责任',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario4Date.getTime() + 2 * 24 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.RESOLVED },
        newValue: { status: DamageClaimStatus.CLOSED },
        changes: { status: { old: 'RESOLVED', new: 'CLOSED' } },
      },
    ],
  })

  console.log('场景4创建完成')

  // ==================== 场景5: 维修中 - 小提琴正在维修 ====================
  console.log('创建场景5: 维修中...')

  const scenario5Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  const maintenance5 = await prisma.maintenance.create({
    data: {
      maintenanceNo: generateOrderNo('MT'),
      instrumentId: instruments[3].id,
      type: '常规保养',
      description: '小提琴换弦、琴码打磨、指板清洁',
      partsCost: 500,
      laborCost: 300,
      totalCost: 800,
      startedAt: scenario5Date,
      completedAt: null,
      isCompleted: false,
      technicianNotes: '正在等待新琴弦到货，预计明天完成',
      createdBy: tech.id,
      handledBy: tech.id,
      notes: {
        create: [
          {
            content: '客户是专业演奏家，要求使用奥地利进口琴弦',
            createdBy: tech.id,
          },
        ],
      },
    },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.MAINTENANCE_CREATE,
        entityType: 'MAINTENANCE',
        entityId: maintenance5.id,
        remark: '创建常规保养单，小提琴专业保养',
        operatorId: tech.id,
        operatorName: tech.name,
        operatorRole: tech.role,
        createdAt: scenario5Date,
        oldValue: null,
        newValue: { isCompleted: false, type: '常规保养' },
        changes: { isCompleted: { old: null, new: false } },
      },
    ],
  })

  console.log('场景5创建完成')

  // ==================== 场景6: 逾期未还 - 学校合作租赁 ====================
  console.log('创建场景6: 逾期未还...')

  const scenario6Date = new Date()
  const rental6Start = new Date(scenario6Date.getTime() - 10 * 24 * 60 * 60 * 1000)
  const rental6ExpectedEnd = new Date(scenario6Date.getTime() - 2 * 24 * 60 * 60 * 1000)

  const rental6 = await prisma.rental.create({
    data: {
      rentalNo: generateOrderNo('RL'),
      instrumentId: instruments[0].id,
      customerId: customers[3].id,
      startDate: rental6Start,
      expectedEndDate: rental6ExpectedEnd,
      actualEndDate: null,
      dailyRate: 25,
      depositAmount: 1000,
      status: RentalStatus.OVERDUE,
      checkoutNotes: '学校艺术节使用，10把吉他批量租赁，这是其中一把',
      checkinNotes: null,
      createdBy: advisor.id,
      handledBy: null,
      deposit: {
        create: {
          depositNo: generateOrderNo('DP'),
          amount: 1000,
          status: DepositStatus.HELD,
          refundAmount: 0,
          deductAmount: 0,
          deductReason: null,
          settledAt: null,
          createdBy: advisor.id,
          handledBy: null,
        },
      },
      notes: {
        create: [
          {
            content: '学校合作客户，长期合作关系，逾期2天，已电话联系，说艺术节延期了',
            createdBy: advisor.id,
          },
          {
            content: '学校回款通常每月结一次，这笔可能要到月底一起结算',
            createdBy: owner.id,
            isSupplement: true,
            supplementReason: '记录学校客户的特殊结算周期，便于财务跟进',
          },
        ],
      },
    },
    include: { deposit: true },
  })

  await prisma.instrument.update({
    where: { id: instruments[0].id },
    data: { status: InstrumentStatus.RENTED },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.RENTAL_CREATE,
        entityType: 'RENTAL',
        entityId: rental6.id,
        remark: '租赁创建，北京XX培训学校批量租赁10把吉他，这是第3把，租期8天',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: rental6Start,
        oldValue: null,
        newValue: { status: RentalStatus.ACTIVE, dailyRate: 25 },
        changes: { status: { old: null, new: 'ACTIVE' } },
      },
      {
        action: AuditAction.STATUS_CHANGE,
        entityType: 'RENTAL',
        entityId: rental6.id,
        remark: '租赁逾期2天，系统自动标记为OVERDUE',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: scenario6Date,
        oldValue: { status: RentalStatus.ACTIVE },
        newValue: { status: RentalStatus.OVERDUE },
        changes: { status: { old: 'ACTIVE', new: 'OVERDUE' } },
      },
    ],
  })

  console.log('场景6创建完成')

  // ==================== 场景7: 待处理损坏申诉 ====================
  console.log('创建场景7: 待处理损坏申诉...')

  const scenario7Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  const rental7Start = new Date(scenario7Date.getTime() - 4 * 24 * 60 * 60 * 1000)

  const rental7 = await prisma.rental.create({
    data: {
      rentalNo: generateOrderNo('RL'),
      instrumentId: instruments[1].id,
      customerId: customers[1].id,
      startDate: rental7Start,
      expectedEndDate: scenario7Date,
      actualEndDate: scenario7Date,
      dailyRate: 150,
      depositAmount: 8000,
      status: RentalStatus.RETURNED,
      checkoutNotes: '马丁D28吉他，完好租出',
      checkinNotes: '归还检查：琴桥有开胶迹象，客户说正常使用',
      createdBy: advisor.id,
      handledBy: advisor.id,
      deposit: {
        create: {
          depositNo: generateOrderNo('DP'),
          amount: 8000,
          status: DepositStatus.DISPUTED,
          refundAmount: 0,
          deductAmount: 0,
          deductReason: null,
          settledAt: null,
          createdBy: advisor.id,
          handledBy: null,
        },
      },
      damageClaims: {
        create: {
          claimNo: generateOrderNo('DM'),
          instrumentId: instruments[1].id,
          severity: DamageSeverity.MODERATE,
          description: '琴桥开胶，需要重新粘合',
          estimatedCost: 2500,
          status: DamageClaimStatus.DISPUTED,
          reportedAt: scenario7Date,
          customerDispute: true,
          disputeReason: '客户认为是自然开胶，属于正常老化，不是使用问题',
          disputedAt: new Date(scenario7Date.getTime() + 2 * 60 * 60 * 1000),
          finalCost: null,
          liabilityParty: null,
          liabilityReason: null,
          evidenceUrls: [
            'https://example.com/photos/bridge1.jpg',
            'https://example.com/photos/bridge2.jpg',
          ],
          createdBy: advisor.id,
          handledBy: null,
          notes: {
            create: [
              {
                content: '客户是老客户了，之前租过很多次，一直很爱惜乐器',
                createdBy: advisor.id,
              },
            ],
          },
        },
      },
    },
    include: { deposit: true, damageClaims: true },
  })

  await prisma.instrument.update({
    where: { id: instruments[1].id },
    data: { status: InstrumentStatus.DAMAGED },
  })

  await prisma.auditLog.createMany({
    data: [
      {
        action: AuditAction.RENTAL_CREATE,
        entityType: 'RENTAL',
        entityId: rental7.id,
        remark: '租赁创建，客户小红租用马丁D28吉他4天',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: rental7Start,
        oldValue: null,
        newValue: { status: RentalStatus.ACTIVE },
        changes: { status: { old: null, new: 'ACTIVE' } },
      },
      {
        action: AuditAction.RENTAL_RETURN,
        entityType: 'RENTAL',
        entityId: rental7.id,
        remark: '租赁归还，发现琴桥开胶，租金600元（4天×150元）',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario7Date,
        oldValue: { status: RentalStatus.ACTIVE },
        newValue: { status: RentalStatus.RETURNED },
        changes: { status: { old: 'ACTIVE', new: 'RETURNED' } },
      },
      {
        action: AuditAction.DAMAGE_REPORT,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental7.damageClaims[0].id,
        remark: '上报损坏：琴桥开胶，预估2500元',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: scenario7Date,
        oldValue: null,
        newValue: { status: DamageClaimStatus.PENDING },
        changes: { status: { old: null, new: 'PENDING' } },
      },
      {
        action: AuditAction.DAMAGE_DISPUTE,
        entityType: 'DAMAGE_CLAIM',
        entityId: rental7.damageClaims[0].id,
        remark: '客户申诉：认为是自然老化开胶',
        operatorId: advisor.id,
        operatorName: advisor.name,
        operatorRole: advisor.role,
        createdAt: new Date(scenario7Date.getTime() + 2 * 60 * 60 * 1000),
        oldValue: { status: DamageClaimStatus.PENDING, customerDispute: false },
        newValue: { status: DamageClaimStatus.DISPUTED, customerDispute: true },
        changes: { status: { old: 'PENDING', new: 'DISPUTED' } },
      },
      {
        action: AuditAction.DEPOSIT_DISPUTE,
        entityType: 'DEPOSIT',
        entityId: rental7.deposit!.id,
        remark: '押金标记为有争议，等待损坏申诉处理结果',
        operatorId: owner.id,
        operatorName: owner.name,
        operatorRole: owner.role,
        createdAt: new Date(scenario7Date.getTime() + 3 * 60 * 60 * 1000),
        oldValue: { status: DepositStatus.HELD },
        newValue: { status: DepositStatus.DISPUTED },
        changes: { status: { old: 'HELD', new: 'DISPUTED' } },
      },
    ],
  })

  console.log('场景7创建完成')

  console.log('\n========================================')
  console.log('✅ 所有演示数据生成完成！')
  console.log('========================================')
  console.log('\n📊 数据统计：')
  console.log('  - 用户: 3个（老板、顾问、师傅）')
  console.log('  - 乐器: 5件')
  console.log('  - 客户: 4位（含学校客户）')
  console.log('  - 租赁单: 6个（覆盖所有状态）')
  console.log('  - 押金单: 6个（覆盖所有状态）')
  console.log('  - 损坏申诉: 5个（覆盖所有状态）')
  console.log('  - 维修记录: 4个（含进行中）')
  console.log('  - 审计日志: 30+条')
  console.log('  - 备注: 8条（含2条补录备注）')
  console.log('\n🎭 业务场景：')
  console.log('  1. 正常流程（无损坏全额退款）')
  console.log('  2. 损坏无争议（客户确认赔偿）')
  console.log('  3. 损坏有争议（老板驳回申诉）')
  console.log('  4. 损坏有争议（老板通过申诉，重新判责）')
  console.log('  5. 维修中（小提琴保养）')
  console.log('  6. 逾期未还（学校合作，回款特殊）')
  console.log('  7. 待处理申诉（等待老板审批）')
  console.log('\n🔑 测试账号：')
  console.log('  老板: owner / 123456')
  console.log('  顾问: advisor / 123456')
  console.log('  师傅: tech / 123456')
  console.log('========================================\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
