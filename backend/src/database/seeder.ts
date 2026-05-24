import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'study_abroad',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('📦 开始填充演示数据...');

  const queryRunner = dataSource.createQueryRunner();

  try {
    const consultants = [
      {
        id: 'consultant-001',
        name: '张主管',
        username: 'zhang.zhuguan',
        role: 'consultant_director',
        phone: '13800000001',
        email: 'zhang.zhuguan@study.com',
      },
      {
        id: 'consultant-002',
        name: '李顾问',
        username: 'li.guwen',
        role: 'consultant',
        phone: '13800000002',
        email: 'li.guwen@study.com',
      },
      {
        id: 'consultant-003',
        name: '王顾问',
        username: 'wang.guwen',
        role: 'consultant',
        phone: '13800000003',
        email: 'wang.guwen@study.com',
      },
      {
        id: 'consultant-004',
        name: '陈文案',
        username: 'chen.wenan',
        role: 'copywriter',
        phone: '13800000004',
        email: 'chen.wenan@study.com',
      },
      {
        id: 'consultant-005',
        name: '刘签证',
        username: 'liu.qianzheng',
        role: 'visa_assistant',
        phone: '13800000005',
        email: 'liu.qianzheng@study.com',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('consultants')
      .values(consultants)
      .orIgnore()
      .execute();
    console.log('✅ 顾问数据已填充');

    const students = [
      {
        id: 'student-001',
        name: '张明',
        englishName: 'Michael Zhang',
        phone: '13900000001',
        email: 'michael@example.com',
        targetCountry: '美国',
        targetSchool: '哈佛大学',
        targetMajor: '计算机科学',
        remarks: '高中GPA 3.9，托福110，SAT 1520',
      },
      {
        id: 'student-002',
        name: '李华',
        englishName: 'Lisa Li',
        phone: '13900000002',
        email: 'lisa@example.com',
        targetCountry: '英国',
        targetSchool: '牛津大学',
        targetMajor: '经济学',
        remarks: '本科在读，意向2025fall',
      },
      {
        id: 'student-003',
        name: '王芳',
        englishName: 'Fiona Wang',
        phone: '13900000003',
        email: 'fiona@example.com',
        targetCountry: '澳大利亚',
        targetSchool: '墨尔本大学',
        targetMajor: '金融学',
        remarks: '已毕业，工作2年',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('students')
      .values(students)
      .orIgnore()
      .execute();
    console.log('✅ 学生数据已填充');

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const workOrders = [
      {
        id: 'workorder-001',
        orderNo: 'WO202505240001',
        title: '张明-美国本科申请',
        description: '哈佛大学计算机科学本科申请全案服务',
        status: 'in_progress',
        studentId: 'student-001',
        currentConsultantId: 'consultant-002',
        expectedDeadline: nextMonth.toISOString().split('T')[0],
        serviceContent: '选校规划、文书指导、申请提交、签证辅导',
        createdBy: 'consultant-001',
        updatedBy: 'consultant-002',
      },
      {
        id: 'workorder-002',
        orderNo: 'WO202505240002',
        title: '李华-英国硕士申请',
        description: '牛津大学经济学硕士申请',
        status: 'refund_negotiating',
        studentId: 'student-002',
        currentConsultantId: 'consultant-003',
        previousConsultantId: 'consultant-002',
        expectedDeadline: nextWeek.toISOString().split('T')[0],
        serviceContent: '选校规划、文书指导、申请提交',
        createdBy: 'consultant-001',
        updatedBy: 'consultant-001',
      },
      {
        id: 'workorder-003',
        orderNo: 'WO202505240003',
        title: '王芳-澳洲硕士申请',
        description: '墨尔本大学金融学硕士申请',
        status: 'transferring',
        studentId: 'student-003',
        currentConsultantId: 'consultant-002',
        expectedDeadline: nextMonth.toISOString().split('T')[0],
        serviceContent: '选校规划、文书指导、签证辅导',
        createdBy: 'consultant-001',
        updatedBy: 'consultant-001',
      },
      {
        id: 'workorder-004',
        orderNo: 'WO202505240004',
        title: '测试工单-已完成',
        description: '用于演示历史记录',
        status: 'completed',
        studentId: 'student-001',
        currentConsultantId: 'consultant-002',
        serviceContent: '测试服务',
        createdBy: 'consultant-001',
        updatedBy: 'consultant-002',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('work_orders')
      .values(workOrders)
      .orIgnore()
      .execute();
    console.log('✅ 工单数据已填充');

    const refunds = [
      {
        id: 'refund-001',
        workOrderId: 'workorder-002',
        requestedAmount: 15000.0,
        approvedAmount: 12000.0,
        reason: '学生决定放弃留学，申请退款。合同约定非校方原因退款80%。',
        negotiationHistory:
          '[2025-05-20] 张主管：家长来电提出退款需求，已记录\n[2025-05-21] 李顾问：与家长沟通，确认退款金额12000元',
        status: 'under_review',
        initiatorId: 'consultant-003',
        reviewerId: 'consultant-001',
        reviewedAt: new Date(),
        createdBy: 'consultant-003',
        updatedBy: 'consultant-001',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('refunds')
      .values(refunds)
      .orIgnore()
      .execute();
    console.log('✅ 退款数据已填充');

    const transfers = [
      {
        id: 'transfer-001',
        workOrderId: 'workorder-003',
        fromConsultantId: 'consultant-003',
        toConsultantId: 'consultant-002',
        handoverContent:
          '1. 学生基本情况：王芳，28岁，本科金融，工作2年\n2. 申请进度：学校选定，文书初稿完成\n3. 家长联系方式：13900000003',
        keyNotes: '家长比较焦虑，需要每周汇报进度',
        pendingItems: '1. 个人陈述修改\n2. 推荐信收集',
        status: 'handover_in_progress',
        initiatorId: 'consultant-001',
        createdBy: 'consultant-001',
        updatedBy: 'consultant-001',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('transfers')
      .values(transfers)
      .orIgnore()
      .execute();
    console.log('✅ 交接数据已填充');

    const materials = [
      {
        id: 'material-001',
        workOrderId: 'workorder-001',
        name: '个人陈述-初稿',
        type: 'academic',
        status: 'needs_revision',
        currentVersion: 2,
        fileUrl: '/files/material-001-v2.pdf',
        description: '哈佛大学CS专业个人陈述',
        deadline: nextWeek.toISOString().split('T')[0],
        ownerId: 'consultant-004',
        createdBy: 'consultant-004',
        updatedBy: 'consultant-001',
      },
      {
        id: 'material-002',
        workOrderId: 'workorder-001',
        name: '存款证明',
        type: 'financial',
        status: 'approved',
        currentVersion: 1,
        fileUrl: '/files/material-002-v1.pdf',
        description: '50万人民币存款证明，有效期6个月',
        ownerId: 'consultant-002',
        createdBy: 'consultant-002',
        updatedBy: 'consultant-001',
      },
      {
        id: 'material-003',
        workOrderId: 'workorder-001',
        name: '托福成绩单',
        type: 'language',
        status: 'submitted',
        currentVersion: 1,
        fileUrl: '/files/material-003-v1.pdf',
        description: '托福110分成绩单',
        deadline: nextWeek.toISOString().split('T')[0],
        ownerId: 'consultant-005',
        createdBy: 'consultant-005',
        updatedBy: 'consultant-005',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('materials')
      .values(materials)
      .orIgnore()
      .execute();
    console.log('✅ 材料数据已填充');

    const materialVersions = [
      {
        id: 'version-001',
        materialId: 'material-001',
        version: 1,
        fileUrl: '/files/material-001-v1.pdf',
        changeLog: '初始版本',
        uploadedBy: 'consultant-004',
      },
      {
        id: 'version-002',
        materialId: 'material-001',
        version: 2,
        fileUrl: '/files/material-001-v2.pdf',
        changeLog: '根据主管意见修改了职业规划部分',
        uploadedBy: 'consultant-004',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('material_versions')
      .values(materialVersions)
      .orIgnore()
      .execute();
    console.log('✅ 材料版本数据已填充');

    const comments = [
      {
        id: 'comment-001',
        workOrderId: 'workorder-001',
        content: '学生背景很好，重点冲刺藤校',
        authorId: 'consultant-001',
        isPrivate: false,
      },
      {
        id: 'comment-002',
        refundId: 'refund-001',
        content: '家长态度强硬，建议按合同执行',
        authorId: 'consultant-001',
        isPrivate: true,
      },
      {
        id: 'comment-003',
        transferId: 'transfer-001',
        content: '请确保交接完成后再签字',
        authorId: 'consultant-001',
        isPrivate: false,
      },
      {
        id: 'comment-004',
        materialId: 'material-001',
        content: '建议增加具体项目经历描述',
        authorId: 'consultant-001',
        isPrivate: false,
      },
      {
        id: 'comment-005',
        workOrderId: 'workorder-002',
        content: '退款申请已收到，正在走流程',
        authorId: 'consultant-003',
        isPrivate: false,
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('comments')
      .values(comments)
      .orIgnore()
      .execute();
    console.log('✅ 备注数据已填充');

    const deadlines = [
      {
        id: 'deadline-001',
        workOrderId: 'workorder-001',
        title: '个人陈述终稿完成',
        description: '完成哈佛CS个人陈述终稿',
        dueDate: nextWeek,
        assigneeId: 'consultant-004',
      },
      {
        id: 'deadline-002',
        workOrderId: 'workorder-001',
        title: '托福成绩送分',
        description: '完成托福成绩送分申请',
        dueDate: nextWeek,
        assigneeId: 'consultant-005',
      },
      {
        id: 'deadline-003',
        workOrderId: 'workorder-002',
        title: '退款审批完成',
        description: '完成退款申请审批',
        dueDate: nextWeek,
        assigneeId: 'consultant-001',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('deadlines')
      .values(deadlines)
      .orIgnore()
      .execute();
    console.log('✅ 截止日数据已填充');

    const auditLogs = [
      {
        id: 'audit-001',
        entityType: 'WorkOrder',
        entityId: 'workorder-001',
        action: 'CREATE',
        newValue: { title: '张明-美国本科申请' },
        operatorId: 'consultant-001',
        operatorName: '张主管',
        remark: '创建工单',
      },
      {
        id: 'audit-002',
        entityType: 'WorkOrder',
        entityId: 'workorder-001',
        action: 'STATUS_CHANGE',
        oldValue: { status: 'pending' },
        newValue: { status: 'in_progress' },
        changedFields: ['status'],
        operatorId: 'consultant-002',
        operatorName: '李顾问',
        remark: '状态从 pending 变更为 in_progress',
      },
      {
        id: 'audit-003',
        entityType: 'Refund',
        entityId: 'refund-001',
        action: 'CREATE',
        newValue: { requestedAmount: 15000 },
        operatorId: 'consultant-003',
        operatorName: '王顾问',
        remark: '创建退款申请',
      },
      {
        id: 'audit-004',
        entityType: 'Transfer',
        entityId: 'transfer-001',
        action: 'CREATE',
        newValue: { fromConsultantId: 'consultant-003', toConsultantId: 'consultant-002' },
        operatorId: 'consultant-001',
        operatorName: '张主管',
        remark: '创建顾问交接',
      },
      {
        id: 'audit-005',
        entityType: 'Material',
        entityId: 'material-001',
        action: 'NEW_VERSION',
        oldValue: { version: 1 },
        newValue: { version: 2 },
        operatorId: 'consultant-004',
        operatorName: '陈文案',
        remark: '上传新版本 v2',
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('audit_logs')
      .values(auditLogs)
      .orIgnore()
      .execute();
    console.log('✅ 审计日志数据已填充');

    console.log('\n🎉 演示数据填充完成！');
    console.log('\n📋 演示账号：');
    console.log('  - 张主管 (consultant_director): consultant-001');
    console.log('  - 李顾问 (consultant): consultant-002');
    console.log('  - 王顾问 (consultant): consultant-003');
    console.log('  - 陈文案 (copywriter): consultant-004');
    console.log('  - 刘签证 (visa_assistant): consultant-005');
  } catch (error) {
    console.error('❌ 数据填充失败:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch(console.error);
