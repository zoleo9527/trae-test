import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始生成演示数据...');

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('👤 创建用户账户...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        passwordHash,
        name: '张经理',
        role: 'AGENT_MANAGER',
        email: 'manager@shipping.com',
        phone: '13800138001',
        department: '船舶代理部',
      },
    }),
    prisma.user.upsert({
      where: { username: 'coordinator' },
      update: {},
      create: {
        username: 'coordinator',
        passwordHash,
        name: '李协调',
        role: 'FIELD_COORDINATOR',
        email: 'coordinator@shipping.com',
        phone: '13800138002',
        department: '现场协调部',
      },
    }),
    prisma.user.upsert({
      where: { username: 'specialist' },
      update: {},
      create: {
        username: 'specialist',
        passwordHash,
        name: '王专员',
        role: 'DOCUMENT_SPECIALIST',
        email: 'specialist@shipping.com',
        phone: '13800138003',
        department: '单证部',
      },
    }),
    prisma.user.upsert({
      where: { username: 'finance' },
      update: {},
      create: {
        username: 'finance',
        passwordHash,
        name: '赵财务',
        role: 'FINANCE_OFFICER',
        email: 'finance@shipping.com',
        phone: '13800138004',
        department: '财务部',
      },
    }),
  ]);

  const [manager, coordinator, specialist, finance] = users;
  console.log(`   ✅ 创建了 ${users.length} 个测试用户`);

  console.log('🏭 创建港口和码头数据...');
  const ports = await Promise.all([
    prisma.port.upsert({
      where: { code: 'SH' },
      update: {},
      create: {
        code: 'SH',
        name: '上海港',
        country: '中国',
        terminals: {
          create: [
            { code: 'S1', name: '上海一号码头' },
            { code: 'S2', name: '上海二号码头' },
            { code: 'S3', name: '洋山深水港' },
          ],
        },
      },
    }),
    prisma.port.upsert({
      where: { code: 'SZ' },
      update: {},
      create: {
        code: 'SZ',
        name: '深圳港',
        country: '中国',
        terminals: {
          create: [
            { code: 'Y1', name: '盐田国际码头' },
            { code: 'SHE', name: '蛇口集装箱码头' },
          ],
        },
      },
    }),
    prisma.port.upsert({
      where: { code: 'NB' },
      update: {},
      create: {
        code: 'NB',
        name: '宁波舟山港',
        country: '中国',
        terminals: {
          create: [
            { code: 'NB1', name: '北仑港区' },
          ],
        },
      },
    }),
    prisma.port.upsert({
      where: { code: 'QD' },
      update: {},
      create: {
        code: 'QD',
        name: '青岛港',
        country: '中国',
        terminals: {
          create: [
            { code: 'QD1', name: '前湾集装箱码头' },
          ],
        },
      },
    }),
  ]);

  const shanghaiPort = ports[0];
  const terminals = await prisma.terminal.findMany({
    where: { portId: shanghaiPort.id },
  });
  console.log(`   ✅ 创建了 ${ports.length} 个港口`);

  console.log('⛴️  创建船舶数据...');
  const vessels = await Promise.all([
    prisma.vessel.upsert({
      where: { imoNumber: 'IMO9700001' },
      update: {},
      create: {
        name: '远洋之星号',
        imoNumber: 'IMO9700001',
        flag: '巴拿马',
        grossTonnage: 50000,
        length: 250,
        owner: '中远海运',
        operator: '中远海运',
      },
    }),
    prisma.vessel.upsert({
      where: { imoNumber: 'IMO9700002' },
      update: {},
      create: {
        name: '太平洋航线号',
        imoNumber: 'IMO9700002',
        flag: '新加坡',
        grossTonnage: 35000,
        length: 200,
        owner: '马士基航运',
        operator: '马士基航运',
      },
    }),
    prisma.vessel.upsert({
      where: { imoNumber: 'IMO9700003' },
      update: {},
      create: {
        name: '东方明珠号',
        imoNumber: 'IMO9700003',
        flag: '中国香港',
        grossTonnage: 75000,
        length: 320,
        owner: '东方海外',
        operator: '东方海外',
      },
    }),
    prisma.vessel.upsert({
      where: { imoNumber: 'IMO9700004' },
      update: {},
      create: {
        name: '南海明珠号',
        imoNumber: 'IMO9700004',
        flag: '利比里亚',
        grossTonnage: 42000,
        length: 220,
        owner: '中海集团',
        operator: '中海集团',
      },
    }),
  ]);
  console.log(`   ✅ 创建了 ${vessels.length} 艘船舶`);

  console.log('🏪 创建供应商数据...');
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { name: '上海港务局服务公司' },
      update: {},
      create: {
        name: '上海港务局服务公司',
        type: '港口服务',
        contact: '陈经理',
        phone: '021-55550001',
        email: 'service@portsh.com',
        address: '上海市浦东新区港航路1号',
        creditTerms: 30,
      },
    }),
    prisma.supplier.upsert({
      where: { name: '远东船舶补给有限公司' },
      update: {},
      create: {
        name: '远东船舶补给有限公司',
        type: '物资供应',
        contact: '刘总',
        phone: '021-55550002',
        email: 'supply@fars-east.com',
        address: '上海市宝山区长江路88号',
        creditTerms: 45,
      },
    }),
    prisma.supplier.upsert({
      where: { name: '环球拖轮服务公司' },
      update: {},
      create: {
        name: '环球拖轮服务公司',
        type: '拖轮服务',
        contact: '王队长',
        phone: '021-55550003',
        email: 'tug@globaltug.com',
        address: '上海市虹口区公平路100号',
        creditTerms: 15,
      },
    }),
  ]);
  console.log(`   ✅ 创建了 ${suppliers.length} 个供应商`);

  console.log('📋 创建靠泊计划（包含异常场景）...');
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const berthingPlans = [];

  const plan1ChainId = uuidv4();
  const plan1 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000001`,
      vesselId: vessels[0].id,
      portId: shanghaiPort.id,
      terminalId: terminals[0].id,
      eta: tomorrow,
      etd: nextWeek,
      status: 'DRAFT',
      purpose: '卸货',
      cargoType: '集装箱',
      cargoQuantity: 2500,
      crewCount: 22,
      remarks: '待提交审批',
      priority: 5,
      chainId: plan1ChainId,
      chainVersion: 1,
      isLatestVersion: true,
      createdById: coordinator.id,
    },
  });
  berthingPlans.push(plan1);

  const plan2ChainId = uuidv4();
  const plan2 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000002`,
      vesselId: vessels[1].id,
      portId: shanghaiPort.id,
      terminalId: terminals[1].id,
      eta: tomorrow,
      etd: nextWeek,
      status: 'SUBMITTED',
      purpose: '装卸货',
      cargoType: '散货',
      cargoQuantity: 15000,
      crewCount: 18,
      remarks: '等待经理审批',
      priority: 3,
      chainId: plan2ChainId,
      chainVersion: 1,
      isLatestVersion: true,
      createdById: coordinator.id,
    },
  });
  berthingPlans.push(plan2);

  const plan3ChainId = uuidv4();
  const plan3 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000003`,
      vesselId: vessels[2].id,
      portId: shanghaiPort.id,
      terminalId: terminals[2].id,
      eta: yesterday,
      etd: nextWeek,
      status: 'IN_PROGRESS',
      purpose: '补给和维修',
      cargoType: '杂货',
      cargoQuantity: 500,
      crewCount: 25,
      remarks: '正在靠泊作业中 - 有任务阻塞',
      priority: 1,
      chainId: plan3ChainId,
      chainVersion: 1,
      isLatestVersion: true,
      createdById: coordinator.id,
    },
  });
  berthingPlans.push(plan3);

  const plan4ChainId = uuidv4();
  const plan4 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000004`,
      vesselId: vessels[3].id,
      portId: shanghaiPort.id,
      terminalId: terminals[0].id,
      eta: lastWeek,
      etd: yesterday,
      status: 'COMPLETED',
      purpose: '卸货',
      cargoType: '集装箱',
      cargoQuantity: 3200,
      crewCount: 20,
      remarks: '已完成 - 有费用待支付',
      priority: 5,
      chainId: plan4ChainId,
      chainVersion: 1,
      isLatestVersion: true,
      createdById: coordinator.id,
    },
  });
  berthingPlans.push(plan4);

  const plan5ChainId = uuidv4();
  const plan5v1 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000005`,
      vesselId: vessels[0].id,
      portId: shanghaiPort.id,
      terminalId: terminals[1].id,
      eta: nextWeek,
      etd: nextMonth,
      status: 'APPROVED',
      purpose: '装卸货',
      cargoType: '集装箱',
      cargoQuantity: 4000,
      crewCount: 22,
      remarks: '版本1 - 原始计划',
      priority: 4,
      chainId: plan5ChainId,
      chainVersion: 1,
      isLatestVersion: false,
      createdById: coordinator.id,
    },
  });

  const plan5v2 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000005`,
      vesselId: vessels[0].id,
      portId: shanghaiPort.id,
      terminalId: terminals[2].id,
      eta: nextWeek,
      etd: nextMonth,
      status: 'APPROVED',
      purpose: '装卸货',
      cargoType: '集装箱',
      cargoQuantity: 4500,
      crewCount: 24,
      remarks: '版本2 - 更新了货物数量和码头',
      priority: 3,
      chainId: plan5ChainId,
      chainVersion: 2,
      isLatestVersion: true,
      parentId: plan5v1.id,
      createdById: coordinator.id,
    },
  });
  berthingPlans.push(plan5v2);

  const plan6ChainId = uuidv4();
  const plan6 = await prisma.berthingPlan.create({
    data: {
      planNumber: `BP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}-000006`,
      vesselId: vessels[1].id,
      portId: shanghaiPort.id,
      terminalId: terminals[0].id,
      eta: nextWeek,
      etd: nextMonth,
      status: 'REJECTED',
      purpose: '卸货',
      cargoType: '危险品',
      cargoQuantity: 800,
      crewCount: 18,
      remarks: '审批被拒 - 危险品作业需额外资质',
      priority: 2,
      chainId: plan6ChainId,
      chainVersion: 1,
      isLatestVersion: true,
      createdById: coordinator.id,
    },
  });
  berthingPlans.push(plan6);

  console.log(`   ✅ 创建了 ${berthingPlans.length + 1} 个靠泊计划（含版本链演示）`);

  console.log('📄 创建证件（含过期预警场景）...');
  const documents = [];

  const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const expiredDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  documents.push(await prisma.document.create({
    data: {
      berthingPlanId: plan2.id,
      type: 'CREW_MANIFEST',
      title: '船员名单',
      referenceNo: 'CM-2024-001',
      status: 'SUBMITTED',
      issuedBy: '船舶管理公司',
      issuedDate: lastWeek,
      deadline: tomorrow,
      chainId: uuidv4(),
      chainVersion: 1,
      isLatestVersion: true,
      createdById: specialist.id,
    },
  }));

  documents.push(await prisma.document.create({
    data: {
      berthingPlanId: plan3.id,
      type: 'SAFETY_CERTIFICATE',
      title: '船舶安全证书',
      referenceNo: 'SC-2024-001',
      status: 'IN_PROGRESS',
      issuedBy: '船级社',
      issuedDate: lastWeek,
      expiryDate: dayAfterTomorrow,
      deadline: tomorrow,
      remarks: '即将过期！需要紧急更新',
      chainId: uuidv4(),
      chainVersion: 1,
      isLatestVersion: true,
      createdById: specialist.id,
    },
  }));

  documents.push(await prisma.document.create({
    data: {
      berthingPlanId: plan4.id,
      type: 'PORT_CLEARANCE',
      title: '港口结关单',
      referenceNo: 'PC-2024-001',
      status: 'EXPIRED',
      issuedBy: '上海港务局',
      issuedDate: lastWeek,
      expiryDate: expiredDate,
      submittedDate: threeDaysAgo,
      approvedDate: threeDaysAgo,
      chainId: uuidv4(),
      chainVersion: 1,
      isLatestVersion: true,
      createdById: specialist.id,
    },
  }));

  documents.push(await prisma.document.create({
    data: {
      berthingPlanId: plan3.id,
      type: 'CUSTOMS_DECLARATION',
      title: '海关申报单',
      referenceNo: 'CD-2024-001',
      status: 'REJECTED',
      issuedBy: '船舶代理',
      issuedDate: yesterday,
      submittedDate: yesterday,
      rejectedReason: '货物描述不完整，缺少HS编码',
      deadline: fiveDaysLater,
      remarks: '被海关退回，需要重新提交',
      chainId: uuidv4(),
      chainVersion: 1,
      isLatestVersion: true,
      createdById: specialist.id,
    },
  }));

  documents.push(await prisma.document.create({
    data: {
      berthingPlanId: plan5v2.id,
      type: 'CARGO_MANIFEST',
      title: '货物舱单',
      referenceNo: 'CM-2024-002',
      status: 'APPROVED',
      issuedBy: '船长',
      issuedDate: lastWeek,
      submittedDate: yesterday,
      approvedDate: yesterday,
      chainId: uuidv4(),
      chainVersion: 1,
      isLatestVersion: true,
      createdById: specialist.id,
    },
  }));

  console.log(`   ✅ 创建了 ${documents.length} 个证件（含过期、被拒等异常）`);

  console.log('📋 创建任务链...');
  const taskChain1Id = uuidv4();
  await Promise.all([
    prisma.task.create({
      data: {
        type: 'BERTHING_PLAN',
        title: '提交靠泊申请',
        description: '完成靠泊计划信息填写并提交审批',
        berthingPlanId: plan3.id,
        status: 'COMPLETED',
        priority: 1,
        deadline: yesterday,
        completedDate: yesterday,
        chainId: taskChain1Id,
        chainSequence: 1,
        isBlocking: true,
        createdById: manager.id,
        assignedToId: coordinator.id,
      },
    }),
    prisma.task.create({
      data: {
        type: 'DOCUMENT_PREPARE',
        title: '准备船员名单',
        description: '准备并提交船员名单',
        berthingPlanId: plan3.id,
        status: 'COMPLETED',
        priority: 2,
        deadline: yesterday,
        completedDate: yesterday,
        chainId: taskChain1Id,
        chainSequence: 2,
        isBlocking: true,
        createdById: manager.id,
        assignedToId: specialist.id,
      },
    }),
    prisma.task.create({
      data: {
        type: 'DOCUMENT_PREPARE',
        title: '准备货物申报',
        description: '准备并提交货物申报单',
        berthingPlanId: plan3.id,
        status: 'BLOCKED',
        priority: 2,
        deadline: tomorrow,
        blockedReason: '供应商材料未到，无法继续',
        chainId: taskChain1Id,
        chainSequence: 3,
        isBlocking: true,
        createdById: manager.id,
        assignedToId: specialist.id,
      },
    }),
    prisma.task.create({
      data: {
        type: 'DOCUMENT_SUBMIT',
        title: '提交港口清关文件',
        description: '向港务局提交所有清关文件',
        berthingPlanId: plan3.id,
        status: 'PENDING',
        priority: 3,
        deadline: nextWeek,
        chainId: taskChain1Id,
        chainSequence: 4,
        isBlocking: false,
        createdById: manager.id,
        assignedToId: specialist.id,
      },
    }),
    prisma.task.create({
      data: {
        type: 'FEE_SETTLE',
        title: '结算费用',
        description: '确认并结算所有港口相关费用',
        berthingPlanId: plan3.id,
        status: 'PENDING',
        priority: 2,
        deadline: nextWeek,
        chainId: taskChain1Id,
        chainSequence: 5,
        isBlocking: true,
        createdById: manager.id,
        assignedToId: finance.id,
      },
    }),
  ]);
  console.log(`   ✅ 创建了 1 条任务链（含阻塞任务演示）`);

  console.log('💰 创建费用（含未支付异常）...');
  const fees = [];

  fees.push(await prisma.fee.create({
    data: {
      berthingPlanId: plan4.id,
      category: '港口使费',
      description: '上海港洋山港靠泊费',
      amount: 85000,
      currency: 'CNY',
      supplierId: suppliers[0].id,
      invoiceNo: 'INV-SH-2024-0088',
      isPaid: false,
      dueDate: lastWeek,
      remarks: '逾期未付 - 已产生滞纳金',
      createdById: finance.id,
    },
  }));

  fees.push(await prisma.fee.create({
    data: {
      berthingPlanId: plan4.id,
      category: '拖轮费',
      description: '进港拖轮服务（2艘）',
      amount: 18000,
      currency: 'CNY',
      supplierId: suppliers[2].id,
      invoiceNo: 'INV-TUG-2024-0056',
      isPaid: true,
      paidDate: yesterday,
      dueDate: tomorrow,
      createdById: finance.id,
    },
  }));

  fees.push(await prisma.fee.create({
    data: {
      berthingPlanId: plan3.id,
      category: '物资供应',
      description: '船舶淡水和食品补给',
      amount: 25000,
      currency: 'CNY',
      supplierId: suppliers[1].id,
      isPaid: false,
      dueDate: nextWeek,
      remarks: '待结算',
      createdById: finance.id,
    },
  }));

  fees.push(await prisma.fee.create({
    data: {
      berthingPlanId: plan3.id,
      category: '代理费',
      description: '船舶代理服务费',
      amount: 12000,
      currency: 'CNY',
      isPaid: false,
      dueDate: nextWeek,
      createdById: finance.id,
    },
  }));

  console.log(`   ✅ 创建了 ${fees.length} 笔费用（含逾期未付）`);

  console.log('📞 创建沟通记录...');
  const communications = [];

  communications.push(await prisma.communication.create({
    data: {
      berthingPlanId: plan3.id,
      type: 'EMAIL',
      direction: 'INBOUND',
      subject: '关于安全证书过期事宜',
      content: '尊敬的代理，我方船舶的安全证书将于3天后过期，请协助办理更新手续。紧急！',
      senderName: '远洋之星号 船长',
      senderContact: 'captain@star-ocean.com',
      recipientName: '王专员',
      recipientContact: 'specialist@shipping.com',
      createdAt: yesterday,
    },
  }));

  communications.push(await prisma.communication.create({
    data: {
      berthingPlanId: plan3.id,
      type: 'PHONE',
      direction: 'OUTBOUND',
      subject: '电话确认补给时间',
      content: '与远东补给确认，由于库存问题，补给物资将延迟2天送达',
      senderName: '李协调',
      senderContact: '13800138002',
      recipientName: '远东补给 刘总',
      recipientContact: '021-55550002',
      supplierId: suppliers[1].id,
      createdAt: today,
    },
  }));

  communications.push(await prisma.communication.create({
    data: {
      berthingPlanId: plan4.id,
      type: 'EMAIL',
      direction: 'OUTBOUND',
      subject: '催缴港口使费',
      content: '贵司应付港口使费85,000元已逾期，请尽快安排付款，否则将产生额外滞纳金。',
      senderName: '赵财务',
      senderContact: 'finance@shipping.com',
      recipientName: '中海集团财务部',
      recipientContact: 'finance@cnshipping.com',
      createdAt: threeDaysAgo,
    },
  }));

  console.log(`   ✅ 创建了 ${communications.length} 条沟通记录`);

  console.log('');
  console.log('✅ 演示数据生成完成！');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  测试账号:');
  console.log('');
  console.log('  🔑 代理经理:');
  console.log('     用户名: manager');
  console.log('     密码: password123');
  console.log('');
  console.log('  🚢 现场协调:');
  console.log('     用户名: coordinator');
  console.log('     密码: password123');
  console.log('');
  console.log('  📄 单证专员:');
  console.log('     用户名: specialist');
  console.log('     密码: password123');
  console.log('');
  console.log('  💰 财务人员:');
  console.log('     用户名: finance');
  console.log('     密码: password123');
  console.log('');
  console.log('  ⚠️  异常场景演示数据:');
  console.log('     - 证件即将过期（3天后过期）');
  console.log('     - 证件被拒绝（缺少HS编码）');
  console.log('     - 任务阻塞（供应商材料未到）');
  console.log('     - 费用逾期未付（已产生滞纳金）');
  console.log('     - 计划版本变更（靠泊计划v2）');
  console.log('     - 审批被拒（危险品资质问题）');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ 数据生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
