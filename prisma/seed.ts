import { PrismaClient } from '@prisma/client';
import { Role, InquiryStatus, StockLockStatus, ReturnStatus, RefundStatus, ExceptionType, EvidenceType, OperationType } from '../server/types/enums';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始清理旧数据...');
  await prisma.operationLog.deleteMany();
  await prisma.remark.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.stockLockItem.deleteMany();
  await prisma.inquiryItem.deleteMany();
  await prisma.refundOrder.deleteMany();
  await prisma.returnOrder.deleteMany();
  await prisma.stockLock.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.part.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 创建测试用户...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const storeOwner = await prisma.user.create({
    data: {
      username: 'store_owner',
      passwordHash: hashedPassword,
      realName: '张老板',
      role: Role.STORE_OWNER,
      phone: '13800138001',
      storeName: '顺通汽修',
    },
  });

  const sales = await prisma.user.create({
    data: {
      username: 'sales',
      passwordHash: hashedPassword,
      realName: '李销售',
      role: Role.SALES,
      phone: '13800138002',
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      username: 'warehouse',
      passwordHash: hashedPassword,
      realName: '王库管',
      role: Role.WAREHOUSE,
      phone: '13800138003',
    },
  });

  console.log('🔧 创建配件主数据...');
  const partsData = [
    { partCode: 'BP-001', partName: '前刹车片', originalCode: '45022-TBA-A00', brand: '博世', spec: '前轮4片装', unit: '套', unitPrice: 280, stockQuantity: 50, location: 'A-01-01' },
    { partCode: 'BP-002', partName: '后刹车片', originalCode: '43022-TBA-A00', brand: '博世', spec: '后轮4片装', unit: '套', unitPrice: 260, stockQuantity: 45, location: 'A-01-02' },
    { partCode: 'OF-001', partName: '机油滤清器', originalCode: '15400-PLC-004', brand: '曼牌', spec: 'W610/3', unit: '个', unitPrice: 45, stockQuantity: 200, location: 'B-02-01' },
    { partCode: 'AF-001', partName: '空气滤清器', originalCode: '17220-RRB-A00', brand: '曼牌', spec: 'C25118', unit: '个', unitPrice: 65, stockQuantity: 150, location: 'B-02-02' },
    { partCode: 'SP-001', partName: '火花塞', originalCode: '9807B-5615W', brand: 'NGK', spec: 'ILKAR7B11', unit: '支', unitPrice: 85, stockQuantity: 300, location: 'C-03-01' },
    { partCode: 'BT-001', partName: '蓄电池', originalCode: '31500-TBA-A00', brand: '瓦尔塔', spec: '6-QW-60', unit: '个', unitPrice: 580, stockQuantity: 20, location: 'D-04-01' },
    { partCode: 'WI-001', partName: '前雨刮片', originalCode: '76620-TBA-A01', brand: '法雷奥', spec: '26/14寸', unit: '对', unitPrice: 120, stockQuantity: 80, location: 'E-05-01' },
    { partCode: 'EN-001', partName: '发动机机油5W-30', originalCode: '08217-999-04HE', brand: '美孚', spec: '4L 全合成', unit: '桶', unitPrice: 380, stockQuantity: 60, location: 'F-06-01' },
    { partCode: 'TR-001', partName: '变速箱油', originalCode: '08200-9008', brand: '爱信', spec: '4L', unit: '桶', unitPrice: 420, stockQuantity: 30, location: 'F-06-02' },
    { partCode: 'CL-001', partName: '防冻液', originalCode: '09950-60110', brand: '百适通', spec: '4L -37℃', unit: '桶', unitPrice: 150, stockQuantity: 100, location: 'F-06-03' },
  ];

  const parts: Array<{ id: string }> = [];
  for (const part of partsData) {
    const created = await prisma.part.create({ data: part });
    parts.push(created);
  }

  console.log('📋 创建正常流案例...');
  await createNormalFlow1(storeOwner, sales, warehouse, parts);
  await createNormalFlow2(storeOwner, sales, warehouse, parts);
  await createNormalFlow3(storeOwner, sales, warehouse, parts);

  console.log('⚠️  创建问题流案例...');
  await createProblemFlow1_WrongPart(storeOwner, sales, warehouse, parts);
  await createProblemFlow2_NoEvidence(storeOwner, sales, warehouse, parts);
  await createProblemFlow3_PaymentDelay(storeOwner, sales, warehouse, parts);

  console.log('✅ 种子数据创建完成！');
  console.log(`
  ==========================================
  📊 数据统计
  ==========================================
  用户: 3人 (门店老板/销售/库管)
  配件: ${parts.length}种
  询价单: 6单
  锁库单: 6单
  退货单: 6单
  退款单: 6单
  ==========================================
  `);
}

