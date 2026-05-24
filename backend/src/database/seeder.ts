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

const UUIDS = {
  consultants: {
    zhangZhuguan: '11111111-1111-1111-1111-111111111111',
    liGuwen: '22222222-2222-2222-2222-222222222222',
    wangGuwen: '33333333-3333-3333-3333-333333333333',
    chenWenan: '44444444-4444-4444-4444-444444444444',
    liuQianzheng: '55555555-5555-5555-5555-555555555555',
  },
  students: {
    zhangMing: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    liHua: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    wangFang: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  },
  workOrders: {
    wo1: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    wo2: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    wo3: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    wo4: '00000000-0000-0000-0000-000000000000',
  },
  refunds: {
    r1: '10101010-1010-1010-1010-101010101010',
  },
  transfers: {
    t1: '20202020-2020-2020-2020-202020202020',
  },
  materials: {
    m1: '30303030-3030-3030-3030-303030303030',
    m2: '40404040-4040-4040-4040-404040404040',
    m3: '50505050-5050-5050-5050-505050505050',
  },
  materialVersions: {
    v1: '60606060-6060-6060-6060-606060606060',
    v2: '70707070-7070-7070-7070-707070707070',
  },
  comments: {
    c1: '80808080-8080-8080-8080-808080808080',
    c2: '90909090-9090-9090-9090-909090909090',
    c3: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    c4: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
    c5: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  },
  deadlines: {
    d1: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    d2: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
    d3: 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
  },
  auditLogs: {
    a1: '12121212-1212-1212-1212-121212121212',
    a2: '23232323-2323-2323-2323-232323232323',
    a3: '34343434-3434-3434-3434-343434343434',
    a4: '45454545-4545-4545-4545-454545454545',
    a5: '56565656-5656-5656-5656-565656565656',
  },
};

