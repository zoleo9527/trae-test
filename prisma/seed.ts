import { PrismaClient, Role, ActivityStatus, RegistrationStatus, CheckInStatus, LogAction, LogModule } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);
  const now = new Date();

  const [director, activityOperator, volunteerCoordinator, volunteer1, volunteer2, volunteer3] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'director' },
      update: {},
      create: {
        username: 'director',
        password: hashedPassword,
        name: '王馆长',
        phone: '13800000001',
        email: 'director@library.com',
        role: Role.DIRECTOR,
      },
    }),
    prisma.user.upsert({
      where: { username: 'operator' },
      update: {},
      create: {
        username: 'operator',
        password: hashedPassword,
        name: '李运营',
        phone: '13800000002',
        email: 'operator@library.com',
        role: Role.ACTIVITY_OPERATOR,
      },
    }),
    prisma.user.upsert({
      where: { username: 'coordinator' },
      update: {},
      create: {
        username: 'coordinator',
        password: hashedPassword,
        name: '张协调',
        phone: '13800000003',
        email: 'coordinator@library.com',
        role: Role.VOLUNTEER_COORDINATOR,
      },
    }),
    prisma.user.upsert({
      where: { username: 'volunteer1' },
      update: {},
      create: {
        username: 'volunteer1',
        password: hashedPassword,
        name: '陈志愿',
        phone: '13800000004',
        email: 'volunteer1@library.com',
        role: Role.VOLUNTEER,
      },
    }),
    prisma.user.upsert({
      where: { username: 'volunteer2' },
      update: {},
      create: {
        username: 'volunteer2',
        password: hashedPassword,
        name: '刘志愿',
        phone: '13800000005',
        email: 'volunteer2@library.com',
        role: Role.VOLUNTEER,
      },
    }),
    prisma.user.upsert({
      where: { username: 'volunteer3' },
      update: {},
      create: {
        username: 'volunteer3',
        password: hashedPassword,
        name: '赵志愿',
        phone: '13800000006',
        email: 'volunteer3@library.com',
        role: Role.VOLUNTEER,
      },
    }),
  ]);

  console.log('用户创建完成');

  const library = await prisma.library.upsert({
    where: { name: '城市中心书房' },
    update: {},
    create: {
      name: '城市中心书房',
      address: '市中心文化广场A座1楼',
      phone: '0571-88888888',
      description: '城市核心区域的公共阅读空间',
      managerId: director.id,
    },
  });

  const library2 = await prisma.library.upsert({
    where: { name: '滨江分馆' },
    update: {},
    create: {
      name: '滨江分馆',
      address: '滨江新区科技路256号',
      phone: '0571-88888889',
      description: '面向科技从业者的特色书房',
      managerId: director.id,
    },
  });

  console.log('书房创建完成');

  const activity1 = await prisma.activity.upsert({
    where: { id: 'activity-001' },
    update: {},
    create: {
      id: 'activity-001',
      title: '周末亲子阅读会 - 第25期',
      description: '适合4-10岁儿童参与，由专业阅读老师带领，通过故事分享和互动游戏培养孩子的阅读兴趣。',
      libraryId: library.id,
      location: '城市中心书房 多功能厅',
      maxParticipants: 30,
      currentParticipants: 28,
      startTime: setMinutes(setHours(addDays(now, 7), 14), 0),
      endTime: setMinutes(setHours(addDays(now, 7), 16), 0),
      registrationStart: addDays(now, -7),
      registrationEnd: addDays(now, 5),
      status: ActivityStatus.REGISTRATION_OPEN,
      coverImage: 'https://example.com/reading.jpg',
      tags: ['亲子', '阅读', '周末'],
      requirements: '请为孩子准备水杯和笔记本',
      createdById: activityOperator.id,
    },
  });

  const activity2 = await prisma.activity.upsert({
    where: { id: 'activity-002' },
    update: {},
    create: {
      id: 'activity-002',
      title: '人工智能科普讲座',
      description: '邀请AI领域专家为大家讲解人工智能的发展历程和未来趋势，适合对科技感兴趣的市民。',
      libraryId: library2.id,
      location: '滨江分馆 报告厅',
      maxParticipants: 50,
      currentParticipants: 15,
      startTime: setMinutes(setHours(addDays(now, 14), 19), 0),
      endTime: setMinutes(setHours(addDays(now, 14), 21), 0),
      registrationStart: addDays(now, -3),
      registrationEnd: addDays(now, 10),
      status: ActivityStatus.REGISTRATION_OPEN,
      coverImage: 'https://example.com/ai.jpg',
      tags: ['科技', '讲座', 'AI'],
      createdById: activityOperator.id,
    },
  });

  const activity3 = await prisma.activity.upsert({
    where: { id: 'activity-003' },
    update: {},
    create: {
      id: 'activity-003',
      title: '书法入门培训班',
      description: '零基础书法入门课程，由书法协会老师授课，包含毛笔和硬笔两种书法练习。',
      libraryId: library.id,
      location: '城市中心书房 创作室',
      maxParticipants: 20,
      currentParticipants: 20,
      startTime: setMinutes(setHours(addDays(now, -1), 9), 0),
      endTime: setMinutes(setHours(addDays(now, -1), 11), 30),
      registrationStart: addDays(now, -21),
      registrationEnd: addDays(now, -5),
      status: ActivityStatus.COMPLETED,
      coverImage: 'https://example.com/calligraphy.jpg',
      tags: ['书法', '艺术', '培训'],
      notes: '已顺利完成，共20名学员参与',
      createdById: activityOperator.id,
    },
  });

  console.log('活动创建完成');

  const [reg1, reg2, reg3, reg4, reg5, reg6] = await Promise.all([
    prisma.registration.upsert({
      where: { id: 'reg-001' },
      update: {},
      create: {
        id: 'reg-001',
        activityId: activity3.id,
        userId: volunteer1.id,
        userName: volunteer1.name,
        userPhone: volunteer1.phone!,
        idCardNumber: '330102199001010001',
        status: RegistrationStatus.CHECKED_IN,
      },
    }),
    prisma.registration.upsert({
      where: { id: 'reg-002' },
      update: {},
      create: {
        id: 'reg-002',
        activityId: activity3.id,
        userId: volunteer2.id,
        userName: volunteer2.name,
        userPhone: volunteer2.phone!,
        idCardNumber: '330102199002020002',
        status: RegistrationStatus.CHECKED_IN,
      },
    }),
    prisma.registration.upsert({
      where: { id: 'reg-003' },
      update: {},
      create: {
        id: 'reg-003',
        activityId: activity3.id,
        userId: volunteer3.id,
        userName: volunteer3.name,
        userPhone: volunteer3.phone!,
        status: RegistrationStatus.NO_SHOW,
      },
    }),
    prisma.registration.upsert({
      where: { id: 'reg-004' },
      update: {},
      create: {
        id: 'reg-004',
        activityId: activity1.id,
        userId: volunteer1.id,
        userName: volunteer1.name,
        userPhone: volunteer1.phone!,
        status: RegistrationStatus.APPROVED,
      },
    }),
    prisma.registration.upsert({
      where: { id: 'reg-005' },
      update: {},
      create: {
        id: 'reg-005',
        activityId: activity1.id,
        userId: volunteer2.id,
        userName: volunteer2.name,
        userPhone: volunteer2.phone!,
        status: RegistrationStatus.PENDING,
      },
    }),
    prisma.registration.upsert({
      where: { id: 'reg-006' },
      update: {},
      create: {
        id: 'reg-006',
        activityId: activity1.id,
        userId: 'supplement-user-001',
        userName: '补录小王',
        userPhone: '13900001234',
        status: RegistrationStatus.APPROVED,
        isSupplement: true,
        supplementReason: '现场报名，补录信息',
        supplementById: activityOperator.id,
        supplementTime: now,
      },
    }),
  ]);

  await prisma.registration.upsert({
    where: { id: 'reg-007' },
    update: {},
    create: {
      id: 'reg-007',
      activityId: activity2.id,
      userId: 'rejected-user-001',
      userName: '不符合条件用户',
      userPhone: '13900005678',
      status: RegistrationStatus.REJECTED,
      rejectReason: '活动名额已满，且该用户已报名过同类型活动',
      rejectById: activityOperator.id,
      rejectTime: now,
    },
  });

  console.log('报名记录创建完成');

  await Promise.all([
    prisma.checkInRecord.upsert({
      where: { id: 'checkin-001' },
      update: {},
      create: {
        id: 'checkin-001',
        activityId: activity3.id,
        registrationId: reg1.id,
        userName: reg1.userName,
        userPhone: reg1.userPhone,
        checkInTime: setMinutes(setHours(addDays(now, -1), 8), 55),
        status: CheckInStatus.SUCCESS,
        checkInMethod: 'QR_CODE',
        handledById: volunteerCoordinator.id,
      },
    }),
    prisma.checkInRecord.upsert({
      where: { id: 'checkin-002' },
      update: {},
      create: {
        id: 'checkin-002',
        activityId: activity3.id,
        registrationId: reg2.id,
        userName: reg2.userName,
        userPhone: reg2.userPhone,
        checkInTime: setMinutes(setHours(addDays(now, -1), 9), 5),
        status: CheckInStatus.SUCCESS,
        checkInMethod: 'QR_CODE',
        handledById: volunteerCoordinator.id,
      },
    }),
    prisma.checkInRecord.upsert({
      where: { id: 'checkin-003' },
      update: {},
      create: {
        id: 'checkin-003',
        activityId: activity3.id,
        userName: '现场访客-李老师',
        userPhone: '13700001111',
        checkInTime: setMinutes(setHours(addDays(now, -1), 9), 20),
        status: CheckInStatus.MANUAL,
        checkInMethod: 'MANUAL',
        manualRemark: '书法老师，未提前报名，现场签到',
        handledById: volunteerCoordinator.id,
      },
    }),
    prisma.checkInRecord.upsert({
      where: { id: 'checkin-004' },
      update: {},
      create: {
        id: 'checkin-004',
        activityId: activity3.id,
        userName: '现场访客-张同学',
        userPhone: '13700002222',
        checkInTime: setMinutes(setHours(addDays(now, -1), 9), 30),
        status: CheckInStatus.MANUAL,
        checkInMethod: 'MANUAL',
        manualRemark: '路过书房，临时参与，有老师陪同担保',
        evidenceImage: 'https://example.com/evidence.jpg',
        handledById: volunteerCoordinator.id,
      },
    }),
  ]);

  console.log('签到记录创建完成');

  await Promise.all([
    prisma.operationLog.upsert({
      where: { id: 'log-001' },
      update: {},
      create: {
        id: 'log-001',
        module: LogModule.ACTIVITY,
        action: LogAction.CREATE,
        recordId: activity1.id,
        recordType: 'Activity',
        afterState: { title: activity1.title, status: activity1.status },
        remark: '创建活动',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120.0.0.0',
        createdById: activityOperator.id,
      },
    }),
    prisma.operationLog.upsert({
      where: { id: 'log-002' },
      update: {},
      create: {
        id: 'log-002',
        module: LogModule.REGISTRATION,
        action: LogAction.SUPPLEMENT,
        recordId: reg6.id,
        recordType: 'Registration',
        afterState: { userName: reg6.userName, isSupplement: true },
        remark: '补录报名: 现场报名，补录信息',
        ipAddress: '192.168.1.2',
        createdById: activityOperator.id,
      },
    }),
    prisma.operationLog.upsert({
      where: { id: 'log-003' },
      update: {},
      create: {
        id: 'log-003',
        module: LogModule.CHECK_IN,
        action: LogAction.CHECK_IN,
        recordId: 'checkin-003',
        recordType: 'CheckInRecord',
        afterState: { userName: '现场访客-李老师', status: 'MANUAL' },
        remark: '人工签到: 书法老师，未提前报名，现场签到',
        evidenceData: { manualRemark: '书法老师，未提前报名，现场签到' },
        ipAddress: '192.168.1.3',
        createdById: volunteerCoordinator.id,
      },
    }),
  ]);

  console.log('审计日志创建完成');

  await Promise.all([
    prisma.notification.upsert({
      where: { id: 'notif-001' },
      update: {},
      create: {
        id: 'notif-001',
        type: 'REGISTRATION_APPROVED',
        title: '报名审核通过',
        content: `您报名的「${activity1.title}」已通过审核，请按时参加。`,
        recipientId: volunteer1.id,
        recipientPhone: volunteer1.phone!,
        sentById: activityOperator.id,
        isSent: true,
        isRead: true,
        readAt: addDays(now, -2),
        sendAttempts: 1,
        lastAttemptAt: addDays(now, -3),
        relatedRecordId: reg4.id,
        relatedRecordType: 'Registration',
      },
    }),
    prisma.notification.upsert({
      where: { id: 'notif-002' },
      update: {},
      create: {
        id: 'notif-002',
        type: 'ACTIVITY_REMINDER',
        title: '活动即将开始提醒',
        content: `您报名的「${activity1.title}」将于本周六14:00开始，请提前15分钟到场签到。`,
        recipientId: volunteer1.id,
        recipientPhone: volunteer1.phone!,
        sentById: activityOperator.id,
        isSent: true,
        isRead: false,
        sendAttempts: 1,
        lastAttemptAt: addDays(now, -1),
        relatedRecordId: reg4.id,
        relatedRecordType: 'Registration',
      },
    }),
    prisma.notification.upsert({
      where: { id: 'notif-003' },
      update: {},
      create: {
        id: 'notif-003',
        type: 'REGISTRATION_REJECTED',
        title: '报名未通过',
        content: `您报名的「${activity2.title}」未通过审核，原因：活动名额已满，且该用户已报名过同类型活动。`,
        recipientId: 'rejected-user-001',
        recipientPhone: '13900005678',
        sentById: activityOperator.id,
        isSent: true,
        isRead: false,
        sendAttempts: 1,
        lastAttemptAt: now,
        relatedRecordId: reg7.id,
        relatedRecordType: 'Registration',
      },
    }),
    prisma.notification.upsert({
      where: { id: 'notif-004' },
      update: {},
      create: {
        id: 'notif-004',
        type: 'ACTIVITY_REMINDER',
        title: '逾期提醒（发送失败）',
        content: `您报名的「${activity3.title}」已结束，但此提醒因系统原因延迟发送。`,
        recipientId: volunteer3.id,
        recipientPhone: volunteer3.phone!,
        sentById: activityOperator.id,
        isSent: false,
        isRead: false,
        sendAttempts: 3,
        lastAttemptAt: addDays(now, -1),
        relatedRecordId: reg3.id,
        relatedRecordType: 'Registration',
      },
    }),
    prisma.notification.upsert({
      where: { id: 'notif-005' },
      update: {},
      create: {
        id: 'notif-005',
        type: 'CHECK_IN_SUCCESS',
        title: '签到成功通知',
        content: `您已成功签到「${activity3.title}」，感谢参与！`,
        recipientId: volunteer1.id,
        recipientPhone: volunteer1.phone!,
        sentById: volunteerCoordinator.id,
        isSent: true,
        isRead: true,
        readAt: addDays(now, -1),
        sendAttempts: 1,
        lastAttemptAt: addDays(now, -1),
        relatedRecordId: 'checkin-001',
        relatedRecordType: 'CheckInRecord',
      },
    }),
  ]);

  console.log('通知记录创建完成');

  await Promise.all([
    prisma.volunteerFeedback.upsert({
      where: { id: 'fb-001' },
      update: {},
      create: {
        id: 'fb-001',
        activityId: activity3.id,
        volunteerId: volunteer1.id,
        content: '书法培训非常专业，老师讲解细致，场地安排也很合理，希望下次还能参加。',
        rating: 5,
        isResolved: true,
        resolverId: volunteerCoordinator.id,
        resolvedAt: addDays(now, -1),
        resolution: '感谢反馈，已记录好评，下次优先通知您。',
      },
    }),
    prisma.volunteerFeedback.upsert({
      where: { id: 'fb-002' },
      update: {},
      create: {
        id: 'fb-002',
        activityId: activity3.id,
        volunteerId: volunteer2.id,
        content: '活动时间偏短，11:30结束时很多人还没练完，建议延长到12:00或者减少学员人数。',
        rating: 3,
        isResolved: true,
        resolverId: volunteerCoordinator.id,
        resolvedAt: addDays(now, -1),
        resolution: '已反馈给活动运营，下期培训将调整为9:00-12:00并控制人数在15人。',
      },
    }),
    prisma.volunteerFeedback.upsert({
      where: { id: 'fb-003' },
      update: {},
      create: {
        id: 'fb-003',
        activityId: activity3.id,
        volunteerId: volunteer3.id,
        content: '签到系统那天扫码很慢，排了好久的队，建议增加签到入口或者提前发二维码。',
        rating: 2,
        isResolved: false,
      },
    }),
    prisma.volunteerFeedback.upsert({
      where: { id: 'fb-004' },
      update: {},
      create: {
        id: 'fb-004',
        activityId: activity1.id,
        volunteerId: volunteer2.id,
        content: '报名后一直没收到确认通知，直到活动前一天才收到提醒，差点错过。',
        rating: 2,
        isResolved: false,
      },
    }),
  ]);

  console.log('志愿者反馈创建完成');

  console.log('
============================================
  种子数据创建完成！
  默认账号（密码：123456）：
  - 馆长: director
  - 活动运营: operator
  - 志愿者协调: coordinator
  - 志愿者: volunteer1 / volunteer2 / volunteer3
============================================
  ');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
