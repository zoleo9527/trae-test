const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hashPassword = (password) => bcrypt.hash(password, 10);

async function main() {
  console.log('🌱 Starting database seeding...');

  const passwordHash = await hashPassword('password123');

  console.log('👤 Creating users...');
  const [manager, ticketSupervisor, backendCoordinator] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        password: passwordHash,
        name: '张明',
        email: 'zhangming@theater.com',
        phone: '13800138001',
        role: 'THEATER_MANAGER',
      },
    }),
    prisma.user.upsert({
      where: { username: 'ticket' },
      update: {},
      create: {
        username: 'ticket',
        password: passwordHash,
        name: '李华',
        email: 'lihua@theater.com',
        phone: '13800138002',
        role: 'TICKET_SUPERVISOR',
      },
    }),
    prisma.user.upsert({
      where: { username: 'backend' },
      update: {},
      create: {
        username: 'backend',
        password: passwordHash,
        name: '王芳',
        email: 'wangfang@theater.com',
        phone: '13800138003',
        role: 'BACKEND_COORDINATOR',
      },
    }),
  ]);

  console.log('✅ Users created:');
  console.log('   剧院经理: manager / password123');
  console.log('   票务主管: ticket / password123');
  console.log('   后台统筹: backend / password123');

  console.log('🎭 Creating equipment...');
  const equipments = await Promise.all([
    prisma.equipment.upsert({
      where: { id: 'eq-001' },
      update: {},
      create: {
        id: 'eq-001',
        name: '专业音响系统',
        category: '音响设备',
        specification: 'JBL VRX932LA 线阵列',
        quantity: 8,
        availableQty: 8,
        location: 'A区设备库房',
        description: '大型演出专用线阵列音响系统',
      },
    }),
    prisma.equipment.upsert({
      where: { id: 'eq-002' },
      update: {},
      create: {
        id: 'eq-002',
        name: 'LED大屏',
        category: '显示设备',
        specification: 'P3.91 户外防水屏 50㎡',
        quantity: 1,
        availableQty: 1,
        location: 'B区设备库房',
        description: '舞台背景LED显示大屏',
      },
    }),
    prisma.equipment.upsert({
      where: { id: 'eq-003' },
      update: {},
      create: {
        id: 'eq-003',
        name: '无线手持话筒',
        category: '音频设备',
        specification: 'Shure SLX24/SM58',
        quantity: 12,
        availableQty: 10,
        location: 'C区设备库房',
        description: '专业演出级无线麦克风',
      },
    }),
    prisma.equipment.upsert({
      where: { id: 'eq-004' },
      update: {},
      create: {
        id: 'eq-004',
        name: '专业舞台灯光',
        category: '灯光设备',
        specification: '230W摇头光束灯',
        quantity: 24,
        availableQty: 24,
        location: 'D区设备库房',
        description: '电脑摇头光束灯',
      },
    }),
    prisma.equipment.upsert({
      where: { id: 'eq-005' },
      update: {},
      create: {
        id: 'eq-005',
        name: '调音台',
        category: '音响设备',
        specification: 'Yamaha CL5 数字调音台',
        quantity: 2,
        availableQty: 2,
        location: 'A区设备库房',
        description: '72通道数字调音台',
      },
    }),
  ]);
  console.log(`✅ ${equipments.length} equipment items created`);

  console.log('📅 Creating schedules...');
  const baseDate = new Date();
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const schedule1 = await prisma.schedule.upsert({
    where: { id: 'sch-001' },
    update: {},
    create: {
      id: 'sch-001',
      performanceName: '经典话剧《雷雨》',
      performanceType: '话剧',
      startTime: addDays(baseDate, 2),
      endTime: addDays(baseDate, 2),
      venue: '大剧院主厅',
      status: 'CONFIRMED',
      castList: '主演：张三、李四、王五',
      description: '曹禺经典话剧代表作，讲述上世纪20年代一个封建大家庭的悲剧故事。',
      createdById: manager.id,
      updatedById: manager.id,
    },
  });

  const schedule2 = await prisma.schedule.upsert({
    where: { id: 'sch-002' },
    update: {},
    create: {
      id: 'sch-002',
      performanceName: '儿童音乐剧《冰雪奇缘》',
      performanceType: '音乐剧',
      startTime: addDays(baseDate, 5),
      endTime: addDays(baseDate, 5),
      venue: '大剧院主厅',
      status: 'COMPLETED',
      castList: '儿童艺术团A班',
      description: '根据迪士尼经典动画改编的儿童音乐剧，适合全家观看。',
      createdById: manager.id,
      updatedById: manager.id,
    },
  });

  const schedule3 = await prisma.schedule.upsert({
    where: { id: 'sch-003' },
    update: {},
    create: {
      id: 'sch-003',
      performanceName: '古典音乐会 - 贝多芬之夜',
      performanceType: '音乐会',
      startTime: addDays(baseDate, 7),
      endTime: addDays(baseDate, 7),
      venue: '音乐厅',
      status: 'DRAFT',
      castList: '市交响乐团',
      description: '演奏贝多芬第三、第五、第七交响曲',
      createdById: manager.id,
      updatedById: manager.id,
    },
  });

  const schedule4 = await prisma.schedule.upsert({
    where: { id: 'sch-004' },
    update: {},
    create: {
      id: 'sch-004',
      performanceName: '芭蕾舞剧《天鹅湖》',
      performanceType: '舞剧',
      startTime: addDays(baseDate, 10),
      endTime: addDays(baseDate, 10),
      venue: '大剧院主厅',
      status: 'CONFIRMED',
      castList: '国家芭蕾舞团',
      description: '柴可夫斯基经典芭蕾舞剧',
      createdById: manager.id,
      updatedById: manager.id,
    },
  });

  console.log(`✅ 4 schedules created`);

  console.log('📝 Creating schedule status history...');
  await Promise.all([
    prisma.scheduleStatusHistory.create({
      data: {
        scheduleId: schedule1.id,
        oldStatus: 'DRAFT',
        newStatus: 'CONFIRMED',
        changedById: manager.id,
        changeReason: '排练顺利，准备就绪',
      },
    }),
    prisma.scheduleStatusHistory.create({
      data: {
        scheduleId: schedule2.id,
        oldStatus: 'DRAFT',
        newStatus: 'CONFIRMED',
        changedById: manager.id,
        changeReason: '票务销售良好，确认演出',
      },
    }),
    prisma.scheduleStatusHistory.create({
      data: {
        scheduleId: schedule2.id,
        oldStatus: 'CONFIRMED',
        newStatus: 'PERFORMING',
        changedById: backendCoordinator.id,
        changeReason: '演出开始',
      },
    }),
    prisma.scheduleStatusHistory.create({
      data: {
        scheduleId: schedule2.id,
        oldStatus: 'PERFORMING',
        newStatus: 'COMPLETED',
        changedById: backendCoordinator.id,
        changeReason: '演出圆满结束',
      },
    }),
  ]);
  console.log('✅ Status history created');

  console.log('🔧 Creating equipment borrow records...');
  const borrow1 = await prisma.equipmentBorrow.create({
    data: {
      scheduleId: schedule1.id,
      equipmentId: 'eq-001',
      borrowQty: 4,
      requestReason: '话剧演出主扩声系统',
      expectedReturnDate: addDays(baseDate, 3),
      status: 'APPROVED',
      requestedById: backendCoordinator.id,
      approvedById: manager.id,
      supplementNote: '请于演出前一天完成安装调试',
    },
  });

  const borrow2 = await prisma.equipmentBorrow.create({
    data: {
      scheduleId: schedule1.id,
      equipmentId: 'eq-003',
      borrowQty: 6,
      requestReason: '演员台词拾音',
      expectedReturnDate: addDays(baseDate, 3),
      status: 'PENDING',
      requestedById: backendCoordinator.id,
    },
  });

  const borrow3 = await prisma.equipmentBorrow.create({
    data: {
      scheduleId: schedule2.id,
      equipmentId: 'eq-002',
      borrowQty: 1,
      requestReason: '舞台背景显示',
      expectedReturnDate: addDays(baseDate, 6),
      actualReturnDate: addDays(baseDate, 6),
      status: 'RETURNED',
      requestedById: backendCoordinator.id,
      approvedById: manager.id,
      supplementNote: '使用后请检查所有LED模块是否正常',
    },
  });

  const borrow4 = await prisma.equipmentBorrow.create({
    data: {
      scheduleId: schedule2.id,
      equipmentId: 'eq-003',
      borrowQty: 4,
      requestReason: '演出人员话筒',
      expectedReturnDate: addDays(baseDate, 6),
      actualReturnDate: addDays(baseDate, 6),
      status: 'RETURNED',
      requestedById: backendCoordinator.id,
      approvedById: manager.id,
      rejectReason: null,
    },
  });

  console.log('✅ 4 borrow records created');

  console.log('📝 Creating borrow status history...');
  await Promise.all([
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow1.id, oldStatus: 'PENDING', newStatus: 'APPROVED', changedById: manager.id, changeReason: '设备充足，批准借用' },
    }),
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow3.id, oldStatus: 'PENDING', newStatus: 'APPROVED', changedById: manager.id, changeReason: '批准借用' },
    }),
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow3.id, oldStatus: 'APPROVED', newStatus: 'BORROWED', changedById: backendCoordinator.id, changeReason: '设备已出库' },
    }),
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow3.id, oldStatus: 'BORROWED', newStatus: 'RETURNED', changedById: backendCoordinator.id, changeReason: '设备完好归还' },
    }),
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow4.id, oldStatus: 'PENDING', newStatus: 'APPROVED', changedById: manager.id, changeReason: '批准借用' },
    }),
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow4.id, oldStatus: 'APPROVED', newStatus: 'BORROWED', changedById: backendCoordinator.id, changeReason: '设备已出库' },
    }),
    prisma.borrowStatusHistory.create({
      data: { borrowId: borrow4.id, oldStatus: 'BORROWED', newStatus: 'RETURNED', changedById: backendCoordinator.id, changeReason: '设备完好归还，1个话筒有轻微划痕已记录' },
    }),
  ]);
  console.log('✅ Borrow status history created');

  console.log('📝 Creating remarks...');
  await Promise.all([
    prisma.remark.create({
      data: {
        content: '排期已确认，请注意协调灯光组和音响组的进场时间。',
        createdById: manager.id,
        scheduleId: schedule1.id,
      },
    }),
    prisma.remark.create({
      data: {
        content: '2024年5月15日联排发现第三幕换场时间需要压缩，目前需要3分钟，目标2分钟。已与舞美组沟通。',
        isSupplement: true,
        createdById: backendCoordinator.id,
        scheduleId: schedule1.id,
      },
    }),
    prisma.remark.create({
      data: {
        content: '设备使用后发现2号话筒有杂音，已安排技术部门检修。',
        createdById: backendCoordinator.id,
        borrowId: borrow4.id,
      },
    }),
    prisma.remark.create({
      data: {
        content: '音响系统调试完成，频响曲线符合要求。建议演出当天提前2小时完成最后一次系统检查。',
        createdById: backendCoordinator.id,
        equipmentId: 'eq-001',
      },
    }),
  ]);
  console.log('✅ Remarks created');

  console.log('📊 Creating performance review...');
  const review1 = await prisma.performanceReview.create({
    data: {
      scheduleId: schedule2.id,
      reviewContent: '整体演出效果良好，观众反响热烈。儿童演员表现出色，舞美设计精美。但第二幕换场时间稍长，影响了整体节奏。音响效果在高音区略有失真，需要进一步调试。',
      overallRating: 4,
      issuesFound: '1. 第二幕换场时间过长（约3分钟）\n2. 音响系统在高音区有轻微失真\n3. 后台通道在中场休息时拥堵',
      improvementSuggestions: '1. 优化第二幕换场流程，增加道具人员\n2. 调音台高频段适当衰减\n3. 中场休息时增加后台通道引导人员',
      createdById: backendCoordinator.id,
    },
  });
  console.log('✅ Performance review created');

  console.log('🐛 Creating review issues...');
  await Promise.all([
    prisma.reviewIssue.create({
      data: {
        reviewId: review1.id,
        title: '第二幕换场时间过长',
        description: '第二幕换场目前需要3分钟，导致整体演出节奏拖沓。建议优化道具布局和人员分工，目标压缩至2分钟以内。',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        responsibleParty: '舞美组',
      },
    }),
    prisma.reviewIssue.create({
      data: {
        reviewId: review1.id,
        title: '音响高音区失真',
        description: '演出中发现高音区有轻微失真，尤其在演员高声演唱时更为明显。需要检查扬声器系统和调音台设置。',
        severity: 'HIGH',
        status: 'OPEN',
        responsibleParty: '技术部',
      },
    }),
    prisma.reviewIssue.create({
      data: {
        reviewId: review1.id,
        title: '后台通道中场休息拥堵',
        description: '中场休息时后台通道人流拥挤，影响工作人员通行。建议增加引导人员或优化通道布局。',
        severity: 'LOW',
        status: 'RESOLVED',
        responsibleParty: '场务组',
        resolution: '已在后续演出中增加2名引导人员，拥堵问题已解决。',
        resolvedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ Review issues created');

  console.log('🎫 Creating group orders...');
  const order1 = await prisma.groupOrder.create({
    data: {
      scheduleId: schedule1.id,
      groupName: '市教育局观摩团',
      contactPerson: '赵老师',
      contactPhone: '13900139001',
      ticketCount: 50,
      unitPrice: 180,
      totalAmount: 9000,
      status: 'CONFIRMED',
      createdById: ticketSupervisor.id,
    },
  });

  const order2 = await prisma.groupOrder.create({
    data: {
      scheduleId: schedule2.id,
      groupName: '阳光小学',
      contactPerson: '孙主任',
      contactPhone: '13900139002',
      ticketCount: 120,
      unitPrice: 120,
      totalAmount: 14400,
      actualPaid: 14400,
      status: 'COMPLETED',
      createdById: ticketSupervisor.id,
    },
  });

  const order3 = await prisma.groupOrder.create({
    data: {
      scheduleId: schedule1.id,
      groupName: '某企业工会',
      contactPerson: '周主席',
      contactPhone: '13900139003',
      ticketCount: 30,
      unitPrice: 180,
      totalAmount: 5400,
      status: 'REFUND_REQUESTED',
      refundReason: '企业活动时间调整，无法安排观看',
      refundAmount: 5400,
      createdById: ticketSupervisor.id,
    },
  });
  console.log('✅ 3 group orders created');

  console.log('📝 Creating order status history...');
  await Promise.all([
    prisma.orderStatusHistory.create({
      data: { orderId: order1.id, oldStatus: 'PENDING', newStatus: 'CONFIRMED', changedById: manager.id, changeReason: '座位已确认，等待付款' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: order2.id, oldStatus: 'PENDING', newStatus: 'CONFIRMED', changedById: manager.id, changeReason: '确认订单' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: order2.id, oldStatus: 'CONFIRMED', newStatus: 'PAID', changedById: ticketSupervisor.id, changeReason: '款项已到账' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: order2.id, oldStatus: 'PAID', newStatus: 'COMPLETED', changedById: ticketSupervisor.id, changeReason: '演出完成，订单结清' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: order3.id, oldStatus: 'PENDING', newStatus: 'CONFIRMED', changedById: manager.id, changeReason: '确认订单' },
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: order3.id, oldStatus: 'CONFIRMED', newStatus: 'REFUND_REQUESTED', changedById: ticketSupervisor.id, changeReason: '客户活动时间调整，申请全额退款' },
    }),
  ]);
  console.log('✅ Order status history created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Demo Data Summary:');
  console.log('   👤 3 Users (3 roles)');
  console.log('   🎭 5 Equipment items');
  console.log('   📅 4 Schedules (various statuses)');
  console.log('   🔧 4 Equipment borrow records');
  console.log('   📝 4 Remarks (including supplements)');
  console.log('   📊 1 Performance review');
  console.log('   🐛 3 Review issues');
  console.log('   🎫 3 Group orders');
  console.log('   📜 Complete status history trails');
  console.log('\n🔑 Test Accounts:');
  console.log('   剧院经理 (THEATER_MANAGER): manager / password123');
  console.log('   票务主管 (TICKET_SUPERVISOR): ticket / password123');
  console.log('   后台统筹 (BACKEND_COORDINATOR): backend / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