async function createNormalFlow1(storeOwner: any, sales: any, warehouse: any, parts: any[]) {
  const inquiryId = uuidv4();
  const inquiryItemId1 = uuidv4();
  const inquiryItemId2 = uuidv4();
  const stockLockId = uuidv4();
  const stockLockItemId1 = uuidv4();
  const stockLockItemId2 = uuidv4();
  const returnOrderId = uuidv4();
  const returnItemId1 = uuidv4();
  const refundOrderId = uuidv4();
  const logId1 = uuidv4();
  const logId2 = uuidv4();
  const logId3 = uuidv4();
  const logId4 = uuidv4();
  const logId5 = uuidv4();
  const logId6 = uuidv4();
  const logId7 = uuidv4();

  await prisma.inquiry.create({
    data: {
      id: inquiryId,
      inquiryNo: 'XJ202405010001',
      status: InquiryStatus.COMPLETED,
      customerName: '刘先生',
      customerPhone: '13900139001',
      carModel: '本田雅阁 2018款',
      vinNo: 'LHGCV2F4XJ8000001',
      totalAmount: 1110,
      isUrgent: true,
      expectedDate: dayjs().add(1, 'day').toDate(),
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: inquiryItemId1, partId: parts[0].id, partName: '前刹车片', partCode: 'BP-001', quantity: 2, quotedPrice: 280, confirmed: true },
          { id: inquiryItemId2, partId: parts[2].id, partName: '机油滤清器', partCode: 'OF-001', quantity: 5, quotedPrice: 45, confirmed: true, remark: '客户多备几个' },
        ],
      },
      operationLogs: {
        create: [
          { id: logId1, operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建询价单', oldStatus: null, newStatus: InquiryStatus.DRAFT, ipAddress: '127.0.0.1' },
          { id: logId2, operationType: OperationType.SUBMIT, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '提交询价', oldStatus: InquiryStatus.DRAFT, newStatus: InquiryStatus.PENDING, ipAddress: '127.0.0.1' },
          { id: logId3, operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成报价，前刹车片280元/套×2，机油滤45元/个×5，合计1110元', oldStatus: InquiryStatus.PENDING, newStatus: InquiryStatus.QUOTED, ipAddress: '127.0.0.1' },
          { id: logId4, operationType: OperationType.APPROVE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户确认价格无误', oldStatus: InquiryStatus.QUOTED, newStatus: InquiryStatus.CONFIRMED, ipAddress: '127.0.0.1' },
          { id: logId5, operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '交易完成', oldStatus: InquiryStatus.CONFIRMED, newStatus: InquiryStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
      remarks: {
        create: [
          { content: '客户是老客户，价格可以适当优惠', isImportant: true, createdById: storeOwner.id },
          { content: '价格已按老客户优惠，前刹车片原价300，按280结算', isImportant: false, createdById: sales.id },
        ],
      },
    },
  });

  await prisma.stockLock.create({
    data: {
      id: stockLockId,
      lockNo: 'SK202405010001',
      inquiryId,
      status: StockLockStatus.SOLD,
      validUntil: dayjs().add(3, 'day').toDate(),
      warehouseNote: '库存充足，已备货',
      createdById: sales.id,
      handledById: warehouse.id,
      items: {
        create: [
          { id: stockLockItemId1, partId: parts[0].id, partName: '前刹车片', partCode: 'BP-001', quantity: 2, location: 'A-01-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
          { id: stockLockItemId2, partId: parts[2].id, partName: '机油滤清器', partCode: 'OF-001', quantity: 5, location: 'B-02-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: logId6, operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '库管完成锁库核验，货物已配齐', oldStatus: StockLockStatus.PENDING, newStatus: StockLockStatus.LOCKED, ipAddress: '127.0.0.1' },
          { id: logId7, operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '客户已自提，完成出库', oldStatus: StockLockStatus.LOCKED, newStatus: StockLockStatus.SOLD, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.returnOrder.create({
    data: {
      id: returnOrderId,
      returnNo: 'TH202405030001',
      inquiryId,
      status: ReturnStatus.COMPLETED,
      returnReason: '客户车型不对，前刹车片安装孔位不匹配',
      returnDate: dayjs().add(2, 'day').toDate(),
      originalSalesDate: dayjs().toDate(),
      originalAmount: 560,
      applyRefundAmount: 560,
      identifyResult: '确认为型号不匹配，客户未使用，包装完好，支持全额退款',
      identifyDate: dayjs().add(2, 'day').toDate(),
      identifyById: sales.id,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: returnItemId1, partId: parts[0].id, partName: '前刹车片', partCode: 'BP-001', returnQuantity: 2, originalQuantity: 2, unitPrice: 280, subTotal: 560, inspectionResult: '包装完好，未使用', inspected: true, inspectedById: warehouse.id, inspectedAt: dayjs().add(2, 'day').toDate() },
        ],
      },
      evidences: {
        create: [
          { evidenceType: EvidenceType.PHOTO, fileName: '刹车片安装对比.jpg', fileUrl: '/uploads/202405/12345.jpg', fileSize: 2048000, description: '新旧刹车片安装孔位对比照片', uploadedById: storeOwner.id },
          { evidenceType: EvidenceType.RECEIPT, fileName: '销售小票.pdf', fileUrl: '/uploads/202405/12346.pdf', fileSize: 1024000, description: '原始销售小票', uploadedById: storeOwner.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建退货申请，前刹车片2套型号不对', oldStatus: null, newStatus: ReturnStatus.PENDING_IDENTIFY, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.INSPECT, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '库管核验：货物完好，未拆封', oldStatus: ReturnStatus.PENDING_IDENTIFY, newStatus: ReturnStatus.IDENTIFYING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '销售鉴定通过，确认为型号不匹配，全额退款', oldStatus: ReturnStatus.IDENTIFYING, newStatus: ReturnStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '退货流程完成，货物已重新入库', oldStatus: ReturnStatus.APPROVED, newStatus: ReturnStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
      remarks: {
        create: [
          { content: '客户说当时报的是2016款雅阁，实际是2018款，孔位确实不一样', isImportant: false, createdById: storeOwner.id },
        ],
      },
    },
  });

  await prisma.refundOrder.create({
    data: {
      id: refundOrderId,
      refundNo: 'TK202405030001',
      returnOrderId,
      inquiryId,
      status: RefundStatus.COMPLETED,
      refundAmount: 560,
      actualRefundAmount: 560,
      paymentMethod: '微信转账',
      paymentDate: dayjs().add(2, 'day').toDate(),
      paymentTraceNo: 'WX2024050312345678',
      reviewResult: '审核通过，资料齐全，全额退款',
      reviewDate: dayjs().add(2, 'day').toDate(),
      reviewById: sales.id,
      createdById: sales.id,
      handledById: sales.id,
      isCreditCustomer: false,
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '创建退款单，金额560元', oldStatus: null, newStatus: RefundStatus.PENDING_REVIEW, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '复核通过，证据链完整', oldStatus: RefundStatus.PENDING_REVIEW, newStatus: RefundStatus.REVIEWING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '微信转账560元，流水号WX2024050312345678', oldStatus: RefundStatus.REVIEWING, newStatus: RefundStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '客户确认收款，退款完成', oldStatus: RefundStatus.APPROVED, newStatus: RefundStatus.PAID, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '全流程完结', oldStatus: RefundStatus.PAID, newStatus: RefundStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  console.log('  ✅ 正常流1: 型号不匹配退货 → 全额退款');
}

async function createNormalFlow2(storeOwner: any, sales: any, warehouse: any, parts: any[]) {
  const inquiryId = uuidv4();
  const inquiryItemId = uuidv4();
  const stockLockId = uuidv4();
  const stockLockItemId = uuidv4();
  const returnOrderId = uuidv4();
  const returnItemId = uuidv4();
  const refundOrderId = uuidv4();

  await prisma.inquiry.create({
    data: {
      id: inquiryId,
      inquiryNo: 'XJ202405020002',
      status: InquiryStatus.COMPLETED,
      customerName: '王女士',
      customerPhone: '13900139002',
      carModel: '丰田凯美瑞 2020款',
      vinNo: 'LVGBH40K1LG000002',
      totalAmount: 380,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: inquiryItemId, partId: parts[7].id, partName: '发动机机油5W-30', partCode: 'EN-001', quantity: 1, quotedPrice: 380, confirmed: true },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建询价单', oldStatus: null, newStatus: InquiryStatus.DRAFT, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.SUBMIT, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '提交询价', oldStatus: InquiryStatus.DRAFT, newStatus: InquiryStatus.PENDING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成报价', oldStatus: InquiryStatus.PENDING, newStatus: InquiryStatus.QUOTED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户确认', oldStatus: InquiryStatus.QUOTED, newStatus: InquiryStatus.CONFIRMED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '交易完成', oldStatus: InquiryStatus.CONFIRMED, newStatus: InquiryStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.stockLock.create({
    data: {
      id: stockLockId,
      lockNo: 'SK202405020002',
      inquiryId,
      status: StockLockStatus.SOLD,
      validUntil: dayjs().add(3, 'day').toDate(),
      createdById: sales.id,
      handledById: warehouse.id,
      items: {
        create: [
          { id: stockLockItemId, partId: parts[7].id, partName: '发动机机油5W-30', partCode: 'EN-001', quantity: 1, location: 'F-06-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '锁库完成', oldStatus: StockLockStatus.PENDING, newStatus: StockLockStatus.LOCKED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '已出库', oldStatus: StockLockStatus.LOCKED, newStatus: StockLockStatus.SOLD, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.returnOrder.create({
    data: {
      id: returnOrderId,
      returnNo: 'TH202405040002',
      inquiryId,
      status: ReturnStatus.COMPLETED,
      returnReason: '客户买错型号，需要0W-40',
      returnDate: dayjs().add(2, 'day').toDate(),
      originalSalesDate: dayjs().toDate(),
      originalAmount: 380,
      applyRefundAmount: 380,
      identifyResult: '商品未开封，不影响二次销售，同意换货退款',
      identifyDate: dayjs().add(2, 'day').toDate(),
      identifyById: sales.id,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: returnItemId, partId: parts[7].id, partName: '发动机机油5W-30', partCode: 'EN-001', returnQuantity: 1, originalQuantity: 1, unitPrice: 380, subTotal: 380, inspectionResult: '包装完好，塑封未拆', inspected: true, inspectedById: warehouse.id, inspectedAt: dayjs().add(2, 'day').toDate() },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户买错型号，申请退货', oldStatus: null, newStatus: ReturnStatus.PENDING_IDENTIFY, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.INSPECT, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '库管核验：塑封完好，未使用', oldStatus: ReturnStatus.PENDING_IDENTIFY, newStatus: ReturnStatus.IDENTIFYING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '同意退货，客户同时购买0W-40', oldStatus: ReturnStatus.IDENTIFYING, newStatus: ReturnStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '退货完成', oldStatus: ReturnStatus.APPROVED, newStatus: ReturnStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.refundOrder.create({
    data: {
      id: refundOrderId,
      refundNo: 'TK202405040002',
      returnOrderId,
      inquiryId,
      status: RefundStatus.COMPLETED,
      refundAmount: 380,
      actualRefundAmount: 380,
      paymentMethod: '冲抵新购货款',
      paymentDate: dayjs().add(2, 'day').toDate(),
      reviewResult: '审核通过，客户已换购0W-40，此单冲抵',
      reviewDate: dayjs().add(2, 'day').toDate(),
      reviewById: sales.id,
      createdById: sales.id,
      handledById: sales.id,
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '创建退款单', oldStatus: null, newStatus: RefundStatus.PENDING_REVIEW, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '复核通过', oldStatus: RefundStatus.PENDING_REVIEW, newStatus: RefundStatus.REVIEWING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '冲抵新购货款完成', oldStatus: RefundStatus.REVIEWING, newStatus: RefundStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '已确认', oldStatus: RefundStatus.APPROVED, newStatus: RefundStatus.PAID, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成', oldStatus: RefundStatus.PAID, newStatus: RefundStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  console.log('  ✅ 正常流2: 买错型号 → 换货冲抵');
}

async function createNormalFlow3(storeOwner: any, sales: any, warehouse: any, parts: any[]) {
  const inquiryId = uuidv4();
  const inquiryItemId1 = uuidv4();
  const inquiryItemId2 = uuidv4();
  const stockLockId = uuidv4();
  const stockLockItemId1 = uuidv4();
  const stockLockItemId2 = uuidv4();
  const returnOrderId = uuidv4();
  const returnItemId = uuidv4();
  const refundOrderId = uuidv4();

  await prisma.inquiry.create({
    data: {
      id: inquiryId,
      inquiryNo: 'XJ202405030003',
      status: InquiryStatus.COMPLETED,
      customerName: '陈先生',
      customerPhone: '13900139003',
      carModel: '大众迈腾 2019款',
      vinNo: 'LFV3A23C9K3000003',
      totalAmount: 570,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: inquiryItemId1, partId: parts[4].id, partName: '火花塞', partCode: 'SP-001', quantity: 4, quotedPrice: 85, confirmed: true },
          { id: inquiryItemId2, partId: parts[3].id, partName: '空气滤清器', partCode: 'AF-001', quantity: 2, quotedPrice: 65, confirmed: true },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建询价', oldStatus: null, newStatus: InquiryStatus.DRAFT, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.SUBMIT, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '提交', oldStatus: InquiryStatus.DRAFT, newStatus: InquiryStatus.PENDING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '报价完成', oldStatus: InquiryStatus.PENDING, newStatus: InquiryStatus.QUOTED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '确认', oldStatus: InquiryStatus.QUOTED, newStatus: InquiryStatus.CONFIRMED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成', oldStatus: InquiryStatus.CONFIRMED, newStatus: InquiryStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.stockLock.create({
    data: {
      id: stockLockId,
      lockNo: 'SK202405030003',
      inquiryId,
      status: StockLockStatus.SOLD,
      createdById: sales.id,
      handledById: warehouse.id,
      items: {
        create: [
          { id: stockLockItemId1, partId: parts[4].id, partName: '火花塞', partCode: 'SP-001', quantity: 4, location: 'C-03-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
          { id: stockLockItemId2, partId: parts[3].id, partName: '空气滤清器', partCode: 'AF-001', quantity: 2, location: 'B-02-02', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '锁库', oldStatus: StockLockStatus.PENDING, newStatus: StockLockStatus.LOCKED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '出库', oldStatus: StockLockStatus.LOCKED, newStatus: StockLockStatus.SOLD, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.returnOrder.create({
    data: {
      id: returnOrderId,
      returnNo: 'TH202405050003',
      inquiryId,
      status: ReturnStatus.COMPLETED,
      returnReason: '空气滤清器其中一个包装盒有压损，客户要求退一个',
      returnDate: dayjs().add(2, 'day').toDate(),
      originalSalesDate: dayjs().toDate(),
      originalAmount: 130,
      applyRefundAmount: 65,
      identifyResult: '确认为出库前包装已有压损，同意退一个',
      identifyDate: dayjs().add(2, 'day').toDate(),
      identifyById: sales.id,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: returnItemId, partId: parts[3].id, partName: '空气滤清器', partCode: 'AF-001', returnQuantity: 1, originalQuantity: 2, unitPrice: 65, subTotal: 65, inspectionResult: '包装盒有明显压痕，内物完好', inspected: true, inspectedById: warehouse.id, inspectedAt: dayjs().add(2, 'day').toDate() },
        ],
      },
      evidences: {
        create: [
          { evidenceType: EvidenceType.PHOTO, fileName: '包装压损.jpg', fileUrl: '/uploads/202405/23456.jpg', fileSize: 1500000, description: '空气滤清器包装盒压损照片', uploadedById: storeOwner.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建部分退货申请', oldStatus: null, newStatus: ReturnStatus.PENDING_IDENTIFY, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.INSPECT, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '核验确认包装压损', oldStatus: ReturnStatus.PENDING_IDENTIFY, newStatus: ReturnStatus.IDENTIFYING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '同意退一个', oldStatus: ReturnStatus.IDENTIFYING, newStatus: ReturnStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成', oldStatus: ReturnStatus.APPROVED, newStatus: ReturnStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.refundOrder.create({
    data: {
      id: refundOrderId,
      refundNo: 'TK202405050003',
      returnOrderId,
      inquiryId,
      status: RefundStatus.COMPLETED,
      refundAmount: 65,
      actualRefundAmount: 65,
      paymentMethod: '支付宝转账',
      paymentDate: dayjs().add(2, 'day').toDate(),
      paymentTraceNo: 'ALIPAY20240505123456',
      reviewResult: '审核通过，部分退款',
      reviewDate: dayjs().add(2, 'day').toDate(),
      reviewById: sales.id,
      createdById: sales.id,
      handledById: sales.id,
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '创建退款单65元', oldStatus: null, newStatus: RefundStatus.PENDING_REVIEW, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '复核通过', oldStatus: RefundStatus.PENDING_REVIEW, newStatus: RefundStatus.REVIEWING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '支付宝转账完成', oldStatus: RefundStatus.REVIEWING, newStatus: RefundStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '客户确认', oldStatus: RefundStatus.APPROVED, newStatus: RefundStatus.PAID, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成', oldStatus: RefundStatus.PAID, newStatus: RefundStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  console.log('  ✅ 正常流3: 包装损坏 → 部分退货退款');
}

async function createProblemFlow1_WrongPart(storeOwner: any, sales: any, warehouse: any, parts: any[]) {
  const inquiryId = uuidv4();
  const inquiryItemId = uuidv4();
  const stockLockId = uuidv4();
  const stockLockItemId = uuidv4();
  const returnOrderId = uuidv4();
  const returnItemId = uuidv4();
  const refundOrderId = uuidv4();

  await prisma.inquiry.create({
    data: {
      id: inquiryId,
      inquiryNo: 'XJ202405040004',
      status: InquiryStatus.CONFIRMED,
      customerName: '赵先生',
      customerPhone: '13900139004',
      carModel: '日产天籁 2021款',
      vinNo: 'LGBF5AE08M1000004',
      totalAmount: 120,
      createdById: storeOwner.id,
      handledById: sales.id,
      hasException: true,
      exceptionType: ExceptionType.WRONG_PART,
      exceptionNote: '销售时型号报错，客户要的是16/24寸，发的是26/14寸',
      items: {
        create: [
          { id: inquiryItemId, partId: parts[6].id, partName: '前雨刮片', partCode: 'WI-001', quantity: 2, quotedPrice: 120, confirmed: true, remark: '注意：客户说车型是天籁2021，但发的是雅阁的尺寸' },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建询价', oldStatus: null, newStatus: InquiryStatus.DRAFT, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.SUBMIT, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '提交', oldStatus: InquiryStatus.DRAFT, newStatus: InquiryStatus.PENDING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '报价完成（注意：这里销售报错了型号）', oldStatus: InquiryStatus.PENDING, newStatus: InquiryStatus.QUOTED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户确认（客户不懂型号，只看外观）', oldStatus: InquiryStatus.QUOTED, newStatus: InquiryStatus.CONFIRMED, ipAddress: '127.0.0.1' },
        ],
      },
      remarks: {
        create: [
          { content: '【异常标记】此单存在型号报错问题，正在处理中', isImportant: true, createdById: sales.id },
        ],
      },
    },
  });

  await prisma.stockLock.create({
    data: {
      id: stockLockId,
      lockNo: 'SK202405040004',
      inquiryId,
      status: StockLockStatus.SOLD,
      createdById: sales.id,
      handledById: warehouse.id,
      items: {
        create: [
          { id: stockLockItemId, partId: parts[6].id, partName: '前雨刮片', partCode: 'WI-001', quantity: 2, location: 'E-05-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '锁库发货', oldStatus: StockLockStatus.PENDING, newStatus: StockLockStatus.LOCKED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '已出库', oldStatus: StockLockStatus.LOCKED, newStatus: StockLockStatus.SOLD, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.returnOrder.create({
    data: {
      id: returnOrderId,
      returnNo: 'TH202405060004',
      inquiryId,
      status: ReturnStatus.REWORK,
      returnReason: '雨刮片装不上，长短不对',
      returnDate: dayjs().add(2, 'day').toDate(),
      originalSalesDate: dayjs().toDate(),
      originalAmount: 240,
      applyRefundAmount: 240,
      reworkNote: '客户提供的照片不足以确认是我方发错货，要求客户补充：1. 原车雨刮尺寸照片 2. 聊天记录截图',
      createdById: storeOwner.id,
      handledById: sales.id,
      hasException: true,
      exceptionType: ExceptionType.WRONG_PART,
      exceptionNote: '型号报错纠纷，已要求客户补证',
      items: {
        create: [
          { id: returnItemId, partId: parts[6].id, partName: '前雨刮片', partCode: 'WI-001', returnQuantity: 2, originalQuantity: 2, unitPrice: 120, subTotal: 240, inspectionResult: '客户说尺寸不对，但无法提供原车尺寸照片', inspected: false },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户反馈装不上，申请退货', oldStatus: null, newStatus: ReturnStatus.PENDING_IDENTIFY, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.INSPECT, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '库管已核验发出的是WI-001（26/14寸），但客户说需要24/16寸', oldStatus: ReturnStatus.PENDING_IDENTIFY, newStatus: ReturnStatus.IDENTIFYING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.REWORK, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '【退回补录】现有证据不足，需客户提供原车尺寸照片和当时的聊天记录', oldStatus: ReturnStatus.IDENTIFYING, newStatus: ReturnStatus.REWORK, ipAddress: '127.0.0.1' },
        ],
      },
      remarks: {
        create: [
          { content: '客户坚称当时报的是2021款天籁，我们查了系统，天籁2021确实是26/14寸，但客户说他的车是24/16寸。可能是客户车型年款记错了。', isImportant: true, createdById: sales.id },
          { content: '已电话联系客户，让他量一下原车雨刮片长度拍照发过来', isImportant: false, createdById: storeOwner.id },
        ],
      },
    },
  });

  await prisma.refundOrder.create({
    data: {
      id: refundOrderId,
      refundNo: 'TK202405060004',
      returnOrderId,
      inquiryId,
      status: RefundStatus.PENDING_REVIEW,
      refundAmount: 240,
      createdById: sales.id,
      hasException: true,
      exceptionType: ExceptionType.WRONG_PART,
      exceptionNote: '等待退货鉴定结果',
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '预创建退款单，等待鉴定结果', oldStatus: null, newStatus: RefundStatus.PENDING_REVIEW, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  console.log('  ⚠️  问题流1: 型号报错纠纷 → 退回补证（进行中）');
}

async function createProblemFlow2_NoEvidence(storeOwner: any, sales: any, warehouse: any, parts: any[]) {
  const inquiryId = uuidv4();
  const inquiryItemId = uuidv4();
  const stockLockId = uuidv4();
  const stockLockItemId = uuidv4();
  const returnOrderId = uuidv4();
  const returnItemId = uuidv4();

  await prisma.inquiry.create({
    data: {
      id: inquiryId,
      inquiryNo: 'XJ202405050005',
      status: InquiryStatus.COMPLETED,
      customerName: '孙先生',
      customerPhone: '13900139005',
      carModel: '奥迪A4L 2020款',
      vinNo: 'LFV3A24F5L3000005',
      totalAmount: 580,
      createdById: storeOwner.id,
      handledById: sales.id,
      hasException: true,
      exceptionType: ExceptionType.NO_EVIDENCE,
      exceptionNote: '客户说电池漏液，但拿不出任何证据，只有口头描述',
      items: {
        create: [
          { id: inquiryItemId, partId: parts[5].id, partName: '蓄电池', partCode: 'BT-001', quantity: 1, quotedPrice: 580, confirmed: true },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建询价', oldStatus: null, newStatus: InquiryStatus.DRAFT, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.SUBMIT, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '提交', oldStatus: InquiryStatus.DRAFT, newStatus: InquiryStatus.PENDING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '报价完成', oldStatus: InquiryStatus.PENDING, newStatus: InquiryStatus.QUOTED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '确认', oldStatus: InquiryStatus.QUOTED, newStatus: InquiryStatus.CONFIRMED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '完成', oldStatus: InquiryStatus.CONFIRMED, newStatus: InquiryStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.stockLock.create({
    data: {
      id: stockLockId,
      lockNo: 'SK202405050005',
      inquiryId,
      status: StockLockStatus.SOLD,
      createdById: sales.id,
      handledById: warehouse.id,
      items: {
        create: [
          { id: stockLockItemId, partId: parts[5].id, partName: '蓄电池', partCode: 'BT-001', quantity: 1, location: 'D-04-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '锁库发货，出货时检测电压正常12.6V', oldStatus: StockLockStatus.PENDING, newStatus: StockLockStatus.LOCKED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '客户自提，已签字确认', oldStatus: StockLockStatus.LOCKED, newStatus: StockLockStatus.SOLD, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.returnOrder.create({
    data: {
      id: returnOrderId,
      returnNo: 'TH202405070005',
      inquiryId,
      status: ReturnStatus.REJECTED,
      returnReason: '客户说用了3天就漏液，要求全额退款',
      returnDate: dayjs().add(2, 'day').toDate(),
      originalSalesDate: dayjs().toDate(),
      originalAmount: 580,
      applyRefundAmount: 580,
      rejectReason: '【退货判定无据】驳回原因：1. 客户无法提供漏液照片/视频；2. 客户已自行安装，无法确认是否因安装不当导致；3. 出库检测记录显示电压正常。建议客户联系厂家做质量检测。',
      identifyDate: dayjs().add(2, 'day').toDate(),
      identifyById: sales.id,
      createdById: storeOwner.id,
      handledById: sales.id,
      hasException: true,
      exceptionType: ExceptionType.NO_EVIDENCE,
      exceptionNote: '已驳回，客户正在投诉中',
      items: {
        create: [
          { id: returnItemId, partId: parts[5].id, partName: '蓄电池', partCode: 'BT-001', returnQuantity: 1, originalQuantity: 1, unitPrice: 580, subTotal: 580, inspectionResult: '客户未将货物退回门店，仅口头描述问题', inspected: false },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户电话投诉漏液，要求退款', oldStatus: null, newStatus: ReturnStatus.PENDING_IDENTIFY, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.INSPECT, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '库管：出库时有检测记录，电压12.6V正常。客户未将电池带回，无法核验', oldStatus: ReturnStatus.PENDING_IDENTIFY, newStatus: ReturnStatus.IDENTIFYING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.REJECT, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '【驳回】证据不足，已告知客户需提供照片并将电池带回检测。客户不接受，说要打12315。', oldStatus: ReturnStatus.IDENTIFYING, newStatus: ReturnStatus.REJECTED, ipAddress: '127.0.0.1' },
        ],
      },
      remarks: {
        create: [
          { content: '【重要】客户态度强硬，说认识工商局的人。已报备店长。', isImportant: true, createdById: sales.id },
          { content: '出库单编号：CK20240505001，检测人：王库管，电压12.6V，有签字。', isImportant: true, createdById: warehouse.id },
          { content: '已联系瓦尔塔区域经理，建议走厂家售后流程，需要客户把电池拿到检测点。', isImportant: false, createdById: sales.id },
        ],
      },
      evidences: {
        create: [
          { evidenceType: EvidenceType.INSPECTION_REPORT, fileName: '出库检测记录.pdf', fileUrl: '/uploads/202405/34567.pdf', fileSize: 512000, description: '蓄电池出库检测记录，电压12.6V', uploadedById: warehouse.id },
        ],
      },
    },
  });

  console.log('  ⚠️  问题流2: 退货无据 → 驳回（客户投诉中）');
}

async function createProblemFlow3_PaymentDelay(storeOwner: any, sales: any, warehouse: any, parts: any[]) {
  const inquiryId = uuidv4();
  const inquiryItemId1 = uuidv4();
  const inquiryItemId2 = uuidv4();
  const inquiryItemId3 = uuidv4();
  const stockLockId = uuidv4();
  const returnOrderId = uuidv4();
  const refundOrderId = uuidv4();

  await prisma.inquiry.create({
    data: {
      id: inquiryId,
      inquiryNo: 'XJ202405060006',
      status: InquiryStatus.COMPLETED,
      customerName: '【账期客户】鸿运汽修',
      customerPhone: '13900139006',
      carModel: '多车型',
      vinNo: '月结客户',
      totalAmount: 15680,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: inquiryItemId1, partId: parts[0].id, partName: '前刹车片', partCode: 'BP-001', quantity: 20, quotedPrice: 280, confirmed: true },
          { id: inquiryItemId2, partId: parts[2].id, partName: '机油滤清器', partCode: 'OF-001', quantity: 50, quotedPrice: 45, confirmed: true },
          { id: inquiryItemId3, partId: parts[7].id, partName: '发动机机油5W-30', partCode: 'EN-001', quantity: 15, quotedPrice: 380, confirmed: true },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '创建月结客户大单', oldStatus: null, newStatus: InquiryStatus.DRAFT, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.SUBMIT, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '提交', oldStatus: InquiryStatus.DRAFT, newStatus: InquiryStatus.PENDING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '报价完成，已给月结客户优惠价', oldStatus: InquiryStatus.PENDING, newStatus: InquiryStatus.QUOTED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '确认，账期30天', oldStatus: InquiryStatus.QUOTED, newStatus: InquiryStatus.CONFIRMED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '发货完成', oldStatus: InquiryStatus.CONFIRMED, newStatus: InquiryStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.stockLock.create({
    data: {
      id: stockLockId,
      lockNo: 'SK202405060006',
      inquiryId,
      status: StockLockStatus.SOLD,
      createdById: sales.id,
      handledById: warehouse.id,
      items: {
        create: [
          { id: uuidv4(), partId: parts[0].id, partName: '前刹车片', partCode: 'BP-001', quantity: 20, location: 'A-01-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
          { id: uuidv4(), partId: parts[2].id, partName: '机油滤清器', partCode: 'OF-001', quantity: 50, location: 'B-02-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
          { id: uuidv4(), partId: parts[7].id, partName: '发动机机油5W-30', partCode: 'EN-001', quantity: 15, location: 'F-06-01', checked: true, checkedAt: dayjs().toDate(), checkedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '大宗备货完成', oldStatus: StockLockStatus.PENDING, newStatus: StockLockStatus.LOCKED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.LOCK, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '配送上门，客户签收', oldStatus: StockLockStatus.LOCKED, newStatus: StockLockStatus.SOLD, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.returnOrder.create({
    data: {
      id: returnOrderId,
      returnNo: 'TH202405150006',
      inquiryId,
      status: ReturnStatus.COMPLETED,
      returnReason: '部分机油运输途中外包装破损，客户拒收5桶',
      returnDate: dayjs().add(9, 'day').toDate(),
      originalSalesDate: dayjs().toDate(),
      originalAmount: 5700,
      applyRefundAmount: 1900,
      identifyResult: '确认为运输破损，客户实际签收10桶，破损5桶退回。由物流承担损失。',
      identifyDate: dayjs().add(9, 'day').toDate(),
      identifyById: sales.id,
      createdById: storeOwner.id,
      handledById: sales.id,
      items: {
        create: [
          { id: uuidv4(), partId: parts[7].id, partName: '发动机机油5W-30', partCode: 'EN-001', returnQuantity: 5, originalQuantity: 15, unitPrice: 380, subTotal: 1900, inspectionResult: '5桶外包装破损，内桶漏液约10%，物流已签字确认', inspected: true, inspectedById: warehouse.id, inspectedAt: dayjs().add(9, 'day').toDate() },
        ],
      },
      evidences: {
        create: [
          { evidenceType: EvidenceType.PHOTO, fileName: '运输破损.jpg', fileUrl: '/uploads/202405/45678.jpg', fileSize: 3000000, description: '机油桶破损漏液照片', uploadedById: storeOwner.id },
          { evidenceType: EvidenceType.RECEIPT, fileName: '物流破损单.jpg', fileUrl: '/uploads/202405/45679.jpg', fileSize: 1024000, description: '物流司机签字确认的破损单', uploadedById: warehouse.id },
        ],
      },
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: storeOwner.id, operatorName: storeOwner.realName, operatorRole: storeOwner.role, detail: '客户反馈5桶机油破损拒收', oldStatus: null, newStatus: ReturnStatus.PENDING_IDENTIFY, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.INSPECT, operatorId: warehouse.id, operatorName: warehouse.realName, operatorRole: warehouse.role, detail: '库管核验：确实5桶破损，物流已确认', oldStatus: ReturnStatus.PENDING_IDENTIFY, newStatus: ReturnStatus.IDENTIFYING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '销售鉴定通过，物流承担损失，全额退款', oldStatus: ReturnStatus.IDENTIFYING, newStatus: ReturnStatus.APPROVED, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '退货完成，破损品退回厂家', oldStatus: ReturnStatus.APPROVED, newStatus: ReturnStatus.COMPLETED, ipAddress: '127.0.0.1' },
        ],
      },
    },
  });

  await prisma.refundOrder.create({
    data: {
      id: refundOrderId,
      refundNo: 'TK202405150006',
      returnOrderId,
      inquiryId,
      status: RefundStatus.FAILED,
      refundAmount: 1900,
      reviewResult: '审核通过，账期客户，月底统一结算',
      reviewDate: dayjs().add(9, 'day').toDate(),
      reviewById: sales.id,
      createdById: sales.id,
      handledById: sales.id,
      isCreditCustomer: true,
      dueDate: dayjs().add(30, 'day').toDate(),
      hasDelay: true,
      delayDays: 15,
      hasException: true,
      exceptionType: ExceptionType.PAYMENT_DELAY,
      exceptionNote: '【账期拖欠】鸿运汽修已超账期15天，累计欠款28650元，此笔退款需财务审批后从欠款中抵扣',
      operationLogs: {
        create: [
          { id: uuidv4(), operationType: OperationType.CREATE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '创建退款单1900元，账期客户', oldStatus: null, newStatus: RefundStatus.PENDING_REVIEW, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.APPROVE, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '复核通过，月底从月结款中抵扣', oldStatus: RefundStatus.PENDING_REVIEW, newStatus: RefundStatus.REVIEWING, ipAddress: '127.0.0.1' },
          { id: uuidv4(), operationType: OperationType.PAY, operatorId: sales.id, operatorName: sales.realName, operatorRole: sales.role, detail: '【打款失败】客户账户已被冻结，原因：欠款逾期超15天，需财务审批', oldStatus: RefundStatus.REVIEWING, newStatus: RefundStatus.FAILED, ipAddress: '127.0.0.1' },
        ],
      },
      remarks: {
        create: [
          { content: '【重要】鸿运汽修已超账期15天，累计欠款28650元，含此单共12笔未结。已暂停供货，催款中。', isImportant: true, createdById: sales.id },
          { content: '采购经理已去客户现场沟通，预计下周三能回款', isImportant: false, createdById: storeOwner.id },
          { content: '财务意见：此笔1900元退款不能直接打款，需等客户回款后从欠款中抵扣。已报备老板。', isImportant: true, createdById: sales.id },
        ],
      },
    },
  });

  console.log('  ⚠️  问题流3: 账期客户回款拖欠 → 打款失败（催款中）');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });