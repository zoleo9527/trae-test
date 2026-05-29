import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const ROLE = {
  BASE_MANAGER: 'BASE_MANAGER',
  MAINTENANCE_WORKER: 'MAINTENANCE_WORKER',
  SALES_COORDINATOR: 'SALES_COORDINATOR',
};

const HARVEST_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

const MAINTENANCE_TYPE = {
  WATERING: 'WATERING',
  FERTILIZING: 'FERTILIZING',
  PEST_CONTROL: 'PEST_CONTROL',
  PRUNING: 'PRUNING',
  DISEASE_TREATMENT: 'DISEASE_TREATMENT',
  OTHER: 'OTHER',
};

const DISEASE_SEVERITY = {
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
  CRITICAL: 'CRITICAL',
};

const VISIT_RESULT = {
  SATISFIED: 'SATISFIED',
  PARTIALLY_SATISFIED: 'PARTIALLY_SATISFIED',
  DISSATISFIED: 'DISSATISFIED',
  NEEDS_FOLLOWUP: 'NEEDS_FOLLOWUP',
};

const NEGOTIATION_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  MANAGER_REVIEW: 'MANAGER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REWORK_REQUIRED: 'REWORK_REQUIRED',
  IMPLEMENTING: 'IMPLEMENTING',
  COMPLETED: 'COMPLETED',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
};

