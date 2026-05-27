import { PrismaClient, UserRole, StationStatus, RefundStatus, TaskStatus, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

const USER_IDS = {
  MANAGER: 'manager-001',
  INSPECTOR: 'inspector-001',
  CS: 'cs-user-001',
};

async function main() {
  console.log('🌱 开始生成种子数据...');

  await prisma.refundFlowLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deviceReport.deleteMany();
  await prisma.supplyRecord.deleteMany();
  await prisma.verificationRecord.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.customerPackage.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();

  const [manager, inspector, csUser] = await Promise.all([
    prisma.user.create({
      data: {
        id: USER_IDS.MANAGER,
        name: '张主管',
        role: UserRole.OPERATION_MANAGER,
        phone: '13800000001',
      },
    }),
    prisma.user.create({
      data: {
        id: USER_IDS.INSPECTOR,
        name: '李巡检',
        role: UserRole.INSPECTOR,
        phone: '13800000002',
      },
    }),
    prisma.user.create({
      data: {
        id: USER_IDS.CS,
        name: '王客服',
        role: UserRole.CUSTOMER_SERVICE,
        phone: '13800000003',
      },
    }),
  ]);
  console.log('✅ 用户数据已创建');

  const stations = await Promise.all([
    prisma.station.create({
      data: {
        name: '朝阳区国贸站',
        address: '北京市朝阳区建国门外大街1号',
        status: StationStatus.NORMAL,
      },
    }),
    prisma.station.create({
      data: {
        name: '海淀区中关村站',
        address: '北京市海淀区中关村大街1号',
        status: StationStatus.WARNING,
        warningLevel: 3,
      },
    }),
    prisma.station.create({
      data: {
        name: '西城区金融街站',
        address: '北京市西城区金融街7号',
        status: StationStatus.ABNORMAL,
        warningLevel: 5,
      },
    }),
  ]);
  console.log('✅ 站点数据已创建');

  for (const station of stations) {
    await prisma.supplyRecord.createMany({
      data: [
        { stationId: station.id, supplyType: '洗车液', currentQty: station.name.includes('金融街') ? 5 : 45, warningQty: 20 },
        { stationId: station.id, supplyType: '水蜡', currentQty: station.name.includes('中关村') ? 12 : 38, warningQty: 15 },
        { stationId: station.id, supplyType: '内饰清洁剂', currentQty: 28, warningQty: 10 },
      ],
    });
  }
  console.log('✅ 耗材数据已创建');

  await prisma.deviceReport.createMany({
    data: [
      { stationId: stations[2].id, deviceType: '高压水枪', issueDesc: '水压不稳定，时断时续', reporterName: '客户匿名', photoUrl: '/images/device1.jpg' },
      { stationId: stations[2].id, deviceType: '烘干机', issueDesc: '完全不工作，无热风输出', reporterName: '客户匿名', photoUrl: '/images/device2.jpg' },
      { stationId: stations[1].id, deviceType: '吸尘器', issueDesc: '吸力减弱，需要检查', reporterName: '李巡检', photoUrl: '/images/device3.jpg' },
    ],
  });
  console.log('✅ 设备报修数据已创建');

  const packages = await Promise.all([
    prisma.customerPackage.create({
      data: {
        customerName: '陈明',
        customerPhone: '13900001001',
        packageType: '10次畅洗卡',
        totalCount: 10,
        usedCount: 3,
        price: 199,
        purchaseAt: new Date('2024-01-15'),
        expireAt: new Date('2024-12-31'),
      },
    }),
    prisma.customerPackage.create({
      data: {
        customerName: '刘芳',
        customerPhone: '13900001002',
        packageType: '月卡不限次',
        totalCount: 30,
        usedCount: 8,
        price: 299,
        purchaseAt: new Date('2024-02-01'),
        expireAt: new Date('2024-02-28'),
      },
    }),
    prisma.customerPackage.create({
      data: {
        customerName: '赵强',
        customerPhone: '13900001003',
        packageType: '5次精洗卡',
        totalCount: 5,
        usedCount: 2,
        price: 149,
        purchaseAt: new Date('2024-01-20'),
        expireAt: new Date('2024-07-20'),
      },
    }),
    prisma.customerPackage.create({
      data: {
        customerName: '孙丽',
        customerPhone: '13900001004',
        packageType: '10次畅洗卡',
        totalCount: 10,
        usedCount: 1,
        price: 199,
        purchaseAt: new Date('2024-02-10'),
        expireAt: new Date('2025-02-10'),
      },
    }),
    prisma.customerPackage.create({
      data: {
        customerName: '周伟',
        customerPhone: '13900001005',
        packageType: '10次畅洗卡',
        totalCount: 10,
        usedCount: 5,
        price: 199,
        purchaseAt: new Date('2024-01-05'),
        expireAt: new Date('2024-07-05'),
      },
    }),
  ]);
  console.log('✅ 套餐数据已创建');

  const verifications = await Promise.all([
    prisma.verificationRecord.create({
      data: {
        packageId: packages[0].id,
        stationId: stations[0].id,
        operatorName: '自助',
        photoUrl: '/images/verify1.jpg',
        verifyTime: new Date('2024-02-15 09:30:00'),
      },
    }),
    prisma.verificationRecord.create({
      data: {
        packageId: packages[1].id,
        stationId: stations[1].id,
        operatorName: '自助',
        photoUrl: '/images/verify2.jpg',
        verifyTime: new Date('2024-02-15 14:20:00'),
      },
    }),
    prisma.verificationRecord.create({
      data: {
        packageId: packages[2].id,
        stationId: stations[2].id,
        operatorName: '自助',
        photoUrl: '/images/verify3.jpg',
        verifyTime: new Date('2024-02-15 16:45:00'),
      },
    }),
    prisma.verificationRecord.create({
      data: {
        packageId: packages[4].id,
        stationId: stations[0].id,
        operatorName: '自助',
        photoUrl: '/images/verify4.jpg',
        verifyTime: new Date('2024-02-16 10:15:00'),
      },
    }),
  ]);
  console.log('✅ 核销记录已创建');

  const refunds = await Promise.all([
    prisma.refundRequest.create({
      data: {
        packageId: packages[0].id,
        verificationId: verifications[0].id,
        customerReason: '洗车设备故障，水枪不出水，白跑一趟',
        refundCount: 1,
        status: RefundStatus.SUBMITTED,
      },
    }),
    prisma.refundRequest.create({
      data: {
        packageId: packages[1].id,
        verificationId: verifications[1].id,
        customerReason: '洗不干净，设备老化严重，要求退款',
        refundCount: 1,
        status: RefundStatus.CS_REVIEWING,
        csReviewerId: csUser.id,
        csOpinion: '客户反馈属实，站点设备确实存在老化问题，建议批准退款',
        csReviewTime: new Date(),
      },
    }),
    prisma.refundRequest.create({
      data: {
        packageId: packages[2].id,
        verificationId: verifications[2].id,
        customerReason: '烘干机坏了，车没吹干就走了，感冒了',
        refundCount: 1,
        status: RefundStatus.INSPECTION_REQUIRED,
        csReviewerId: csUser.id,
        csOpinion: '需要现场核实设备状态，确认烘干机是否真的故障',
        csReviewTime: new Date(),
      },
    }),
    prisma.refundRequest.create({
      data: {
        packageId: packages[3].id,
        customerReason: '买错了，不需要这个套餐，想换成其他的',
        refundCount: 9,
        status: RefundStatus.APPROVED,
        csReviewerId: csUser.id,
        csOpinion: '未使用可退款',
        csReviewTime: new Date(),
        finalDecision: 'APPROVED',
        finalReviewerId: manager.id,
        finalReviewTime: new Date(),
      },
    }),
    prisma.refundRequest.create({
      data: {
        packageId: packages[4].id,
        verificationId: verifications[3].id,
        customerReason: '设备没问题，就是不想用了',
        refundCount: 1,
        status: RefundStatus.REJECTED,
        csReviewerId: csUser.id,
        csOpinion: '核销成功，设备正常，不符合退款条件',
        csReviewTime: new Date(),
        finalDecision: 'REJECTED',
        finalReviewerId: manager.id,
        finalReviewTime: new Date(),
      },
    }),
  ]);
  console.log('✅ 退款申诉数据已创建');

  await prisma.refundFlowLog.createMany({
    data: [
      {
        refundId: refunds[0].id,
        fromStatus: null,
        toStatus: RefundStatus.SUBMITTED,
        operatorId: 'system',
        operatorName: '系统自动',
        operatorRole: UserRole.OPERATION_MANAGER,
        remark: '用户提交退款申诉',
      },
      {
        refundId: refunds[1].id,
        fromStatus: null,
        toStatus: RefundStatus.SUBMITTED,
        operatorId: 'system',
        operatorName: '系统自动',
        operatorRole: UserRole.OPERATION_MANAGER,
        remark: '用户提交退款申诉',
      },
      {
        refundId: refunds[1].id,
        fromStatus: RefundStatus.SUBMITTED,
        toStatus: RefundStatus.CS_REVIEWING,
        operatorId: csUser.id,
        operatorName: csUser.name,
        operatorRole: UserRole.CUSTOMER_SERVICE,
        remark: '客户反馈属实，站点设备确实存在老化问题，建议批准退款',
      },
      {
        refundId: refunds[2].id,
        fromStatus: null,
        toStatus: RefundStatus.SUBMITTED,
        operatorId: 'system',
        operatorName: '系统自动',
        operatorRole: UserRole.OPERATION_MANAGER,
        remark: '用户提交退款申诉',
      },
      {
        refundId: refunds[2].id,
        fromStatus: RefundStatus.SUBMITTED,
        toStatus: RefundStatus.INSPECTION_REQUIRED,
        operatorId: csUser.id,
        operatorName: csUser.name,
        operatorRole: UserRole.CUSTOMER_SERVICE,
        remark: '需要现场核实设备状态，确认烘干机是否真的故障',
      },
      {
        refundId: refunds[3].id,
        fromStatus: null,
        toStatus: RefundStatus.SUBMITTED,
        operatorId: 'system',
        operatorName: '系统自动',
        operatorRole: UserRole.OPERATION_MANAGER,
        remark: '用户提交退款申诉',
      },
      {
        refundId: refunds[3].id,
        fromStatus: RefundStatus.SUBMITTED,
        toStatus: RefundStatus.CS_REVIEWING,
        operatorId: csUser.id,
        operatorName: csUser.name,
        operatorRole: UserRole.CUSTOMER_SERVICE,
        remark: '未使用可退款',
      },
      {
        refundId: refunds[3].id,
        fromStatus: RefundStatus.CS_REVIEWING,
        toStatus: RefundStatus.APPROVED,
        operatorId: manager.id,
        operatorName: manager.name,
        operatorRole: UserRole.OPERATION_MANAGER,
        remark: '运营主管批准退款',
      },
    ],
  });
  console.log('✅ 流程日志数据已创建');

  await prisma.task.createMany({
    data: [
      {
        type: TaskType.REFUND_REVIEW,
        stationId: stations[2].id,
        relatedId: refunds[2].id,
        relatedType: 'RefundRequest',
        title: '退款申诉现场核验 - 西城区金融街站',
        description: '退款原因: 烘干机坏了，车没吹干就走了，感冒了\n客服意见: 需要现场核实设备状态',
        status: TaskStatus.PENDING,
        assigneeId: inspector.id,
        priority: 2,
      },
      {
        type: TaskType.STATION_INSPECTION,
        stationId: stations[2].id,
        title: '站点异常紧急处理 - 西城区金融街站',
        description: '设备故障较多，水压不稳定，烘干机完全不工作',
        status: TaskStatus.IN_PROGRESS,
        assigneeId: inspector.id,
        priority: 3,
        escalated: true,
        escalateNote: '多个设备同时故障，需紧急处理',
      },
      {
        type: TaskType.SUPPLY_REPLENISHMENT,
        stationId: stations[1].id,
        title: '耗材补货 - 海淀区中关村站',
        description: '水蜡库存不足预警',
        status: TaskStatus.UNASSIGNED,
        priority: 1,
      },
      {
        type: TaskType.SUPPLY_REPLENISHMENT,
        stationId: stations[2].id,
        title: '耗材补货 - 西城区金融街站',
        description: '洗车液库存严重不足',
        status: TaskStatus.PENDING,
        assigneeId: inspector.id,
        priority: 2,
      },
      {
        type: TaskType.STATION_INSPECTION,
        stationId: stations[1].id,
        title: '设备检查 - 海淀区中关村站',
        description: '吸尘器吸力减弱，需要检查维护',
        status: TaskStatus.COMPLETED,
        assigneeId: inspector.id,
        priority: 1,
        completedAt: new Date(),
        resultNote: '已清理滤网，吸力恢复正常',
      },
    ],
  });
  console.log('✅ 任务数据已创建');

  console.log('\n🎉 所有种子数据生成完成！');
  console.log('\n📊 数据概览：');
  console.log('  - 用户: 3人 (1主管 + 1巡检 + 1客服)');
  console.log(`    - 张主管: ${USER_IDS.MANAGER}`);
  console.log(`    - 李巡检: ${USER_IDS.INSPECTOR}`);
  console.log(`    - 王客服: ${USER_IDS.CS}`);
  console.log('  - 站点: 3个 (1正常 + 1预警 + 1异常)');
  console.log('  - 套餐: 5个');
  console.log('  - 退款申诉: 5条 (1待审核 + 1待最终 + 1待核验 + 1已批 + 1已驳)');
  console.log('  - 待办任务: 5个');
  console.log('\n📋 测试样例说明：');
  console.log('  【正常流程】孙丽的退款申请 - 已走完完整流程，客服审核后主管批准');
  console.log('  【问题流程】赵强的退款申请 - 卡在待现场核验环节，需要巡检员处理');
  console.log('  【驳回案例】周伟的退款申请 - 设备正常，理由不充分被驳回');
  console.log('  【站点异常】西城区金融街站 - 多设备故障+耗材不足，已升级为紧急任务');
  console.log('  【耗材预警】海淀区中关村站 - 水蜡库存预警，需补货');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