async function seed() {
  await dataSource.initialize();
  console.log('📦 开始填充演示数据...');

  const queryRunner = dataSource.createQueryRunner();

  try {
    const consultants = [
      {
        id: UUIDS.consultants.zhangZhuguan,
        name: '张主管',
        username: 'zhang.zhuguan',
        role: 'consultant_director',
        phone: '13800000001',
        email: 'zhang.zhuguan@study.com',
        isActive: true,
      },
      {
        id: UUIDS.consultants.liGuwen,
        name: '李顾问',
        username: 'li.guwen',
        role: 'consultant',
        phone: '13800000002',
        email: 'li.guwen@study.com',
        isActive: true,
      },
      {
        id: UUIDS.consultants.wangGuwen,
        name: '王顾问',
        username: 'wang.guwen',
        role: 'consultant',
        phone: '13800000003',
        email: 'wang.guwen@study.com',
        isActive: true,
      },
      {
        id: UUIDS.consultants.chenWenan,
        name: '陈文案',
        username: 'chen.wenan',
        role: 'copywriter',
        phone: '13800000004',
        email: 'chen.wenan@study.com',
        isActive: true,
      },
      {
        id: UUIDS.consultants.liuQianzheng,
        name: '刘签证',
        username: 'liu.qianzheng',
        role: 'visa_assistant',
        phone: '13800000005',
        email: 'liu.qianzheng@study.com',
        isActive: true,
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
        id: UUIDS.students.zhangMing,
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
        id: UUIDS.students.liHua,
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
        id: UUIDS.students.wangFang,
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
        id: UUIDS.workOrders.wo1,
        orderNo: 'WO202505240001',
        title: '张明-美国本科申请',
        description: '哈佛大学计算机科学本科申请全案服务',
        status: 'in_progress',
        studentId: UUIDS.students.zhangMing,
        currentConsultantId: UUIDS.consultants.liGuwen,
        expectedDeadline: nextMonth.toISOString().split('T')[0],
        serviceContent: '选校规划、文书指导、申请提交、签证辅导',
        createdBy: UUIDS.consultants.zhangZhuguan,
        updatedBy: UUIDS.consultants.liGuwen,
      },
      {
        id: UUIDS.workOrders.wo2,
        orderNo: 'WO202505240002',
        title: '李华-英国硕士申请',
        description: '牛津大学经济学硕士申请',
        status: 'refund_negotiating',
        studentId: UUIDS.students.liHua,
        currentConsultantId: UUIDS.consultants.wangGuwen,
        previousConsultantId: UUIDS.consultants.liGuwen,
        expectedDeadline: nextWeek.toISOString().split('T')[0],
        serviceContent: '选校规划、文书指导、申请提交',
        createdBy: UUIDS.consultants.zhangZhuguan,
        updatedBy: UUIDS.consultants.zhangZhuguan,
      },
      {
        id: UUIDS.workOrders.wo3,
        orderNo: 'WO202505240003',
        title: '王芳-澳洲硕士申请',
        description: '墨尔本大学金融学硕士申请',
        status: 'transferring',
        studentId: UUIDS.students.wangFang,
        currentConsultantId: UUIDS.consultants.liGuwen,
        expectedDeadline: nextMonth.toISOString().split('T')[0],
        serviceContent: '选校规划、文书指导、签证辅导',
        createdBy: UUIDS.consultants.zhangZhuguan,
        updatedBy: UUIDS.consultants.zhangZhuguan,
      },
      {
        id: UUIDS.workOrders.wo4,
        orderNo: 'WO202505240004',
        title: '测试工单-已完成',
        description: '用于演示历史记录',
        status: 'completed',
        studentId: UUIDS.students.zhangMing,
        currentConsultantId: UUIDS.consultants.liGuwen,
        serviceContent: '测试服务',
        createdBy: UUIDS.consultants.zhangZhuguan,
        updatedBy: UUIDS.consultants.liGuwen,
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
        id: UUIDS.refunds.r1,
        workOrderId: UUIDS.workOrders.wo2,
        requestedAmount: 15000.0,
        approvedAmount: 12000.0,
        reason: '学生决定放弃留学，申请退款。合同约定非校方原因退款80%。',
        negotiationHistory:
          '[2025-05-20T10:00:00Z] 张主管：家长来电提出退款需求，已记录\n[2025-05-21T14:30:00Z] 李顾问：与家长沟通，确认退款金额12000元',
        status: 'under_review',
        initiatorId: UUIDS.consultants.wangGuwen,
        reviewerId: UUIDS.consultants.zhangZhuguan,
        reviewedAt: new Date(),
        createdBy: UUIDS.consultants.wangGuwen,
        updatedBy: UUIDS.consultants.zhangZhuguan,
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
        id: UUIDS.transfers.t1,
        workOrderId: UUIDS.workOrders.wo3,
        fromConsultantId: UUIDS.consultants.wangGuwen,
        toConsultantId: UUIDS.consultants.liGuwen,
        handoverContent:
          '1. 学生基本情况：王芳，28岁，本科金融，工作2年\n2. 申请进度：学校选定，文书初稿完成\n3. 家长联系方式：13900000003',
        keyNotes: '家长比较焦虑，需要每周汇报进度',
        pendingItems: '1. 个人陈述修改\n2. 推荐信收集',
        status: 'handover_in_progress',
        initiatorId: UUIDS.consultants.zhangZhuguan,
        createdBy: UUIDS.consultants.zhangZhuguan,
        updatedBy: UUIDS.consultants.zhangZhuguan,
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
        id: UUIDS.materials.m1,
        workOrderId: UUIDS.workOrders.wo1,
        name: '个人陈述-初稿',
        type: 'academic',
        status: 'needs_revision',
        currentVersion: 2,
        fileUrl: '/files/material-001-v2.pdf',
        description: '哈佛大学CS专业个人陈述',
        deadline: nextWeek.toISOString().split('T')[0],
        ownerId: UUIDS.consultants.chenWenan,
        createdBy: UUIDS.consultants.chenWenan,
        updatedBy: UUIDS.consultants.zhangZhuguan,
      },
      {
        id: UUIDS.materials.m2,
        workOrderId: UUIDS.workOrders.wo1,
        name: '存款证明',
        type: 'financial',
        status: 'approved',
        currentVersion: 1,
        fileUrl: '/files/material-002-v1.pdf',
        description: '50万人民币存款证明，有效期6个月',
        ownerId: UUIDS.consultants.liGuwen,
        createdBy: UUIDS.consultants.liGuwen,
        updatedBy: UUIDS.consultants.zhangZhuguan,
      },
      {
        id: UUIDS.materials.m3,
        workOrderId: UUIDS.workOrders.wo1,
        name: '托福成绩单',
        type: 'language',
        status: 'submitted',
        currentVersion: 1,
        fileUrl: '/files/material-003-v1.pdf',
        description: '托福110分成绩单',
        deadline: nextWeek.toISOString().split('T')[0],
        ownerId: UUIDS.consultants.liuQianzheng,
        createdBy: UUIDS.consultants.liuQianzheng,
        updatedBy: UUIDS.consultants.liuQianzheng,
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
        id: UUIDS.materialVersions.v1,
        materialId: UUIDS.materials.m1,
        version: 1,
        fileUrl: '/files/material-001-v1.pdf',
        changeLog: '初始版本',
        uploadedBy: UUIDS.consultants.chenWenan,
      },
      {
        id: UUIDS.materialVersions.v2,
        materialId: UUIDS.materials.m1,
        version: 2,
        fileUrl: '/files/material-001-v2.pdf',
        changeLog: '根据主管意见修改了职业规划部分',
        uploadedBy: UUIDS.consultants.chenWenan,
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
        id: UUIDS.comments.c1,
        workOrderId: UUIDS.workOrders.wo1,
        refundId: null,
        transferId: null,
        materialId: null,
        content: '学生背景很好，重点冲刺藤校',
        authorId: UUIDS.consultants.zhangZhuguan,
        isPrivate: false,
      },
      {
        id: UUIDS.comments.c2,
        workOrderId: null,
        refundId: UUIDS.refunds.r1,
        transferId: null,
        materialId: null,
        content: '家长态度强硬，建议按合同执行',
        authorId: UUIDS.consultants.zhangZhuguan,
        isPrivate: true,
      },
      {
        id: UUIDS.comments.c3,
        workOrderId: null,
        refundId: null,
        transferId: UUIDS.transfers.t1,
        materialId: null,
        content: '请确保交接完成后再签字',
        authorId: UUIDS.consultants.zhangZhuguan,
        isPrivate: false,
      },
      {
        id: UUIDS.comments.c4,
        workOrderId: null,
        refundId: null,
        transferId: null,
        materialId: UUIDS.materials.m1,
        content: '建议增加具体项目经历描述',
        authorId: UUIDS.consultants.zhangZhuguan,
        isPrivate: false,
      },
      {
        id: UUIDS.comments.c5,
        workOrderId: UUIDS.workOrders.wo2,
        refundId: null,
        transferId: null,
        materialId: null,
        content: '退款申请已收到，正在走流程',
        authorId: UUIDS.consultants.wangGuwen,
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
        id: UUIDS.deadlines.d1,
        workOrderId: UUIDS.workOrders.wo1,
        title: '个人陈述终稿完成',
        description: '完成哈佛CS个人陈述终稿',
        dueDate: nextWeek,
        isCompleted: false,
        isOverdue: false,
        assigneeId: UUIDS.consultants.chenWenan,
        reminderCount: 0,
      },
      {
        id: UUIDS.deadlines.d2,
        workOrderId: UUIDS.workOrders.wo1,
        title: '托福成绩送分',
        description: '完成托福成绩送分申请',
        dueDate: nextWeek,
        isCompleted: false,
        isOverdue: false,
        assigneeId: UUIDS.consultants.liuQianzheng,
        reminderCount: 0,
      },
      {
        id: UUIDS.deadlines.d3,
        workOrderId: UUIDS.workOrders.wo2,
        title: '退款审批完成',
        description: '完成退款申请审批',
        dueDate: nextWeek,
        isCompleted: false,
        isOverdue: false,
        assigneeId: UUIDS.consultants.zhangZhuguan,
        reminderCount: 0,
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
        id: UUIDS.auditLogs.a1,
        entityType: 'WorkOrder',
        entityId: UUIDS.workOrders.wo1,
        action: 'CREATE',
        newValue: { title: '张明-美国本科申请' },
        operatorId: UUIDS.consultants.zhangZhuguan,
        operatorName: '张主管',
        remark: '创建工单',
      },
      {
        id: UUIDS.auditLogs.a2,
        entityType: 'WorkOrder',
        entityId: UUIDS.workOrders.wo1,
        action: 'STATUS_CHANGE',
        oldValue: { status: 'pending' },
        newValue: { status: 'in_progress' },
        changedFields: ['status'],
        operatorId: UUIDS.consultants.liGuwen,
        operatorName: '李顾问',
        remark: '状态从 pending 变更为 in_progress',
      },
      {
        id: UUIDS.auditLogs.a3,
        entityType: 'Refund',
        entityId: UUIDS.refunds.r1,
        action: 'CREATE',
        newValue: { requestedAmount: 15000 },
        operatorId: UUIDS.consultants.wangGuwen,
        operatorName: '王顾问',
        remark: '创建退款申请',
      },
      {
        id: UUIDS.auditLogs.a4,
        entityType: 'Transfer',
        entityId: UUIDS.transfers.t1,
        action: 'CREATE',
        newValue: {
          fromConsultantId: UUIDS.consultants.wangGuwen,
          toConsultantId: UUIDS.consultants.liGuwen,
        },
        operatorId: UUIDS.consultants.zhangZhuguan,
        operatorName: '张主管',
        remark: '创建顾问交接',
      },
      {
        id: UUIDS.auditLogs.a5,
        entityType: 'Material',
        entityId: UUIDS.materials.m1,
        action: 'NEW_VERSION',
        oldValue: { version: 1 },
        newValue: { version: 2 },
        operatorId: UUIDS.consultants.chenWenan,
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
    console.log(`  - 张主管 (consultant_director): ${UUIDS.consultants.zhangZhuguan}`);
    console.log(`  - 李顾问 (consultant): ${UUIDS.consultants.liGuwen}`);
    console.log(`  - 王顾问 (consultant): ${UUIDS.consultants.wangGuwen}`);
    console.log(`  - 陈文案 (copywriter): ${UUIDS.consultants.chenWenan}`);
    console.log(`  - 刘签证 (visa_assistant): ${UUIDS.consultants.liuQianzheng}`);
  } catch (error) {
    console.error('❌ 数据填充失败:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch(console.error);
