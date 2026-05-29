import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始生成演示数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.createMany({
    data: [
      { username: 'admin', password: hashedPassword, name: '系统管理员', role: 'ADMIN', email: 'admin@example.com', phone: '13800138000' },
      { username: 'coordinator', password: hashedPassword, name: '张明', role: 'PROJECT_COORDINATOR', email: 'zhangming@example.com', phone: '13800138001' },
      { username: 'executive', password: hashedPassword, name: '李华', role: 'SITE_EXECUTIVE', email: 'lihua@example.com', phone: '13800138002' },
      { username: 'supplier', password: hashedPassword, name: '王芳', role: 'SUPPLIER_CONTACT', email: 'wangfang@example.com', phone: '13800138003' },
      { username: 'finance', password: hashedPassword, name: '赵雪', role: 'FINANCE', email: 'zhaoxue@example.com', phone: '13800138004' },
    ],
  });

  const createdUsers = await prisma.user.findMany();
  console.log(`创建了 ${createdUsers.length} 个用户`);

  await prisma.supplier.createMany({
    data: [
      { name: '盛世展览设计有限公司', contact: '刘经理', phone: '13900139001', email: 'liu@sszl.com', address: '北京市朝阳区展览路88号', bankName: '招商银行北京分行', bankAccount: '6226090012345678', taxNumber: '91110000MA001ABC12' },
      { name: '创意搭建工程有限公司', contact: '陈总', phone: '13900139002', email: 'chen@creative.com', address: '上海市浦东新区建设大道66号', bankName: '工商银行上海分行', bankAccount: '6222020012345678', taxNumber: '91310000MA002DEF34' },
      { name: '金牌物料供应中心', contact: '周主管', phone: '13900139003', email: 'zhou@goldmaterial.com', address: '广州市白云区工业园', bankName: '建设银行广州分行', bankAccount: '6227000012345678', taxNumber: '91440000MA003GHI56' },
    ],
  });

  const createdSuppliers = await prisma.supplier.findMany();
  console.log(`创建了 ${createdSuppliers.length} 个供应商`);

  const adminUser = createdUsers.find(u => u.username === 'admin')!;
  const coordinatorUser = createdUsers.find(u => u.username === 'coordinator')!;
  const executiveUser = createdUsers.find(u => u.username === 'executive')!;
  const financeUser = createdUsers.find(u => u.username === 'finance')!;

  await prisma.project.createMany({
    data: [
      {
        code: 'XM202405001', name: '2024上海国际汽车展', description: '上海国家会展中心大型车展项目', location: '上海国家会展中心',
        startDate: new Date('2024-06-15'), endDate: new Date('2024-06-25'), status: 'ON_SITE', budget: 500000, creatorId: coordinatorUser.id,
      },
      {
        code: 'XM202405002', name: '北京科技博览会', description: '北京国际展览中心科技展', location: '北京国际展览中心',
        startDate: new Date('2024-07-10'), endDate: new Date('2024-07-20'), status: 'PREPARATION', budget: 350000, creatorId: coordinatorUser.id,
      },
      {
        code: 'XM202405003', name: '深圳智能家居展', description: '深圳会展中心智能家居专题展', location: '深圳会展中心',
        startDate: new Date('2024-05-01'), endDate: new Date('2024-05-10'), status: 'COMPLETED', budget: 280000, creatorId: adminUser.id,
      },
    ],
  });

  const createdProjects = await prisma.project.findMany();
  console.log(`创建了 ${createdProjects.length} 个项目`);

  const supplier1 = createdSuppliers[0];
  const supplier2 = createdSuppliers[1];
  const supplier3 = createdSuppliers[2];

  await prisma.projectSupplier.createMany({
    data: [
      { projectId: createdProjects[0].id, supplierId: supplier1.id, contractAmount: 200000, scope: '展台设计与搭建' },
      { projectId: createdProjects[0].id, supplierId: supplier3.id, contractAmount: 80000, scope: '物料供应' },
      { projectId: createdProjects[1].id, supplierId: supplier2.id, contractAmount: 150000, scope: '展台搭建' },
      { projectId: createdProjects[2].id, supplierId: supplier1.id, contractAmount: 120000, scope: '设计与搭建' },
    ],
  });
  console.log('创建了项目供应商关联');

  await prisma.materialItem.createMany({
    data: [
      { projectId: createdProjects[0].id, supplierId: supplier3.id, name: '铝型材展架', specification: '40x40mm', quantity: 50, unitPrice: 120, version: 'v1', isConfirmed: true, confirmedAt: new Date() },
      { projectId: createdProjects[0].id, supplierId: supplier3.id, name: '发光字LOGO', specification: '亚克力LED', quantity: 1, unitPrice: 8500, version: 'v2', isConfirmed: true, confirmedAt: new Date() },
      { projectId: createdProjects[0].id, supplierId: supplier3.id, name: '地毯铺设', specification: '防火地毯', quantity: 200, unitPrice: 85, version: 'v1', isConfirmed: false },
      { projectId: createdProjects[1].id, supplierId: supplier2.id, name: '接待台', specification: '烤漆+LED灯带', quantity: 1, unitPrice: 12000, version: 'v1', isConfirmed: true, confirmedAt: new Date() },
      { projectId: createdProjects[1].id, supplierId: supplier2.id, name: '展示柜', specification: '玻璃+金属', quantity: 10, unitPrice: 3500, version: 'v1', isConfirmed: true, confirmedAt: new Date() },
    ],
  });
  console.log('创建了物料清单');

  const project1 = createdProjects[0];
  const project3 = createdProjects[2];

  const reconciliation1 = await prisma.reconciliation.create({
    data: {
      code: 'DZ202405001',
      projectId: project3.id,
      supplierId: supplier1.id,
      title: '深圳智能家居展-设计搭建款',
      description: '展台设计与搭建费用结算',
      status: 'APPROVED',
      totalAmount: 120000,
      confirmedAmount: 118000,
      creatorId: coordinatorUser.id,
      submittedAt: new Date('2024-05-12'),
      approvedAt: new Date('2024-05-15'),
      items: {
        create: [
          { description: '展台设计费', quantity: 1, unitPrice: 30000, amount: 30000, remark: '含3D效果图' },
          { description: '展台搭建施工', quantity: 1, unitPrice: 90000, amount: 88000, remark: '因现场调整扣减2000' },
        ],
      },
    },
  });
  console.log('创建对账单1');

  const reconciliation2 = await prisma.reconciliation.create({
    data: {
      code: 'DZ202405002',
      projectId: project1.id,
      supplierId: supplier1.id,
      title: '上海车展-一期进度款',
      description: '展台设计与搭建进度款50%',
      status: 'SUBMITTED',
      totalAmount: 100000,
      creatorId: executiveUser.id,
      submittedAt: new Date(),
      items: {
        create: [
          { description: '展台设计费', quantity: 1, unitPrice: 50000, amount: 50000, remark: '设计定稿' },
          { description: '材料预付款', quantity: 1, unitPrice: 50000, amount: 50000, remark: '主材到场' },
        ],
      },
    },
  });
  console.log('创建对账单2');

  const reconciliation3 = await prisma.reconciliation.create({
    data: {
      code: 'DZ202405003',
      projectId: project1.id,
      supplierId: supplier3.id,
      title: '上海车展-物料供应款',
      description: '物料费用结算',
      status: 'REVISED',
      totalAmount: 65000,
      creatorId: executiveUser.id,
      submittedAt: new Date('2024-05-20'),
      reviseNote: '物料数量需要重新核对，地毯数量有出入',
      items: {
        create: [
          { description: '铝型材展架', quantity: 50, unitPrice: 120, amount: 6000 },
          { description: '发光字LOGO', quantity: 1, unitPrice: 8500, amount: 8500, remark: '亚克力LED' },
          { description: '地毯铺设', quantity: 200, unitPrice: 85, amount: 17000, remark: '防火地毯' },
          { description: '其他杂项', quantity: 1, unitPrice: 33500, amount: 33500 },
        ],
      },
    },
  });
  console.log('创建对账单3');

  await prisma.payment.create({
    data: {
      code: 'FK202405001',
      reconciliationId: reconciliation1.id,
      projectId: project3.id,
      title: '深圳展-设计搭建款',
      description: '对账单审批通过后付款',
      amount: 118000,
      status: 'PAID',
      payMethod: '银行转账',
      payDate: new Date('2024-05-18'),
      creatorId: financeUser.id,
      approvedAt: new Date('2024-05-16'),
    },
  });
  console.log('创建付款单1');

  await prisma.payment.create({
    data: {
      code: 'FK202405002',
      reconciliationId: reconciliation2.id,
      projectId: project1.id,
      title: '上海车展-预付款',
      description: '项目启动预付款',
      amount: 50000,
      status: 'PENDING',
      payMethod: '银行转账',
      creatorId: coordinatorUser.id,
    },
  });
  console.log('创建付款单2');

  await prisma.document.createMany({
    data: [
      { projectId: project1.id, type: 'ENTRY_PERMIT', title: '施工人员进场证件办理', description: '所有施工人员进场证件', status: 'IN_PROGRESS', deadline: new Date('2024-06-10'), assigneeId: executiveUser.id },
      { projectId: project1.id, type: 'CONSTRUCTION_PERMIT', title: '展台施工许可证', description: '主场搭建施工许可', status: 'APPROVED', deadline: new Date('2024-06-08'), assigneeId: executiveUser.id, approvedAt: new Date('2024-06-05') },
      { projectId: project1.id, type: 'INSURANCE', title: '工程意外险', description: '施工人员意外险', status: 'NOT_STARTED', deadline: new Date('2024-06-12'), assigneeId: coordinatorUser.id },
    ],
  });
  console.log('创建了证件办理记录');

  await prisma.comment.createMany({
    data: [
      { content: '设计方案已确认，可以开始施工准备', entityType: 'Project', entityId: project1.id, userId: coordinatorUser.id },
      { content: '物料清单已核对，数量正确', entityType: 'Reconciliation', entityId: reconciliation1.id, userId: executiveUser.id },
      { content: '已收到款项，感谢配合', entityType: 'Reconciliation', entityId: reconciliation1.id, userId: adminUser.id },
      { content: '地毯数量需要再确认一下，现场实际用量好像有出入', entityType: 'Reconciliation', entityId: reconciliation3.id, userId: coordinatorUser.id },
      { content: '好的，我重新核对一下物料清单', entityType: 'Reconciliation', entityId: reconciliation3.id, userId: executiveUser.id },
      { content: '这个项目的搭建质量很好，下次继续合作', entityType: 'Project', entityId: project3.id, userId: adminUser.id },
    ],
  });
  console.log('创建了备注信息');

  await prisma.auditLog.createMany({
    data: [
      { action: 'CREATE', entityType: 'Project', entityId: project1.id, operatorId: coordinatorUser.id, remark: '创建上海车展项目' },
      { action: 'UPDATE', entityType: 'Project', entityId: project1.id, fieldName: 'status', oldValue: 'PLANNING', newValue: 'PREPARATION', operatorId: coordinatorUser.id, remark: '项目状态更新为筹备中' },
      { action: 'SUBMIT', entityType: 'Reconciliation', entityId: reconciliation1.id, operatorId: executiveUser.id, remark: '提交对账单' },
      { action: 'APPROVE', entityType: 'Reconciliation', entityId: reconciliation1.id, operatorId: coordinatorUser.id, remark: '审批通过对账单' },
      { action: 'CREATE', entityType: 'Payment', entityId: reconciliation1.id, operatorId: financeUser.id, remark: '创建付款申请' },
      { action: 'APPROVE', entityType: 'Payment', entityId: reconciliation1.id, operatorId: adminUser.id, remark: '审批通过付款' },
      { action: 'COMPLETE', entityType: 'Payment', entityId: reconciliation1.id, operatorId: financeUser.id, remark: '付款完成' },
      { action: 'UPDATE', entityType: 'Project', entityId: project3.id, fieldName: 'status', oldValue: 'TEARDOWN', newValue: 'COMPLETED', operatorId: coordinatorUser.id, remark: '项目结案' },
    ],
  });
  console.log('创建了审计日志');

  console.log('演示数据生成完成！');
  console.log('');
  console.log('=== 测试账号 ===');
  console.log('管理员: admin / 123456');
  console.log('项目统筹: coordinator / 123456');
  console.log('现场执行: executive / 123456');
  console.log('供应商对接: supplier / 123456');
  console.log('财务: finance / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