async function main() {
  console.log('🌱 开始初始化数据...');

  const hashPassword = async (password: string) => bcrypt.hash(password, 10);

  const [managerPassword, workerPassword, salesPassword] = await Promise.all([
    hashPassword('manager123'),
    hashPassword('worker123'),
    hashPassword('sales123'),
  ]);

  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      name: '张经理',
      passwordHash: managerPassword,
      role: ROLE.BASE_MANAGER,
      phone: '13800138001',
    },
  });
  console.log(`✅ 创建基地负责人: ${manager.name} (manager / manager123)`);

  const worker = await prisma.user.upsert({
    where: { username: 'worker' },
    update: {},
    create: {
      username: 'worker',
      name: '李养护',
      passwordHash: workerPassword,
      role: ROLE.MAINTENANCE_WORKER,
      phone: '13800138002',
    },
  });
  console.log(`✅ 创建养护员: ${worker.name} (worker / worker123)`);

  const sales = await prisma.user.upsert({
    where: { username: 'sales' },
    update: {},
    create: {
      username: 'sales',
      name: '王销售',
      passwordHash: salesPassword,
      role: ROLE.SALES_COORDINATOR,
      phone: '13800138003',
    },
  });
  console.log(`✅ 创建销售跟单: ${sales.name} (sales / sales123)`);

  const plots = [];
  for (let i = 1; i <= 5; i++) {
    const plot = await prisma.plot.create({
      data: {
        plotNo: `P-${String(i).padStart(3, '0')}`,
        location: `东区${i}号地`,
        area: 5 + i * 0.5,
        soilType: i % 2 === 0 ? '沙壤土' : '粘壤土',
        description: `第${i}号种植地块，主要种植${i % 2 === 0 ? '香樟' : '桂花'}`,
      },
    });
    plots.push(plot);
    console.log(`✅ 创建地块: ${plot.plotNo} - ${plot.location}`);
  }

  const speciesList = ['香樟', '桂花', '广玉兰', '银杏', '紫薇'];
  for (let i = 0; i < 10; i++) {
    const batch = await prisma.seedlingBatch.create({
      data: {
        plotId: plots[i % plots.length].id,
        species: speciesList[i % speciesList.length],
        quantity: 100 + i * 50,
        plantingDate: new Date(2024, i % 12, 1),
        expectedSize: `胸径 ${5 + (i % 5)}cm`,
        status: 'GROWING',
      },
    });
    console.log(`✅ 创建苗木批次: ${batch.species} ${batch.quantity}株 - 地块${plots[i % plots.length].plotNo}`);
  }

  const harvests = [];
  for (let i = 0; i < 5; i++) {
    const harvest = await prisma.harvestRecord.create({
      data: {
        idempotencyKey: uuidv4(),
        plotId: plots[i % plots.length].id,
        creatorId: manager.id,
        assigneeId: worker.id,
        scheduledDate: new Date(2025, 4, 10 + i),
        targetQuantity: 50 + i * 10,
        actualQuantity: i < 3 ? 50 + i * 10 : null,
        actualDate: i < 3 ? new Date(2025, 4, 10 + i) : null,
        qualityGrade: i < 3 ? ['A', 'B', 'A'][i] : null,
        status: i < 3 ? HARVEST_STATUS.COMPLETED : i === 3 ? HARVEST_STATUS.IN_PROGRESS : HARVEST_STATUS.PENDING,
        notes: `第${i + 1}批起苗任务`,
      },
    });
    harvests.push(harvest);
    console.log(`✅ 创建起苗记录: ${harvest.targetQuantity}株 - 状态: ${harvest.status}`);
  }

  const customers = ['绿源园林', '青山绿化', '城市景观', '绿洲苗木', '锦绣园艺'];
  for (let i = 0; i < 6; i++) {
    if (i < harvests.length && harvests[i].status === HARVEST_STATUS.COMPLETED) {
      const loading = await prisma.loadingRecord.create({
        data: {
          idempotencyKey: uuidv4(),
          harvestId: harvests[i].id,
          loadingDate: new Date(2025, 4, 11 + i),
          vehicleNo: `京A${String(10000 + i * 111)}`,
          driverName: `司机${i + 1}`,
          quantity: 50 + i * 10 - (i % 2 === 0 ? 0 : 5),
          checkedBy: manager.name,
          customerName: customers[i % customers.length],
          orderNo: `ORD-${String(20250500 + i)}`,
          discrepancyNote: i % 2 === 1 ? `实际装车比计划少5株，客户已确认` : null,
        },
      });
      console.log(`✅ 创建装车记录: ${loading.customerName} - ${loading.quantity}株`);
    }
  }

  const maintenanceTypes = [MAINTENANCE_TYPE.WATERING, MAINTENANCE_TYPE.FERTILIZING, MAINTENANCE_TYPE.PEST_CONTROL, MAINTENANCE_TYPE.PRUNING];
  for (let i = 0; i < 8; i++) {
    await prisma.maintenanceRecord.create({
      data: {
        idempotencyKey: uuidv4(),
        plotId: plots[i % plots.length].id,
        workerId: worker.id,
        maintenanceDate: new Date(2025, 4, 1 + i),
        type: maintenanceTypes[i % maintenanceTypes.length],
        durationMinutes: 60 + i * 15,
        weather: ['晴', '多云', '阴', '小雨'][i % 4],
        dosage: i % 2 === 0 ? `复合肥 ${2 + i}kg` : null,
        notes: `日常${maintenanceTypes[i % maintenanceTypes.length]}作业`,
        needsReview: i === 3,
        reviewNote: i === 3 ? '养护记录合格，继续保持' : null,
        reviewedById: i === 3 ? manager.id : null,
        reviewedAt: i === 3 ? new Date(2025, 4, 5) : null,
      },
    });
    console.log(`✅ 创建养护记录: ${maintenanceTypes[i % maintenanceTypes.length]} - ${60 + i * 15}分钟`);
  }

  const diseases = [
    { symptoms: '叶片出现黄褐色斑点，边缘干枯', severity: DISEASE_SEVERITY.MODERATE },
    { symptoms: '树干有虫洞，伴随木屑排出', severity: DISEASE_SEVERITY.SEVERE },
    { symptoms: '部分植株叶片发黄脱落', severity: DISEASE_SEVERITY.MILD },
    { symptoms: '根部腐烂，整株萎蔫', severity: DISEASE_SEVERITY.CRITICAL },
  ];
  for (let i = 0; i < 4; i++) {
    await prisma.diseaseReport.create({
      data: {
        idempotencyKey: uuidv4(),
        plotId: plots[i % plots.length].id,
        reporterId: worker.id,
        discoveredDate: new Date(2025, 4, 5 + i),
        symptoms: diseases[i].symptoms,
        severity: diseases[i].severity,
        affectedArea: 2 + i * 0.5,
        suspectedCause: i % 2 === 0 ? '真菌感染' : '虫害',
        initialAction: '已初步喷洒杀菌剂，需进一步观察',
        isResolved: i > 1,
        resolutionNote: i > 1 ? '经过连续3天喷药，病害已得到控制' : null,
        resolvedAt: i > 1 ? new Date(2025, 4, 10 + i) : null,
        followUpDate: new Date(2025, 4, 15 + i),
      },
    });
    console.log(`✅ 创建病害上报: ${diseases[i].severity} - ${diseases[i].symptoms.substring(0, 15)}...`);
  }

  const visitResults = [VISIT_RESULT.SATISFIED, VISIT_RESULT.PARTIALLY_SATISFIED, VISIT_RESULT.DISSATISFIED, VISIT_RESULT.NEEDS_FOLLOWUP];
  const loadings = await prisma.loadingRecord.findMany();
  const visits = [];
  for (let i = 0; i < 6; i++) {
    const hasComplaint = i >= 2;
    const visit = await prisma.customerVisit.create({
      data: {
        idempotencyKey: uuidv4(),
        loadingId: i < loadings.length ? loadings[i].id : null,
        salesId: sales.id,
        customerName: customers[i % customers.length],
        customerPhone: `1390013900${i + 1}`,
        visitDate: new Date(2025, 4, 15 + i),
        visitType: i % 2 === 0 ? '电话回访' : '现场回访',
        result: visitResults[i % visitResults.length],
        feedback: hasComplaint
          ? '客户反映部分苗木在运输途中受损，叶片干枯严重'
          : '客户对苗木质量和服务表示满意',
        hasComplaint,
        complaintDetail: hasComplaint ? `客户索赔：要求补苗${10 + i * 5}株` : null,
        followUpDate: hasComplaint ? new Date(2025, 4, 20 + i) : null,
        isFollowedUp: i >= 4,
        followUpNote: i >= 4 ? '已与客户沟通，正在处理补苗事宜' : null,
      },
    });
    visits.push(visit);
    console.log(`✅ 创建回访记录: ${visit.customerName} - ${visit.result}${hasComplaint ? ' (有投诉)' : ''}`);
  }

  const negotiations = [];
  for (let i = 0; i < 4; i++) {
    const statuses = [
      NEGOTIATION_STATUS.DRAFT,
      NEGOTIATION_STATUS.MANAGER_REVIEW,
      NEGOTIATION_STATUS.APPROVED,
      NEGOTIATION_STATUS.REJECTED,
    ];
    const negotiation = await prisma.reseedNegotiation.create({
      data: {
        idempotencyKey: uuidv4(),
        visitId: visits[2 + i].id,
        creatorId: sales.id,
        currentHandlerId: statuses[i] === NEGOTIATION_STATUS.DRAFT ? sales.id : manager.id,
        customerName: customers[(2 + i) % customers.length],
        customerComplaint: visits[2 + i].complaintDetail || '客户对苗木质量不满意',
        proposedReseedQty: 10 + i * 5,
        proposedReseedDate: new Date(2025, 4, 25 + i),
        actualReseedQty: statuses[i] === NEGOTIATION_STATUS.APPROVED ? 10 + i * 5 : null,
        actualReseedDate: statuses[i] === NEGOTIATION_STATUS.APPROVED ? new Date(2025, 4, 26 + i) : null,
        status: statuses[i],
        rejectionReason: statuses[i] === NEGOTIATION_STATUS.REJECTED ? '经核实，苗木损伤是客户运输不当造成，非我方责任' : null,
        reworkNote: null,
        managerNote: statuses[i] === NEGOTIATION_STATUS.APPROVED ? '情况属实，同意补苗，请养护组尽快安排' : null,
        customerConfirmed: false,
      },
    });
    negotiations.push(negotiation);

    await prisma.negotiationStatusHistory.create({
      data: {
        negotiationId: negotiation.id,
        fromStatus: null,
        toStatus: NEGOTIATION_STATUS.DRAFT,
        changedById: sales.id,
        changeReason: '创建补苗协商',
      },
    });

    if (statuses[i] !== NEGOTIATION_STATUS.DRAFT) {
      await prisma.negotiationStatusHistory.create({
        data: {
          negotiationId: negotiation.id,
          fromStatus: NEGOTIATION_STATUS.DRAFT,
          toStatus: NEGOTIATION_STATUS.MANAGER_REVIEW,
          changedById: sales.id,
          changeReason: '提交审核',
        },
      });
    }

    if (statuses[i] === NEGOTIATION_STATUS.APPROVED || statuses[i] === NEGOTIATION_STATUS.REJECTED) {
      await prisma.negotiationStatusHistory.create({
        data: {
          negotiationId: negotiation.id,
          fromStatus: NEGOTIATION_STATUS.MANAGER_REVIEW,
          toStatus: statuses[i],
          changedById: manager.id,
          changeReason: statuses[i] === NEGOTIATION_STATUS.APPROVED ? '经理审核通过' : '经理驳回',
        },
      });
    }

    console.log(`✅ 创建补苗协商: ${negotiation.customerName} - ${negotiation.proposedReseedQty}株 - 状态: ${negotiation.status}`);
  }

  const todoData = [
    { type: 'HARVEST_APPROVAL', title: '起苗任务: P-001', desc: '计划起苗60株，请安排执行', refType: 'HarvestRecord', priority: 2 },
    { type: 'NEGOTIATION_REVIEW', title: '补苗协商待审核: 绿源园林', desc: '补苗数量: 15株，请审核', refType: 'ReseedNegotiation', priority: 2 },
    { type: 'DISEASE_FOLLOWUP', title: '病害上报待处理: P-002', desc: '严重程度: SEVERE，树干有虫洞', refType: 'DiseaseReport', priority: 3 },
    { type: 'VISIT_FOLLOWUP', title: '客户回访跟进: 青山绿化', desc: '回访结果: DISSATISFIED，客户要求补苗', refType: 'CustomerVisit', priority: 3 },
    { type: 'RESEED_IMPLEMENTATION', title: '补苗执行: 城市景观', desc: '补苗数量: 20株，请安排执行', refType: 'ReseedNegotiation', priority: 3 },
    { type: 'MAINTENANCE_REVIEW', title: '养护记录待审核: P-004', desc: '养护类型: PEST_CONTROL', refType: 'MaintenanceRecord', priority: 1 },
  ];

  for (let i = 0; i < todoData.length; i++) {
    const assigneeRole = ['HARVEST_APPROVAL', 'RESEED_IMPLEMENTATION', 'MAINTENANCE_REVIEW'].includes(todoData[i].type)
      ? worker.id
      : todoData[i].type === 'DISEASE_FOLLOWUP'
        ? manager.id
        : ['NEGOTIATION_REVIEW'].includes(todoData[i].type)
          ? manager.id
          : sales.id;

    await prisma.todoItem.create({
      data: {
        type: todoData[i].type,
        title: todoData[i].title,
        description: todoData[i].desc,
        referenceId: negotiations[i % negotiations.length].id,
        referenceType: todoData[i].refType,
        assigneeId: assigneeRole,
        creatorId: i % 2 === 0 ? manager.id : sales.id,
        priority: todoData[i].priority,
        isCompleted: i >= 4,
        completedAt: i >= 4 ? new Date(2025, 4, 18 + i) : null,
      },
    });
    console.log(`✅ 创建待办事项: ${todoData[i].title} - 优先级: ${todoData[i].priority}`);
  }

  console.log('\n🎉 数据初始化完成!');
  console.log('\n📋 演示账号:');
  console.log('   基地负责人: manager / manager123');
  console.log('   养护员:     worker / worker123');
  console.log('   销售跟单:   sales / sales123');
  console.log('\n🔗 API入口:');
  console.log('   基础路径:   http://localhost:3000/api');
  console.log('   健康检查:   http://localhost:3000/api/health');
  console.log('   登录:       POST http://localhost:3000/api/auth/login');
  console.log('   仪表盘:     GET  http://localhost:3000/api/dashboard (需登录)');
  console.log('\n📝 快速测试:');
  console.log(`   curl -X POST http://localhost:3000/api/auth/login \\\n     -H "Content-Type: application/json" \\\n     -d '{"username":"manager","password":"manager123"}'`);
}

main()
  .catch((e) => {
    console.error('❌ 数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
