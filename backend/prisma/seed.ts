import prisma from '../src/config/prisma';
import { hashPassword } from '../src/utils/auth';
import { generateRepairOrderNo, generateApplicationNo, generateLockNo } from '../src/utils/orderNo';
import { serializePermissions, serializeJson } from '../src/utils/transform';
import { Role, Permission, RepairOrderStatus, PartApplicationStatus, InventoryLockStatus, NoteType } from '../src/types/enums';

async function main() {
  console.log('🌱 开始填充样例数据...');

  // === 1. 创建用户 ===
  console.log('  → 创建用户账号...');

  const allPermissions = Object.values(Permission);

  const [admin, manager, reception, tech] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashPassword('admin123'),
        realName: '系统管理员',
        email: 'admin@watch.com',
        phone: '13800000000',
        role: Role.ADMIN as string as string,
        permissions: serializePermissions(allPermissions),
      },
    }),
    prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        password: hashPassword('manager123'),
        realName: '张经理',
        email: 'manager@watch.com',
        phone: '13800000001',
        role: Role.SERVICE_MANAGER as string as string,
        permissions: serializePermissions([
          Permission.REPAIR_ORDER_VIEW,
          Permission.REPAIR_ORDER_EDIT,
          Permission.PART_APPLICATION_VIEW,
          Permission.PART_APPLICATION_APPROVE,
          Permission.PART_APPLICATION_REJECT,
          Permission.INVENTORY_VIEW,
          Permission.INVENTORY_LOCK,
          Permission.INVENTORY_UNLOCK,
          Permission.EXPORT_DATA,
        ]),
      },
    }),
    prisma.user.upsert({
      where: { username: 'reception' },
      update: {},
      create: {
        username: 'reception',
        password: hashPassword('rec123'),
        realName: '李顾问',
        email: 'reception@watch.com',
        phone: '13800000002',
        role: Role.RECEPTIONIST as string as string,
        permissions: serializePermissions([
          Permission.REPAIR_ORDER_CREATE,
          Permission.REPAIR_ORDER_VIEW,
          Permission.REPAIR_ORDER_EDIT,
          Permission.PART_APPLICATION_CREATE,
          Permission.PART_APPLICATION_VIEW,
          Permission.INVENTORY_VIEW,
        ]),
      },
    }),
    prisma.user.upsert({
      where: { username: 'tech' },
      update: {},
      create: {
        username: 'tech',
        password: hashPassword('tech123'),
        realName: '王技师',
        email: 'tech@watch.com',
        phone: '13800000003',
        role: Role.TECHNICIAN as string as string,
        permissions: serializePermissions([
          Permission.REPAIR_ORDER_VIEW,
          Permission.PART_APPLICATION_CREATE,
          Permission.PART_APPLICATION_VIEW,
          Permission.INVENTORY_VIEW,
        ]),
      },
    }),
  ]);

  console.log(`    ✅ 已创建4个测试账号: admin/manager/reception/tech`);

  // === 2. 创建客户 ===
  console.log('  → 创建客户数据...');

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '13900001111' },
      update: {},
      create: {
        name: '陈先生',
        phone: '13900001111',
        email: 'chen@email.com',
        address: '北京市朝阳区建国路88号',
        memberLevel: 'VIP',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '13900002222' },
      update: {},
      create: {
        name: '刘女士',
        phone: '13900002222',
        email: 'liu@email.com',
        address: '上海市浦东新区陆家嘴环路1000号',
        memberLevel: 'NORMAL',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '13900003333' },
      update: {},
      create: {
        name: '王先生',
        phone: '13900003333',
        memberLevel: 'NORMAL',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '13900004444' },
      update: {},
      create: {
        name: '赵先生',
        phone: '13900004444',
        memberLevel: 'VIP',
      },
    }),
  ]);

  // === 3. 创建手表 ===
  console.log('  → 创建手表数据...');

  const watches = await Promise.all([
    prisma.watch.upsert({
      where: { serialNumber: 'ROLEX-2023-SUB-8888' },
      update: {},
      create: {
        brand: 'Rolex',
        model: 'Submariner Date',
        serialNumber: 'ROLEX-2023-SUB-8888',
        movementType: '自动机械',
        productionYear: 2023,
        caseMaterial: '精钢',
        strapType: '蚝式表带',
        description: '黑水鬼，41mm',
      },
    }),
    prisma.watch.upsert({
      where: { serialNumber: 'OMEGA-2022-SEA-6666' },
      update: {},
      create: {
        brand: 'Omega',
        model: 'Seamaster Aqua Terra',
        serialNumber: 'OMEGA-2022-SEA-6666',
        movementType: '自动机械',
        productionYear: 2022,
        caseMaterial: '精钢',
        strapType: '皮质表带',
        description: '海马系列，蓝盘',
      },
    }),
    prisma.watch.upsert({
      where: { serialNumber: 'CARTIER-2021-SAN-4444' },
      update: {},
      create: {
        brand: 'Cartier',
        model: 'Santos de Cartier',
        serialNumber: 'CARTIER-2021-SAN-4444',
        movementType: '自动机械',
        productionYear: 2021,
        caseMaterial: '精钢间金',
        strapType: '金属表带',
        description: '山度士系列，中号',
      },
    }),
    prisma.watch.upsert({
      where: { serialNumber: 'PP-2020-CAL-2222' },
      update: {},
      create: {
        brand: 'Patek Philippe',
        model: 'Calatrava',
        serialNumber: 'PP-2020-CAL-2222',
        movementType: '手动机械',
        productionYear: 2020,
        caseMaterial: '18K白金',
        strapType: '鳄鱼皮表带',
        description: '古典系列，正装表',
      },
    }),
    prisma.watch.upsert({
      where: { serialNumber: 'TAG-2024-F1-1111' },
      update: {},
      create: {
        brand: 'TAG Heuer',
        model: 'Formula 1',
        serialNumber: 'TAG-2024-F1-1111',
        movementType: '石英',
        productionYear: 2024,
        caseMaterial: '精钢',
        strapType: '橡胶表带',
        description: 'F1系列，计时码表',
      },
    }),
  ]);

  // === 4. 创建配件 ===
  console.log('  → 创建配件目录...');

  const partsData = [
    { sku: 'MVT-ROLEX-3235', name: '3235机芯总成', category: '机芯', brand: 'Rolex', unit: '个', unitPrice: 12800, specification: '原厂全新', description: '劳力士3235型自动机芯，70小时动力储存' },
    { sku: 'MVT-OMEGA-8800', name: '8800机芯总成', category: '机芯', brand: 'Omega', unit: '个', unitPrice: 8500, specification: '原厂全新', description: '欧米茄8800型至臻天文台机芯' },
    { sku: 'CRY-SAPH-41MM', name: '蓝宝石表镜 41mm', category: '表镜', unit: '片', unitPrice: 680, specification: '防眩涂层', description: '41mm弧形蓝宝石水晶玻璃表镜，双面防眩' },
    { sku: 'CRY-SAPH-40MM', name: '蓝宝石表镜 40mm', category: '表镜', unit: '片', unitPrice: 580, specification: '防眩涂层', description: '40mm弧形蓝宝石水晶玻璃表镜' },
    { sku: 'GSK-SS-ROLEX', name: '防水表冠 O形圈组', category: '密封件', unit: '套', unitPrice: 120, specification: '劳力士专用', description: '包含表冠密封管、防水圈、把管' },
    { sku: 'GSK-BACK-SEAL', name: '底盖防水胶圈', category: '密封件', unit: '个', unitPrice: 45, specification: '通用型', description: '丁腈橡胶底盖密封圈' },
    { sku: 'BAT-SR626SW', name: '纽扣电池 SR626SW', category: '电池', unit: '粒', unitPrice: 25, description: '氧化银纽扣电池，377型号' },
    { sku: 'SPR-BAR-20MM', name: '生耳 20mm', category: '表带配件', unit: '对', unitPrice: 15, specification: '不锈钢', description: '20mm不锈钢弹簧生耳，一对2支' },
    { sku: 'LCK-CROWN-ROLEX', name: '锁把组件', category: '表冠', brand: 'Rolex', unit: '套', unitPrice: 850, specification: '三扣锁', description: '劳力士三扣锁表冠系统' },
    { sku: 'CLN-ULTRASONIC', name: '超声波清洗液', category: '耗材', unit: '瓶', unitPrice: 80, description: '1000ml专业手表清洗液' },
    { sku: 'MVT-ETA-2824', name: 'ETA 2824-2机芯', category: '机芯', unit: '个', unitPrice: 2200, specification: '瑞士原厂', description: 'ETA 2824-2 自动上链机芯' },
    { sku: 'REG-OIL-MOEBIUS', name: '表油 9010', category: '耗材', brand: 'Moebius', unit: '瓶', unitPrice: 180, description: 'Moebius 9010 合成表油' },
  ];

  const parts = await Promise.all(
    partsData.map((p) =>
      prisma.part.upsert({
        where: { sku: p.sku },
        update: {},
        create: p,
      })
    )
  );

  // === 5. 创建库存 ===
  console.log('  → 创建库存数据...');

  const inventoryData = [
    { partSku: 'MVT-ROLEX-3235', quantity: 2, minStock: 1 },
    { partSku: 'MVT-OMEGA-8800', quantity: 3, minStock: 1 },
    { partSku: 'CRY-SAPH-41MM', quantity: 15, minStock: 5 },
    { partSku: 'CRY-SAPH-40MM', quantity: 0, minStock: 5 },
    { partSku: 'GSK-SS-ROLEX', quantity: 8, minStock: 3 },
    { partSku: 'GSK-BACK-SEAL', quantity: 50, minStock: 20 },
    { partSku: 'BAT-SR626SW', quantity: 100, minStock: 30 },
    { partSku: 'SPR-BAR-20MM', quantity: 200, minStock: 50 },
    { partSku: 'LCK-CROWN-ROLEX', quantity: 1, minStock: 2 },
    { partSku: 'CLN-ULTRASONIC', quantity: 5, minStock: 3 },
    { partSku: 'MVT-ETA-2824', quantity: 6, minStock: 2 },
    { partSku: 'REG-OIL-MOEBIUS', quantity: 12, minStock: 5 },
  ];

  for (const inv of inventoryData) {
    const part = parts.find((p) => p.sku === inv.partSku);
    if (!part) continue;

    await prisma.inventory.upsert({
      where: {
        partId_warehouse_batchNo: {
          partId: part.id,
          warehouse: 'MAIN',
          batchNo: 'BATCH-2024-01',
        },
      },
      update: {},
      create: {
        partId: part.id,
        warehouse: 'MAIN',
        location: `A-${Math.floor(Math.random() * 10) + 1}`,
        quantity: inv.quantity,
        minStock: inv.minStock,
        batchNo: 'BATCH-2024-01',
      },
    });
  }

  const allInventory = await prisma.inventory.findMany({
    include: { part: true },
  });

  // === 6. 创建寄修单（各种状态，覆盖完整生命周期） ===
  console.log('  → 创建寄修单（覆盖各种状态）...');

  const baseDate = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - days);
    return d;
  };

  // 场景1: 完整正常流 - 已结案 (陈先生的劳力士)
  const completedOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[0].id,
      watchId: watches[0].id,
      status: RepairOrderStatus.CLOSED as string,
      problemDescription: '走时不准，每天慢约15秒，需要保养',
      appearanceCondition: '表壳有正常佩戴划痕，无磕碰',
      accessories: '原装表盒、保卡齐全',
      estimatedCost: 3500,
      actualCost: 3500,
      quotationDate: daysAgo(25),
      customerConfirmDate: daysAgo(24),
      receivedBy: reception.id,
      assignedTo: tech.id,
      technician: tech.id,
      estimatedDeliveryDate: daysAgo(10),
      actualDeliveryDate: daysAgo(8),
      pickupDate: daysAgo(5),
      receivedAt: daysAgo(30),
      createdAt: daysAgo(30),
      satisfactionScore: 5,
      satisfactionNote: '服务很好，走时恢复精准',
    },
  });

  // 场景2: 维修中 - 需要配件 (刘女士的欧米茄)
  const inRepairOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[1].id,
      watchId: watches[1].id,
      status: RepairOrderStatus.IN_REPAIR as string,
      problemDescription: '表镜碎裂，需要更换',
      appearanceCondition: '表镜碎裂，表壳有轻微磕碰痕迹',
      accessories: '只有手表，无其他配件',
      estimatedCost: 1280,
      quotationDate: daysAgo(14),
      customerConfirmDate: daysAgo(13),
      receivedBy: reception.id,
      assignedTo: tech.id,
      technician: tech.id,
      estimatedDeliveryDate: daysAgo(3),
      receivedAt: daysAgo(20),
      createdAt: daysAgo(20),
    },
  });

  // 场景3: 待报价 - 新接件 (王先生的卡地亚)
  const pendingQuoteOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[2].id,
      watchId: watches[2].id,
      status: RepairOrderStatus.PENDING_QUOTATION as string,
      problemDescription: '手表进水，表针起雾，走时停走',
      appearanceCondition: '正常佩戴痕迹',
      accessories: '手表、保卡',
      receivedBy: reception.id,
      receivedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
  });

  // 场景4: 待配件 - 等待配件到货 (赵先生的PP)
  const awaitingPartsOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[3].id,
      watchId: watches[3].id,
      status: RepairOrderStatus.AWAITING_PARTS as string,
      problemDescription: '机芯故障，需要更换零件',
      appearanceCondition: '品相完好',
      accessories: '全套配件齐全',
      estimatedCost: 8800,
      quotationDate: daysAgo(10),
      customerConfirmDate: daysAgo(9),
      receivedBy: reception.id,
      assignedTo: tech.id,
      technician: tech.id,
      estimatedDeliveryDate: daysAgo(-15),
      receivedAt: daysAgo(15),
      createdAt: daysAgo(15),
    },
  });

  // 场景5: 已报价待确认 (王先生的泰格豪雅)
  const quotationSentOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[2].id,
      watchId: watches[4].id,
      status: RepairOrderStatus.QUOTATION_SENT as string,
      problemDescription: '石英表没电，需要更换电池',
      appearanceCondition: '品相完好',
      accessories: '手表',
      estimatedCost: 150,
      quotationDate: daysAgo(1),
      receivedBy: reception.id,
      receivedAt: daysAgo(3),
      createdAt: daysAgo(3),
    },
  });

  // 场景6: 客户拒绝报价 - 问题流
  const quotationRejectedOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[1].id,
      watchId: watches[1].id,
      status: RepairOrderStatus.QUOTATION_REJECTED as string,
      problemDescription: '手表磕碰后走时不准',
      appearanceCondition: '表壳10点钟位置有明显磕碰',
      accessories: '手表',
      estimatedCost: 6800,
      quotationDate: daysAgo(7),
      customerConfirmDate: daysAgo(5),
      receivedBy: reception.id,
      receivedAt: daysAgo(12),
      createdAt: daysAgo(12),
    },
  });

  // 场景7: 维修完成待取件
  const readyOrder = await prisma.repairOrder.create({
    data: {
      orderNo: generateRepairOrderNo(),
      customerId: customers[0].id,
      watchId: watches[0].id,
      status: RepairOrderStatus.READY_FOR_PICKUP as string,
      problemDescription: '常规保养',
      appearanceCondition: '正常佩戴痕迹',
      accessories: '全套',
      estimatedCost: 2800,
      actualCost: 2800,
      quotationDate: daysAgo(18),
      customerConfirmDate: daysAgo(17),
      receivedBy: reception.id,
      assignedTo: tech.id,
      technician: tech.id,
      actualDeliveryDate: daysAgo(1),
      receivedAt: daysAgo(25),
      createdAt: daysAgo(25),
    },
  });

  const repairOrders = [completedOrder, inRepairOrder, pendingQuoteOrder, awaitingPartsOrder, quotationSentOrder, quotationRejectedOrder, readyOrder];

  // === 7. 创建状态历史 ===
  console.log('  → 创建状态流转历史...');

  const statusHistories = [
    // 已结案单的完整状态链
    { repairOrderId: completedOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(30) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.PENDING_QUOTATION as string, to: RepairOrderStatus.QUOTATION_SENT as string, by: manager.id, reason: '提交报价', date: daysAgo(25) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.QUOTATION_SENT as string, to: RepairOrderStatus.QUOTATION_APPROVED as string, by: reception.id, reason: '客户确认接受报价', date: daysAgo(24) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.QUOTATION_APPROVED as string, to: RepairOrderStatus.IN_REPAIR as string, by: manager.id, reason: '开始维修', date: daysAgo(20) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.IN_REPAIR as string, to: RepairOrderStatus.REPAIR_COMPLETED as string, by: tech.id, reason: '维修完成，检测合格', date: daysAgo(8) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.REPAIR_COMPLETED as string, to: RepairOrderStatus.READY_FOR_PICKUP as string, by: manager.id, reason: '通知客户取件', date: daysAgo(7) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.READY_FOR_PICKUP as string, to: RepairOrderStatus.PICKED_UP, by: reception.id, reason: '客户已取件', date: daysAgo(5) },
    { repairOrderId: completedOrder.id, from: RepairOrderStatus.PICKED_UP, to: RepairOrderStatus.CLOSED as string, by: manager.id, reason: '订单结案', date: daysAgo(1) },

    // 维修中单
    { repairOrderId: inRepairOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(20) },
    { repairOrderId: inRepairOrder.id, from: RepairOrderStatus.PENDING_QUOTATION as string, to: RepairOrderStatus.QUOTATION_SENT as string, by: manager.id, reason: '提交报价', date: daysAgo(14) },
    { repairOrderId: inRepairOrder.id, from: RepairOrderStatus.QUOTATION_SENT as string, to: RepairOrderStatus.QUOTATION_APPROVED as string, by: reception.id, reason: '客户确认', date: daysAgo(13) },
    { repairOrderId: inRepairOrder.id, from: RepairOrderStatus.QUOTATION_APPROVED as string, to: RepairOrderStatus.AWAITING_PARTS as string, by: manager.id, reason: '等待表镜配件', date: daysAgo(12) },
    { repairOrderId: inRepairOrder.id, from: RepairOrderStatus.AWAITING_PARTS as string, to: RepairOrderStatus.IN_REPAIR as string, by: manager.id, reason: '配件到位，开始维修', date: daysAgo(5) },

    // 被拒绝报价单 - 问题流
    { repairOrderId: quotationRejectedOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(12) },
    { repairOrderId: quotationRejectedOrder.id, from: RepairOrderStatus.PENDING_QUOTATION as string, to: RepairOrderStatus.QUOTATION_SENT as string, by: manager.id, reason: '提交报价', date: daysAgo(7) },
    { repairOrderId: quotationRejectedOrder.id, from: RepairOrderStatus.QUOTATION_SENT as string, to: RepairOrderStatus.QUOTATION_REJECTED as string, by: reception.id, reason: '客户认为维修费用过高，拒绝报价', date: daysAgo(5) },

    // 待配件单
    { repairOrderId: awaitingPartsOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(15) },
    { repairOrderId: awaitingPartsOrder.id, from: RepairOrderStatus.PENDING_QUOTATION as string, to: RepairOrderStatus.QUOTATION_SENT as string, by: manager.id, reason: '提交报价', date: daysAgo(10) },
    { repairOrderId: awaitingPartsOrder.id, from: RepairOrderStatus.QUOTATION_SENT as string, to: RepairOrderStatus.QUOTATION_APPROVED as string, by: reception.id, reason: '客户确认报价', date: daysAgo(9) },
    { repairOrderId: awaitingPartsOrder.id, from: RepairOrderStatus.QUOTATION_APPROVED as string, to: RepairOrderStatus.AWAITING_PARTS as string, by: manager.id, reason: '配件申请已提交，等待调货', date: daysAgo(8) },

    // 待取件单
    { repairOrderId: readyOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(25) },
    { repairOrderId: readyOrder.id, from: RepairOrderStatus.PENDING_QUOTATION as string, to: RepairOrderStatus.QUOTATION_SENT as string, by: manager.id, reason: '提交报价', date: daysAgo(18) },
    { repairOrderId: readyOrder.id, from: RepairOrderStatus.QUOTATION_SENT as string, to: RepairOrderStatus.QUOTATION_APPROVED as string, by: reception.id, reason: '客户确认', date: daysAgo(17) },
    { repairOrderId: readyOrder.id, from: RepairOrderStatus.QUOTATION_APPROVED as string, to: RepairOrderStatus.IN_REPAIR as string, by: manager.id, reason: '开始保养', date: daysAgo(10) },
    { repairOrderId: readyOrder.id, from: RepairOrderStatus.IN_REPAIR as string, to: RepairOrderStatus.REPAIR_COMPLETED as string, by: tech.id, reason: '保养完成', date: daysAgo(1) },
    { repairOrderId: readyOrder.id, from: RepairOrderStatus.REPAIR_COMPLETED as string, to: RepairOrderStatus.READY_FOR_PICKUP as string, by: manager.id, reason: '通知客户取件', date: daysAgo(0) },

    // 待报价单
    { repairOrderId: pendingQuoteOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(2) },

    // 已报价待确认
    { repairOrderId: quotationSentOrder.id, from: null, to: RepairOrderStatus.PENDING_QUOTATION as string, by: reception.id, reason: '创建寄修单', date: daysAgo(3) },
    { repairOrderId: quotationSentOrder.id, from: RepairOrderStatus.PENDING_QUOTATION as string, to: RepairOrderStatus.QUOTATION_SENT as string, by: manager.id, reason: '提交报价', date: daysAgo(1) },
  ];

  for (const h of statusHistories) {
    await prisma.repairStatusHistory.create({
      data: {
        repairOrderId: h.repairOrderId,
        fromStatus: h.from,
        toStatus: h.to,
        changedBy: h.by,
        changeReason: h.reason,
        createdAt: h.date,
      },
    });
  }

  // === 8. 创建配件申请单（覆盖正常流和问题流） ===
  console.log('  → 创建配件申请单（含正常流和问题流场景）...');

  const partsMap = new Map(parts.map((p) => [p.sku, p]));
  const inventoryMap = new Map(allInventory.map((i) => [i.partId, i]));

  const sapphire41 = partsMap.get('CRY-SAPH-41MM')!;
  const gasketSet = partsMap.get('GSK-SS-ROLEX')!;
  const backSeal = partsMap.get('GSK-BACK-SEAL')!;
  const battery = partsMap.get('BAT-SR626SW')!;
  const cleaning = partsMap.get('CLN-ULTRASONIC')!;
  const etaMvt = partsMap.get('MVT-ETA-2824')!;
  const watchOil = partsMap.get('REG-OIL-MOEBIUS')!;
  const sapphire40 = partsMap.get('CRY-SAPH-40MM')!;
  const rolexMvt = partsMap.get('MVT-ROLEX-3235')!;

  // === 场景 A: 完整正常流 - 已完成的申请（劳力士保养） ===
  const completedApp = await prisma.partApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      repairOrderId: completedOrder.id,
      title: '劳力士常规保养配件',
      description: '3年常规保养，需要更换密封件和表油',
      urgencyLevel: 'NORMAL',
      status: PartApplicationStatus.COMPLETED as string,
      createdBy: tech.id,
      approvedBy: manager.id,
      approvedAt: daysAgo(19),
      expectedPickupDate: daysAgo(18),
      actualPickupDate: daysAgo(18),
      createdAt: daysAgo(20),
    },
  });

  const completedItems = await Promise.all([
    prisma.partApplicationItem.create({
      data: {
        applicationId: completedApp.id,
        partId: backSeal.id,
        requestedQty: 1,
        approvedQty: 1,
        actualIssuedQty: 1,
        unitPrice: backSeal.unitPrice,
        remark: '底盖防水圈',
      },
    }),
    prisma.partApplicationItem.create({
      data: {
        applicationId: completedApp.id,
        partId: watchOil.id,
        requestedQty: 1,
        approvedQty: 1,
        actualIssuedQty: 1,
        unitPrice: watchOil.unitPrice,
        remark: '机芯润滑油',
      },
    }),
    prisma.partApplicationItem.create({
      data: {
        applicationId: completedApp.id,
        partId: cleaning.id,
        requestedQty: 1,
        approvedQty: 1,
        actualIssuedQty: 1,
        unitPrice: cleaning.unitPrice,
        remark: '超声波清洗',
      },
    }),
  ]);

  // === 场景 B: 审批通过，待取件（欧米茄换表镜） ===
  const approvedApp = await prisma.partApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      repairOrderId: inRepairOrder.id,
      title: '欧米茄更换表镜',
      description: '表镜碎裂，需要更换41mm蓝宝石表镜',
      urgencyLevel: 'URGENT',
      status: PartApplicationStatus.APPROVED as string,
      createdBy: tech.id,
      approvedBy: manager.id,
      approvedAt: daysAgo(6),
      expectedPickupDate: daysAgo(4),
      createdAt: daysAgo(7),
    },
  });

  const approvedItems = await prisma.partApplicationItem.create({
    data: {
      applicationId: approvedApp.id,
      partId: sapphire41.id,
      requestedQty: 1,
      approvedQty: 1,
      remark: '41mm蓝宝表镜，带防眩涂层',
    },
  });

  // 锁定库存
  const sapphireInv = inventoryMap.get(sapphire41.id)!;
  const lock1 = await prisma.inventoryLock.create({
    data: {
      lockNo: generateLockNo(),
      inventoryId: sapphireInv.id,
      quantity: 1,
      status: InventoryLockStatus.ACTIVE as string,
      reason: `配件申请审批: ${approvedApp.applicationNo}`,
      lockedBy: manager.id,
      applicationId: approvedApp.id,
      repairOrderId: inRepairOrder.id,
      expireAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
  });

  // === 场景 C: 待审批（PP机芯维修） - 售后经理登录后能看到 ===
  const pendingApp = await prisma.partApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      repairOrderId: awaitingPartsOrder.id,
      title: '百达翡丽机芯维修配件',
      description: '机芯故障，初步判断需要更换机芯总成。客户要求使用ETA替代方案',
      urgencyLevel: 'EMERGENCY',
      status: PartApplicationStatus.PENDING_APPROVAL as string,
      createdBy: tech.id,
      createdAt: daysAgo(8),
    },
  });

  const pendingItems = await Promise.all([
    prisma.partApplicationItem.create({
      data: {
        applicationId: pendingApp.id,
        partId: etaMvt.id,
        requestedQty: 1,
        remark: 'ETA 2824-2 机芯总成',
      },
    }),
    prisma.partApplicationItem.create({
      data: {
        applicationId: pendingApp.id,
        partId: gasketSet.id,
        requestedQty: 1,
        remark: '防水组件',
      },
    }),
  ]);

  // === 场景 D: 已驳回 - 问题流场景，需要补录 ===
  const rejectedApp = await prisma.partApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      repairOrderId: pendingQuoteOrder.id,
      title: '卡地亚进水维修配件',
      description: '手表进水需要清洗',
      urgencyLevel: 'URGENT',
      status: PartApplicationStatus.REJECTED as string,
      createdBy: tech.id,
      approvedBy: manager.id,
      approvedAt: daysAgo(1),
      rejectReason: '1. 配件清单不完整，缺少机芯烘干所需的干燥剂和专用清洗液\n2. 请补充具体故障检测说明和预计维修工时\n3. 请确认是否需要更换把的防水组件',
      createdAt: daysAgo(2),
    },
  });

  const rejectedItems = await Promise.all([
    prisma.partApplicationItem.create({
      data: {
        applicationId: rejectedApp.id,
        partId: cleaning.id,
        requestedQty: 2,
        remark: '清洗液',
      },
    }),
  ]);

  // === 场景 E: 草稿状态 - 接件顾问正在填写 ===
  const draftApp = await prisma.partApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      repairOrderId: quotationSentOrder.id,
      title: '泰格豪雅电池更换',
      description: '石英表更换电池',
      urgencyLevel: 'NORMAL',
      status: PartApplicationStatus.DRAFT as string,
      createdBy: reception.id,
      createdAt: daysAgo(1),
    },
  });

  const draftItems = await prisma.partApplicationItem.create({
    data: {
      applicationId: draftApp.id,
      partId: battery.id,
      requestedQty: 1,
      remark: 'SR626SW 纽扣电池',
    },
  });

  // === 场景 F: 部分批准 - 正常流中的复杂情况 ===
  const partialApp = await prisma.partApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      repairOrderId: completedOrder.id,
      title: '劳力士大修配件申请',
      description: '除了常规保养外，客户希望更换一个新的表冠',
      urgencyLevel: 'NORMAL',
      status: PartApplicationStatus.PARTIAL_APPROVED as string,
      createdBy: tech.id,
      approvedBy: manager.id,
      approvedAt: daysAgo(15),
      createdAt: daysAgo(16),
    },
  });

  const crownPart = partsMap.get('LCK-CROWN-ROLEX')!;
  const partialItems = await Promise.all([
    prisma.partApplicationItem.create({
      data: {
        applicationId: partialApp.id,
        partId: sapphire41.id,
        requestedQty: 1,
        approvedQty: 1,
        actualIssuedQty: 1,
        unitPrice: sapphire41.unitPrice,
        remark: '表镜抛光划伤',
      },
    }),
    prisma.partApplicationItem.create({
      data: {
        applicationId: partialApp.id,
        partId: crownPart.id,
        requestedQty: 1,
        approvedQty: 0,
        remark: '库存不足，需要订货',
      },
    }),
  ]);

  const applications = [completedApp, approvedApp, pendingApp, rejectedApp, draftApp, partialApp];

  // === 9. 创建申请单状态历史 ===
  console.log('  → 创建申请单状态历史...');

  const appStatusHistories = [
    { appId: completedApp.id, from: null, to: PartApplicationStatus.DRAFT as string, by: tech.id, reason: '创建申请单', date: daysAgo(20) },
    { appId: completedApp.id, from: PartApplicationStatus.DRAFT as string, to: PartApplicationStatus.PENDING_APPROVAL as string, by: tech.id, reason: '提交审批', date: daysAgo(20) },
    { appId: completedApp.id, from: PartApplicationStatus.PENDING_APPROVAL as string, to: PartApplicationStatus.APPROVED as string, by: manager.id, reason: '批准通过', date: daysAgo(19) },
    { appId: completedApp.id, from: PartApplicationStatus.APPROVED as string, to: PartApplicationStatus.PROCESSING as string, by: manager.id, reason: '配件发放中', date: daysAgo(18) },
    { appId: completedApp.id, from: PartApplicationStatus.PROCESSING as string, to: PartApplicationStatus.COMPLETED as string, by: tech.id, reason: '配件全部领取', date: daysAgo(18) },

    { appId: approvedApp.id, from: null, to: PartApplicationStatus.DRAFT as string, by: tech.id, reason: '创建申请单', date: daysAgo(7) },
    { appId: approvedApp.id, from: PartApplicationStatus.DRAFT as string, to: PartApplicationStatus.PENDING_APPROVAL as string, by: tech.id, reason: '提交审批，表镜碎裂紧急', date: daysAgo(7) },
    { appId: approvedApp.id, from: PartApplicationStatus.PENDING_APPROVAL as string, to: PartApplicationStatus.APPROVED as string, by: manager.id, reason: '紧急批准，已锁定库存', date: daysAgo(6) },

    { appId: pendingApp.id, from: null, to: PartApplicationStatus.DRAFT as string, by: tech.id, reason: '创建申请单', date: daysAgo(8) },
    { appId: pendingApp.id, from: PartApplicationStatus.DRAFT as string, to: PartApplicationStatus.PENDING_APPROVAL as string, by: tech.id, reason: 'VIP客户，加急处理', date: daysAgo(8) },

    { appId: rejectedApp.id, from: null, to: PartApplicationStatus.DRAFT as string, by: tech.id, reason: '创建申请单', date: daysAgo(2) },
    { appId: rejectedApp.id, from: PartApplicationStatus.DRAFT as string, to: PartApplicationStatus.PENDING_APPROVAL as string, by: tech.id, reason: '提交审批', date: daysAgo(2) },
    { appId: rejectedApp.id, from: PartApplicationStatus.PENDING_APPROVAL as string, to: PartApplicationStatus.REJECTED as string, by: manager.id, reason: '配件清单不完整，需要补录详细信息', date: daysAgo(1) },

    { appId: partialApp.id, from: null, to: PartApplicationStatus.DRAFT as string, by: tech.id, reason: '创建申请单', date: daysAgo(16) },
    { appId: partialApp.id, from: PartApplicationStatus.DRAFT as string, to: PartApplicationStatus.PENDING_APPROVAL as string, by: tech.id, reason: '提交审批', date: daysAgo(16) },
    { appId: partialApp.id, from: PartApplicationStatus.PENDING_APPROVAL as string, to: PartApplicationStatus.PARTIAL_APPROVED as string, by: manager.id, reason: '表镜批准，表冠库存不足待订货', date: daysAgo(15) },
  ];

  for (const h of appStatusHistories) {
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: h.appId,
        fromStatus: h.from,
        toStatus: h.to,
        changedBy: h.by,
        changeReason: h.reason,
        createdAt: h.date,
      },
    });
  }

  // === 10. 创建备注（覆盖驳回原因、补录说明、客户回复等类型） ===
  console.log('  → 创建备注数据...');

  const notes = [
    // 驳回原因 - 问题流关键点
    { type: NoteType.REJECT_REASON as string, content: '1. 配件清单不完整，缺少机芯烘干所需的干燥剂和专用清洗液\n2. 请补充具体故障检测说明和预计维修工时\n3. 请确认是否需要更换把的防水组件', appId: rejectedApp.id, by: manager.id, date: daysAgo(1) },
    
    // 客户回复
    { type: NoteType.CUSTOMER_REPLY as string, content: '陈先生来电确认保养费用，同意报价。另外询问是否可以免费更换表扣的弹簧', orderId: completedOrder.id, by: reception.id, date: daysAgo(24) },
    
    // 内部备注
    { type: NoteType.INTERNAL as string, content: 'VIP客户，优先处理。客户对时间要求较高，预计2周内完成', orderId: awaitingPartsOrder.id, by: manager.id, date: daysAgo(15) },
    
    // 跟进记录
    { type: NoteType.FOLLOWUP as string, content: '已通知刘女士取件，客户表示本周六下午到店', orderId: readyOrder.id, by: reception.id, date: daysAgo(0) },
    
    // 补录说明（可以在这里看到补录的位置）
    { type: NoteType.INTERNAL as string, content: '客户补充说明：手表是上周洗手时不小心进水的，目前已经完全停走。客户希望能尽快处理，下周需要出席重要活动', orderId: pendingQuoteOrder.id, by: reception.id, date: daysAgo(1) },
    
    // 申请单内部备注
    { type: NoteType.INTERNAL as string, content: '库存检查：41mm蓝宝石表镜还有15个，可以满足需求。建议加快处理，客户比较着急', appId: approvedApp.id, by: manager.id, date: daysAgo(6) },
    
    // 系统自动备注
    { type: NoteType.SYSTEM as string, content: '系统检测：库存锁定已生效，有效期至今日18:00，请及时领取', appId: approvedApp.id, by: admin.id, date: daysAgo(6) },
  ];

  for (const note of notes) {
    await prisma.note.create({
      data: {
        type: note.type,
        content: note.content,
        repairOrderId: note.orderId || null,
        applicationId: note.appId || null,
        createdBy: note.by,
        createdAt: note.date,
      },
    });
  }

  // === 11. 创建一些库存锁定的历史记录 ===
  console.log('  → 创建库存锁定记录...');

  const backSealInv = inventoryMap.get(backSeal.id)!;
  const watchOilInv = inventoryMap.get(watchOil.id)!;

  const historyLocks = [
    { invId: backSealInv.id, qty: 1, status: InventoryLockStatus.CONSUMED as string, reason: '保养用防水圈', appId: completedApp.id, orderId: completedOrder.id, by: manager.id, date: daysAgo(18) },
    { invId: watchOilInv.id, qty: 1, status: InventoryLockStatus.CONSUMED as string, reason: '保养用表油', appId: completedApp.id, orderId: completedOrder.id, by: manager.id, date: daysAgo(18) },
  ];

  for (const l of historyLocks) {
    await prisma.inventoryLock.create({
      data: {
        lockNo: generateLockNo(),
        inventoryId: l.invId,
        quantity: l.qty,
        status: l.status,
        reason: l.reason,
        lockedBy: l.by,
        applicationId: l.appId,
        repairOrderId: l.orderId,
        expireAt: new Date(),
        consumedAt: l.date,
        createdAt: l.date,
      },
    });

    // 同步扣减历史库存
    await prisma.inventory.update({
      where: { id: l.invId },
      data: {
        quantity: { decrement: l.qty },
      },
    });
  }

  // === 12. 创建一些操作日志 ===
  console.log('  → 创建操作日志记录...');

  const now = new Date();
  const operationLogs = [
    { traceId: 'TRACE-001', op: 'POST /api/v1/repair-orders', module: 'repair-orders', resType: 'repairOrder', resId: completedOrder.id, userId: reception.id, role: Role.RECEPTIONIST as string, success: true, duration: 150, date: daysAgo(30),
      reqBody: { customerId: customers[0].id, watchId: watches[0].id, problemDescription: '走时不准' },
      resBody: { code: 200, data: { id: completedOrder.id, orderNo: completedOrder.orderNo } } },
    { traceId: 'TRACE-001', op: 'POST /api/v1/repair-orders/:id/quotation', module: 'repair-orders', resType: 'repairOrder', resId: completedOrder.id, userId: manager.id, role: Role.SERVICE_MANAGER as string, success: true, duration: 80, date: daysAgo(25),
      reqBody: { estimatedCost: 3500, quotationNote: '常规保养' },
      resBody: { code: 200, data: { status: 'QUOTATION_SENT' } } },
    { traceId: 'TRACE-002', op: 'POST /api/v1/part-applications', module: 'part-applications', resType: 'partApplication', resId: rejectedApp.id, userId: tech.id, role: Role.TECHNICIAN as string, success: true, duration: 120, date: daysAgo(2),
      reqBody: { repairOrderId: pendingQuoteOrder.id, items: [{ partSku: 'GSK-BACK-SEAL', quantity: 2 }] },
      resBody: { code: 200, data: { id: rejectedApp.id, applicationNo: rejectedApp.applicationNo } } },
    { traceId: 'TRACE-002', op: 'POST /api/v1/part-applications/:id/submit', module: 'part-applications', resType: 'partApplication', resId: rejectedApp.id, userId: tech.id, role: Role.TECHNICIAN as string, success: true, duration: 60, date: daysAgo(2),
      reqBody: {},
      resBody: { code: 200, data: { status: 'PENDING_APPROVAL' } } },
    { traceId: 'TRACE-003', op: 'POST /api/v1/part-applications/:id/reject', module: 'part-applications', resType: 'partApplication', resId: rejectedApp.id, userId: manager.id, role: Role.SERVICE_MANAGER as string, success: true, duration: 95, date: daysAgo(1),
      reqBody: { rejectReason: '配件清单不完整，需要补录详细信息' },
      resBody: { code: 200, data: { status: 'REJECTED' } } },
    { traceId: 'TRACE-004', op: 'POST /api/v1/inventory-locks', module: 'inventory', resType: 'inventoryLock', resId: lock1.id, userId: manager.id, role: Role.SERVICE_MANAGER as string, success: true, duration: 75, date: daysAgo(6),
      reqBody: { inventoryId: sapphireInv.id, quantity: 1, reason: '配件申请锁定' },
      resBody: { code: 200, data: { lockNo: lock1.lockNo, status: 'ACTIVE' } } },
    { traceId: 'TRACE-005', op: 'POST /api/v1/repair-orders/:id/confirm-quotation', module: 'repair-orders', resType: 'repairOrder', resId: completedOrder.id, userId: reception.id, role: Role.RECEPTIONIST as string, success: true, duration: 65, date: daysAgo(24),
      reqBody: { customerConfirmed: true },
      resBody: { code: 200, data: { status: 'CONFIRMED' } } },
    { traceId: 'TRACE-006', op: 'POST /api/v1/auth/login', module: 'auth', userId: tech.id, role: Role.TECHNICIAN as string, success: true, duration: 45, date: daysAgo(0),
      reqBody: { username: 'tech' },
      resBody: { code: 200, data: { token: '***' } } },
    { traceId: 'TRACE-007', op: 'POST /api/v1/auth/login', module: 'auth', success: false, error: '密码错误', duration: 35, date: daysAgo(0),
      reqBody: { username: 'tech' },
      resBody: { code: 401, message: '用户名或密码错误' } },
    { traceId: 'TRACE-008', op: 'GET /api/v1/part-applications/pending-approvals', module: 'part-applications', userId: manager.id, role: Role.SERVICE_MANAGER as string, success: true, duration: 25, date: daysAgo(0),
      reqBody: null,
      resBody: { code: 200, data: { total: 2, items: [] } } },
  ];

  for (const log of operationLogs) {
    await prisma.operationLog.create({
      data: {
        traceId: log.traceId,
        operation: log.op,
        module: log.module,
        resourceType: log.resType || null,
        resourceId: log.resId || null,
        userId: log.userId || admin.id,
        userRole: log.role || Role.ADMIN as string,
        isSuccess: log.success,
        errorMessage: log.error || null,
        durationMs: log.duration,
        requestBody: serializeJson(log.reqBody),
        responseBody: serializeJson(log.resBody),
        createdAt: log.date,
      },
    });
  }

  // === 13. 更新库存中的reservedQty以反映实际锁定 ===
  await prisma.inventory.update({
    where: { id: sapphireInv.id },
    data: { reservedQty: { increment: 1 } },
  });

  console.log('\n✅ 样例数据填充完成！');
  console.log(`\n📊 数据概览：`);
  console.log(`   👤 用户: 4个 (4种角色)`);
  console.log(`   👥 客户: ${customers.length}个`);
  console.log(`   ⌚ 手表: ${watches.length}个`);
  console.log(`   🔧 配件: ${parts.length}个`);
  console.log(`   📦 库存记录: ${allInventory.length}条`);
  console.log(`   📋 寄修单: ${repairOrders.length}个 (覆盖7种状态)`);
  console.log(`   📝 配件申请: ${applications.length}个 (覆盖6种状态，含2种问题流)`);
  console.log(`   🔒 库存锁定: 3条 (1个活跃，2个已消耗)`);
  console.log(`   📓 备注: ${notes.length}条 (覆盖6种类型)`);
  console.log(`   📜 操作日志: ${operationLogs.length}条 (含正常和异常场景)`);

  console.log(`\n🎯 关键场景说明：`);
  console.log(`   ✅ 【正常流-已完成】劳力士保养单 - 从创建到结案的完整链路`);
  console.log(`   ✅ 【正常流-进行中】欧米茄换表镜 - 已批准，库存已锁定，待取件`);
  console.log(`   ✅ 【正常流-部分批准】 表镜批准，表冠待订货`);
  console.log(`   ⚠️  【问题流-待审批】百达翡丽维修 - 紧急，待售后经理审批`);
  console.log(`   ⚠️  【问题流-已驳回】卡地亚进水维修 - 配件清单不全，已驳回，需补录`);
  console.log(`   ✅ 【正常流-草稿】泰格豪雅换电池 - 接件顾问正在填写`);
  console.log(`   ⚠️  【问题流-客户拒绝】欧米茄维修报价 - 客户认为费用过高已拒绝`);
  console.log(`   ✅ 【正常流-待取件】劳力士保养完成 - 已通知客户`);
  console.log(`   ✅ 【正常流-待报价】卡地亚进水 - 新接件，待报价`);
  console.log(`   ✅ 【正常流-已报价】泰格豪雅换电池 - 已报价，待客户确认`);
  console.log(`   ✅ 【异常流-登录失败】演示错误日志和回查`);
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
