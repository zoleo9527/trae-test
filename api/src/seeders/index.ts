import { DataSource } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { InstallationAppointment, AppointmentStatus } from '../entities/installation-appointment.entity';
import { AcceptanceRecord, AcceptanceStatus } from '../entities/acceptance-record.entity';
import { ExceptionOrder, ExceptionType, ExceptionStatus } from '../entities/exception-order.entity';
import { RepairPart, RepairPartStatus } from '../entities/repair-part.entity';
import { SampleLoan, SampleLoanStatus } from '../entities/sample-loan.entity';
import { Notification, NotificationType, NotificationPriority } from '../entities/notification.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'furniture.db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('开始插入测试数据...');

  const customerRepo = AppDataSource.getRepository(Customer);
  const productRepo = AppDataSource.getRepository(Product);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const appointmentRepo = AppDataSource.getRepository(InstallationAppointment);
  const acceptanceRepo = AppDataSource.getRepository(AcceptanceRecord);
  const exceptionRepo = AppDataSource.getRepository(ExceptionOrder);
  const repairPartRepo = AppDataSource.getRepository(RepairPart);
  const sampleLoanRepo = AppDataSource.getRepository(SampleLoan);
  const notificationRepo = AppDataSource.getRepository(Notification);

  const customers = await customerRepo.save([
    { name: '张先生', phone: '13800138001', address: '北京市朝阳区望京SOHO T1', community: '望京社区', remark: 'VIP客户，对品质要求高' },
    { name: '李女士', phone: '13800138002', address: '北京市海淀区中关村软件园', community: '中关村社区', remark: '老客户推荐' },
    { name: '王总', phone: '13800138003', address: '北京市丰台区科技园总部基地', community: '科技园社区', remark: '办公室装修批量采购' },
    { name: '陈小姐', phone: '13800138004', address: '北京市通州区副中心办公楼', community: '副中心社区', remark: '新婚装修' },
    { name: '刘先生', phone: '13800138005', address: '北京市昌平区回龙观', community: '回龙观社区', remark: '第二次购买' },
  ]);
  console.log('插入客户数据完成');

  const products = await productRepo.save([
    { name: '北欧风格实木沙发', category: '沙发', model: 'SF-001', price: 12800, isSample: false, description: '进口橡木框架，高密度海绵，可拆洗布艺', stock: 15 },
    { name: '极简风格电视柜', category: '柜类', model: 'TV-002', price: 4500, isSample: false, description: '岩板台面，胡桃木柜体，隐藏式拉手', stock: 20 },
    { name: '人体工学办公椅', category: '椅子', model: 'CH-003', price: 3200, isSample: true, description: '网布透气，可调节腰托，静音滚轮', stock: 30 },
    { name: '定制衣柜', category: '柜类', model: 'WD-004', price: 8500, isSample: false, description: 'E0级板材，按需定制尺寸和内部结构', stock: 0 },
    { name: '大理石餐桌', category: '桌椅', model: 'TB-005', price: 6800, isSample: false, description: '天然大理石台面，碳素钢桌腿', stock: 10 },
    { name: '真皮床头软包床', category: '床类', model: 'BD-006', price: 9800, isSample: true, description: '进口头层牛皮，实木排骨架', stock: 8 },
    { name: '儿童书桌椅套装', category: '桌椅', model: 'KD-007', price: 4200, isSample: false, description: '可升降调节，环保材质', stock: 25 },
    { name: '餐边柜', category: '柜类', model: 'CB-008', price: 3800, isSample: false, description: '岩板台面，多储物空间', stock: 12 },
  ]);
  console.log('插入产品数据完成');

  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, days: number) => { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; };

  const orders = await orderRepo.save([
    {
      orderNo: 'FJ202605200001',
      customerId: customers[0].id,
      totalAmount: 24100,
      deposit: 8000,
      customConfig: '沙发面料换成米白色科技布，电视柜长度1.8米',
      salesConsultant: '销售顾问-小林',
      showroomManager: '展厅经理-王姐',
      installationCoordinator: '安装协调-张工',
      status: OrderStatus.COMPLETED,
      remark: '正常订单，已完成全流程',
      expectedDeliveryDate: addDays(today, -10),
      actualDeliveryDate: addDays(today, -8),
    },
    {
      orderNo: 'FJ202605210002',
      customerId: customers[1].id,
      totalAmount: 18300,
      deposit: 6000,
      customConfig: '衣柜定制尺寸：宽2.4米*高2.7米，内部加抽屉',
      salesConsultant: '销售顾问-小周',
      showroomManager: '展厅经理-王姐',
      installationCoordinator: '安装协调-李工',
      status: OrderStatus.INSTALLING,
      remark: '正在安装，待验收',
      expectedDeliveryDate: addDays(today, -3),
      actualDeliveryDate: addDays(today, -2),
    },
    {
      orderNo: 'FJ202605220003',
      customerId: customers[2].id,
      totalAmount: 86500,
      deposit: 30000,
      customConfig: '办公椅10把，沙发2套，全部深灰色',
      salesConsultant: '销售顾问-小林',
      showroomManager: '展厅经理-赵总',
      installationCoordinator: '安装协调-张工',
      status: OrderStatus.EXCEPTION,
      remark: '批量订单，样品借出未归还 + 缺件问题',
      expectedDeliveryDate: addDays(today, -5),
      actualDeliveryDate: addDays(today, -4),
    },
    {
      orderNo: 'FJ202605230004',
      customerId: customers[3].id,
      totalAmount: 31800,
      deposit: 10000,
      customConfig: '床加两个床头柜，整体白色系',
      salesConsultant: '销售顾问-小吴',
      showroomManager: '展厅经理-王姐',
      installationCoordinator: '安装协调-王工',
      status: OrderStatus.DELIVERED,
      remark: '已到货，待预约安装',
      expectedDeliveryDate: addDays(today, 0),
      actualDeliveryDate: addDays(today, 0),
    },
    {
      orderNo: 'FJ202605240005',
      customerId: customers[4].id,
      totalAmount: 11000,
      deposit: 4000,
      customConfig: '餐桌1.6米，加4把餐椅',
      salesConsultant: '销售顾问-小周',
      showroomManager: '展厅经理-王姐',
      installationCoordinator: '安装协调-李工',
      status: OrderStatus.PRODUCING,
      remark: '定制生产中',
      expectedDeliveryDate: addDays(today, 15),
    },
    {
      orderNo: 'FJ202605250006',
      customerId: customers[0].id,
      totalAmount: 7600,
      deposit: 3000,
      customConfig: '儿童房全套',
      salesConsultant: '销售顾问-小林',
      showroomManager: '展厅经理-王姐',
      installationCoordinator: '安装协调-张工',
      status: OrderStatus.CONFIRMED,
      remark: '刚确认的订单',
      expectedDeliveryDate: addDays(today, 20),
    },
  ]);
  console.log('插入订单数据完成');

  await orderItemRepo.save([
    { orderId: orders[0].id, productId: products[0].id, productName: '北欧风格实木沙发', productModel: 'SF-001', customSpec: '米白色科技布', quantity: 1, unitPrice: 12800, subtotal: 12800, deliveryStatus: 'delivered', deliveredAt: addDays(today, -8) },
    { orderId: orders[0].id, productId: products[1].id, productName: '极简风格电视柜', productModel: 'TV-002', customSpec: '1.8米', quantity: 1, unitPrice: 4500, subtotal: 4500, deliveryStatus: 'delivered', deliveredAt: addDays(today, -8) },
    { orderId: orders[0].id, productId: products[4].id, productName: '大理石餐桌', productModel: 'TB-005', customSpec: '', quantity: 1, unitPrice: 6800, subtotal: 6800, deliveryStatus: 'delivered', deliveredAt: addDays(today, -8) },
    { orderId: orders[1].id, productId: products[3].id, productName: '定制衣柜', productModel: 'WD-004', customSpec: '宽2.4米*高2.7米', quantity: 1, unitPrice: 8500, subtotal: 8500, deliveryStatus: 'delivered', deliveredAt: addDays(today, -2) },
    { orderId: orders[1].id, productId: products[5].id, productName: '真皮床头软包床', productModel: 'BD-006', customSpec: '', quantity: 1, unitPrice: 9800, subtotal: 9800, deliveryStatus: 'delivered', deliveredAt: addDays(today, -2) },
    { orderId: orders[2].id, productId: products[2].id, productName: '人体工学办公椅', productModel: 'CH-003', customSpec: '深灰色', quantity: 10, unitPrice: 3200, subtotal: 32000, deliveryStatus: 'partial', deliveredAt: addDays(today, -4) },
    { orderId: orders[2].id, productId: products[0].id, productName: '北欧风格实木沙发', productModel: 'SF-001', customSpec: '深灰色', quantity: 2, unitPrice: 12800, subtotal: 25600, deliveryStatus: 'delivered', deliveredAt: addDays(today, -4) },
    { orderId: orders[2].id, productId: products[7].id, productName: '餐边柜', productModel: 'CB-008', customSpec: '', quantity: 2, unitPrice: 3800, subtotal: 7600, deliveryStatus: 'pending' },
    { orderId: orders[2].id, productId: products[1].id, productName: '极简风格电视柜', productModel: 'TV-002', customSpec: '', quantity: 3, unitPrice: 4500, subtotal: 13500, deliveryStatus: 'pending' },
    { orderId: orders[3].id, productId: products[5].id, productName: '真皮床头软包床', productModel: 'BD-006', customSpec: '白色', quantity: 1, unitPrice: 9800, subtotal: 9800, deliveryStatus: 'delivered', deliveredAt: addDays(today, 0) },
    { orderId: orders[3].id, productId: products[7].id, productName: '餐边柜', productModel: 'CB-008', customSpec: '白色', quantity: 1, unitPrice: 3800, subtotal: 3800, deliveryStatus: 'delivered', deliveredAt: addDays(today, 0) },
    { orderId: orders[3].id, productId: products[6].id, productName: '儿童书桌椅套装', productModel: 'KD-007', customSpec: '', quantity: 2, unitPrice: 4200, subtotal: 8400, deliveryStatus: 'delivered', deliveredAt: addDays(today, 0) },
    { orderId: orders[4].id, productId: products[4].id, productName: '大理石餐桌', productModel: 'TB-005', customSpec: '1.6米', quantity: 1, unitPrice: 6800, subtotal: 6800, deliveryStatus: 'pending' },
    { orderId: orders[4].id, productId: products[2].id, productName: '人体工学办公椅', productModel: 'CH-003', customSpec: '', quantity: 1, unitPrice: 3200, subtotal: 3200, deliveryStatus: 'pending' },
    { orderId: orders[5].id, productId: products[6].id, productName: '儿童书桌椅套装', productModel: 'KD-007', customSpec: '蓝色', quantity: 1, unitPrice: 4200, subtotal: 4200, deliveryStatus: 'pending' },
    { orderId: orders[5].id, productId: products[3].id, productName: '定制衣柜', productModel: 'WD-004', customSpec: '儿童款', quantity: 1, unitPrice: 3400, subtotal: 3400, deliveryStatus: 'pending' },
  ]);
  console.log('插入订单项数据完成');

  await appointmentRepo.save([
    {
      orderId: orders[0].id,
      appointmentDate: formatDate(addDays(today, -7)),
      timeSlot: '09:00-12:00',
      installerName: '李安装',
      installerPhone: '13900139001',
      teamSize: 2,
      status: AppointmentStatus.COMPLETED,
      preCheckItems: '检查工具、保护地板、确认安装位置',
      actualStartTime: addDays(today, -7),
      actualEndTime: addDays(today, -7),
    },
    {
      orderId: orders[1].id,
      appointmentDate: formatDate(addDays(today, 0)),
      timeSlot: '14:00-18:00',
      installerName: '王安装',
      installerPhone: '13900139002',
      teamSize: 3,
      status: AppointmentStatus.IN_PROGRESS,
      preCheckItems: '衣柜需现场组装，注意墙面找平',
      actualStartTime: addDays(today, 0),
    },
    {
      orderId: orders[2].id,
      appointmentDate: formatDate(addDays(today, -3)),
      timeSlot: '09:00-18:00',
      installerName: '张安装',
      installerPhone: '13900139003',
      teamSize: 4,
      status: AppointmentStatus.COMPLETED,
      remark: '样品借出未归还，缺餐边柜2个、电视柜3个',
      actualStartTime: addDays(today, -3),
      actualEndTime: addDays(today, -3),
    },
    {
      orderId: orders[3].id,
      appointmentDate: formatDate(addDays(today, 2)),
      timeSlot: '10:00-14:00',
      installerName: '李安装',
      installerPhone: '13900139001',
      teamSize: 2,
      status: AppointmentStatus.CONFIRMED,
      preCheckItems: '电梯可进，无需吊装',
    },
    {
      orderId: orders[0].id,
      appointmentDate: formatDate(addDays(today, 5)),
      timeSlot: '14:00-16:00',
      installerName: '王安装',
      installerPhone: '13900139002',
      teamSize: 2,
      status: AppointmentStatus.PENDING,
      previousAppointmentId: 1,
    },
  ]);
  console.log('插入安装预约数据完成');

  await acceptanceRepo.save([
    {
      orderId: orders[0].id,
      appointmentId: 1,
      status: AcceptanceStatus.PASSED,
      overallEvaluation: '安装规范，效果满意',
      satisfactionScore: 5,
      inspectionTime: addDays(today, -7),
      inspectorName: '展厅经理-王姐',
      customerSignature: true,
    },
    {
      orderId: orders[2].id,
      appointmentId: 3,
      status: AcceptanceStatus.FAILED,
      overallEvaluation: '部分货品未到齐，待补件后再验收',
      qualityIssues: '部分沙发有轻微划痕',
      missingItems: '餐边柜2个、电视柜3个未到货',
      rectificationPlan: '1. 已发货的沙发划痕安排师傅上门修复；2. 餐边柜和电视柜加急生产，预计10天后到货',
      inspectionTime: addDays(today, -3),
      inspectorName: '展厅经理-赵总',
      customerSignature: true,
      rectificationDueDate: addDays(today, 7),
    },
  ]);
  console.log('插入验收回单数据完成');

  const exceptions = await exceptionRepo.save([
    {
      orderId: orders[2].id,
      type: ExceptionType.MISSING_PARTS,
      status: ExceptionStatus.IN_PROGRESS,
      title: '批量订单缺件',
      description: '餐边柜2个、电视柜3个未到货，影响整体验收',
      impact: '客户办公室无法按时投入使用，已产生投诉',
      reportedBy: '安装协调-张工',
      assignee: '安装协调-张工',
      rootCause: '生产排期冲突，部分货品延迟',
      resolution: '已安排加急生产，预计10天后到货',
    },
    {
      orderId: orders[2].id,
      type: ExceptionType.QUALITY_ISSUE,
      status: ExceptionStatus.AWAITING_CUSTOMER,
      title: '沙发划痕问题',
      description: '已送达的2套沙发有轻微划痕，客户要求修复或更换',
      impact: '客户满意度下降',
      reportedBy: '安装协调-张工',
      assignee: '售后-刘师傅',
      rootCause: '运输过程中磕碰',
      resolution: '安排师傅上门修复，客户同意改期',
    },
    {
      orderId: orders[2].id,
      type: ExceptionType.SAMPLE_NOT_RETURNED,
      status: ExceptionStatus.OPEN,
      title: '办公椅样品未归还',
      description: '客户选型时借出的2把人体工学办公椅样品至今未归还，已超过约定归还日期5天',
      impact: '展厅样品不足，影响其他客户选型',
      reportedBy: '销售顾问-小林',
      assignee: '销售顾问-小林',
    },
    {
      orderId: orders[1].id,
      type: ExceptionType.CUSTOM_CONFIG_ISSUE,
      status: ExceptionStatus.IN_PROGRESS,
      title: '衣柜定制尺寸沟通问题',
      description: '客户要求的抽屉布局与设计图有出入，需现场调整',
      reportedBy: '安装协调-李工',
      assignee: '设计-小陈',
    },
  ]);
  console.log('插入异常单数据完成');

  await repairPartRepo.save([
    {
      exceptionOrderId: exceptions[0].id,
      partName: '餐边柜',
      partModel: 'CB-008',
      quantity: 2,
      cost: 7600,
      status: RepairPartStatus.ORDERED,
      reason: '生产排期延迟，缺货',
      expectedDeliveryDate: addDays(today, 7),
    },
    {
      exceptionOrderId: exceptions[0].id,
      partName: '电视柜',
      partModel: 'TV-002',
      quantity: 3,
      cost: 13500,
      status: RepairPartStatus.ORDERED,
      reason: '生产排期延迟，缺货',
      expectedDeliveryDate: addDays(today, 7),
    },
    {
      exceptionOrderId: exceptions[1].id,
      partName: '沙发修复套装',
      quantity: 1,
      cost: 200,
      status: RepairPartStatus.APPROVED,
      reason: '划痕修复材料',
    },
    {
      exceptionOrderId: exceptions[3].id,
      productId: products[3].id,
      partName: '抽屉导轨',
      quantity: 4,
      cost: 400,
      status: RepairPartStatus.RECEIVED,
      reason: '抽屉布局调整需要',
      actualDeliveryDate: addDays(today, -1),
    },
  ]);
  console.log('插入补件数据完成');

  await sampleLoanRepo.save([
    {
      orderId: orders[2].id,
      customerName: '王总',
      customerPhone: '13800138003',
      productId: products[2].id,
      productName: '人体工学办公椅',
      quantity: 2,
      borrowDate: formatDate(addDays(today, -15)),
      expectedReturnDate: formatDate(addDays(today, -8)),
      purpose: '客户选型体验，确认舒适度',
      conditionOnBorrow: '全新样品，无损坏',
      depositAmount: 500,
      status: SampleLoanStatus.OVERDUE,
      handledBy: '销售顾问-小林',
      reminderCount: 2,
      lastReminderAt: addDays(today, -3),
      followUpNotes: '[提醒 1] 5天前电话提醒，客户说忙完这周还\n[提醒 2] 昨天微信提醒，客户未回复',
    },
    {
      customerName: '陈先生',
      customerPhone: '13800138006',
      productId: products[5].id,
      productName: '真皮床头软包床',
      quantity: 1,
      borrowDate: formatDate(addDays(today, -20)),
      expectedReturnDate: formatDate(addDays(today, -10)),
      purpose: '客户带回家看效果，对比装修风格',
      conditionOnBorrow: '展示样品，正常使用痕迹',
      depositAmount: 1000,
      status: SampleLoanStatus.BORROWED,
      handledBy: '销售顾问-小周',
      reminderCount: 0,
    },
    {
      orderId: orders[4].id,
      customerName: '刘先生',
      customerPhone: '13800138005',
      productId: products[4].id,
      productName: '大理石餐桌',
      quantity: 1,
      borrowDate: formatDate(addDays(today, -30)),
      actualReturnDate: formatDate(addDays(today, -1)),
      purpose: '客户带回家看尺寸是否合适',
      conditionOnBorrow: '展示样品',
      conditionOnReturn: '完好无损',
      depositAmount: 800,
      depositReturned: true,
      status: SampleLoanStatus.RETURNED,
      handledBy: '销售顾问-小林',
      reminderCount: 1,
    },
  ]);
  console.log('插入样品借出数据完成');

  await notificationRepo.save([
    { type: NotificationType.INSTALLATION_REMINDER, priority: NotificationPriority.HIGH, title: '今日安装提醒', content: '李女士家的定制衣柜今日14:00开始安装，请提前确认安装条件', recipientRole: 'coordinator', relatedOrderId: orders[1].id, relatedEntityType: 'installation', relatedEntityId: 2 },
    { type: NotificationType.ACCEPTANCE_PENDING, priority: NotificationPriority.HIGH, title: '待验收提醒', content: '王总办公室的批量订单安装完成，待安排验收', recipientRole: 'manager', relatedOrderId: orders[2].id, relatedEntityType: 'acceptance' },
    { type: NotificationType.EXCEPTION_ALERT, priority: NotificationPriority.URGENT, title: '异常单待处理', content: '王总订单存在样品未归还问题，已逾期5天，请及时跟进', recipientRole: 'sales', relatedOrderId: orders[2].id, relatedEntityType: 'exception', relatedEntityId: 3 },
    { type: NotificationType.SAMPLE_OVERDUE, priority: NotificationPriority.URGENT, title: '样品逾期催还', content: '王总借出的2把办公椅已逾期5天，请联系客户催还', recipientRole: 'sales', relatedEntityType: 'sample', relatedEntityId: 1 },
    { type: NotificationType.REPAIR_PART_UPDATE, priority: NotificationPriority.MEDIUM, title: '补件状态更新', content: '餐边柜和电视柜已下单生产，预计7天后到货', recipientRole: 'coordinator', relatedOrderId: orders[2].id, relatedEntityType: 'repair_part' },
    { type: NotificationType.ORDER_STATUS_CHANGE, priority: NotificationPriority.MEDIUM, title: '订单状态更新', content: '陈小姐的订单已到货，请及时安排安装预约', recipientRole: 'coordinator', relatedOrderId: orders[3].id },
    { type: NotificationType.TASK_ASSIGNMENT, priority: NotificationPriority.HIGH, title: '新任务指派', content: '展厅经理-王姐指派你负责王总订单的售后跟进', recipientRole: 'coordinator', recipientName: '安装协调-张工', relatedOrderId: orders[2].id },
    { type: NotificationType.CUSTOMER_FOLLOWUP, priority: NotificationPriority.LOW, title: '客户回访提醒', content: '张先生的订单已完成7天，可安排回访了解使用情况', recipientRole: 'sales', relatedOrderId: orders[0].id },
    { type: NotificationType.EXCEPTION_ALERT, priority: NotificationPriority.HIGH, title: '定制配置问题', content: '李女士家的衣柜抽屉布局与设计图有出入，需设计师上门确认', recipientRole: 'sales', relatedOrderId: orders[1].id, relatedEntityType: 'exception', relatedEntityId: 4 },
    { type: NotificationType.INSTALLATION_REMINDER, priority: NotificationPriority.MEDIUM, title: '明日安装预约', content: '陈小姐家明天10:00安装，请提前与客户确认', recipientRole: 'coordinator', relatedOrderId: orders[3].id, relatedEntityType: 'installation', relatedEntityId: 4 },
  ]);
  console.log('插入通知数据完成');

  console.log('\n✅ 测试数据插入完成！');
  console.log('\n=== 测试账号 ===');
  console.log('展厅经理: 王姐 / 赵总');
  console.log('销售顾问: 小林 / 小周 / 小吴');
  console.log('安装协调: 张工 / 李工 / 王工');
  console.log('\n=== 测试场景 ===');
  console.log('1. 正常流程 (订单FJ202605200001): 已完成全流程');
  console.log('2. 安装中待验收 (订单FJ202605210002): 正在安装，即将验收');
  console.log('3. 异常订单 (订单FJ202605220003): 含样品未归还、缺件、质量问题');
  console.log('4. 待预约安装 (订单FJ202605230004): 已到货，可预约');
  console.log('5. 样品管理: 2笔借出，其中1笔逾期5天');

  await AppDataSource.destroy();
}

seed().catch(console.error);
