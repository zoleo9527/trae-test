import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

import { User } from '../entities/user.entity';
import { SparePart } from '../entities/spare-part.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { DowntimeRecord } from '../entities/downtime-record.entity';
import { PartUsage, PartRequestStatus } from '../entities/part-usage.entity';
import { ReviewRecord, ReviewLevel } from '../entities/review-record.entity';
import { StatusHistory } from '../entities/status-history.entity';
import { UserRole } from '../common/enums/role.enum';
import { WorkOrderStatus, AbnormalType } from '../common/enums/work-order.enum';
import { addDays, addHours, subDays } from 'date-fns';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'pv_operation',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('🌱 开始填充种子数据...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepo = queryRunner.manager.getRepository(User);
    const partRepo = queryRunner.manager.getRepository(SparePart);
    const workOrderRepo = queryRunner.manager.getRepository(WorkOrder);
    const downtimeRepo = queryRunner.manager.getRepository(DowntimeRecord);
    const partUsageRepo = queryRunner.manager.getRepository(PartUsage);
    const reviewRepo = queryRunner.manager.getRepository(ReviewRecord);
    const statusHistoryRepo = queryRunner.manager.getRepository(StatusHistory);

    const users = await userRepo.save([
      { username: 'zhangsan', name: '张三', role: UserRole.STATION_MASTER, phone: '13800000001', station: '光伏A站' },
      { username: 'lisi', name: '李四', role: UserRole.INSPECTION_ENGINEER, phone: '13800000002', station: '光伏A站' },
      { username: 'wangwu', name: '王五', role: UserRole.INSPECTION_ENGINEER, phone: '13800000003', station: '光伏B站' },
      { username: 'zhaoliu', name: '赵六', role: UserRole.OPERATION_STAFF, phone: '13800000004', station: '运维中心' },
      { username: 'admin', name: '管理员', role: UserRole.ADMIN, phone: '13800000000', station: '总部' },
    ]);
    console.log('✅ 用户数据已创建');

    const spareParts = await partRepo.save([
      { partCode: 'INV-001', name: '逆变器模块', specification: '50kW', manufacturer: '华为', unitPrice: 12500.00, stockQuantity: 15, unit: '台', location: 'A区-01货架' },
      { partCode: 'INV-002', name: '逆变器主板', specification: 'SUN2000', manufacturer: '华为', unitPrice: 3200.00, stockQuantity: 8, unit: '块', location: 'A区-02货架' },
      { partCode: 'COM-001', name: '通信模块', specification: '4G', manufacturer: '中兴', unitPrice: 580.00, stockQuantity: 25, unit: '个', location: 'B区-01货架' },
      { partCode: 'FUS-001', name: '熔断器', specification: '10A', manufacturer: '西门子', unitPrice: 45.00, stockQuantity: 100, unit: '个', location: 'C区-01货架' },
      { partCode: 'SW-001', name: '交流开关', specification: '63A', manufacturer: 'ABB', unitPrice: 280.00, stockQuantity: 30, unit: '个', location: 'C区-02货架' },
      { partCode: 'CB-001', name: '接线端子', specification: '10mm²', manufacturer: '菲尼克斯', unitPrice: 15.00, stockQuantity: 500, unit: '个', location: 'D区-01货架' },
    ]);
    console.log('✅ 备件数据已创建');

    const now = new Date();

    const workOrders: WorkOrder[] = [];
    
    const wo1 = workOrderRepo.create({
      orderNo: 'WO202405200001',
      title: '1号逆变器告警停机',
      status: WorkOrderStatus.CLOSED,
      abnormalType: AbnormalType.INVERTER_FAULT,
      description: '1号逆变器出现过温告警，已自动停机',
      equipmentNo: 'INV-A-001',
      station: '光伏A站',
      powerLoss: 12500,
      totalDowntimeMinutes: 240,
      reporterId: users[1].id,
      handlerId: users[1].id,
      createdAt: subDays(now, 5),
      closedAt: subDays(now, 4),
    });
    workOrders.push(await workOrderRepo.save(wo1));

    const wo2 = workOrderRepo.create({
      orderNo: 'WO202405210001',
      title: '3号组串发电量偏低',
      status: WorkOrderStatus.REVIEW_SUBMITTED,
      abnormalType: AbnormalType.STRING_ABNORMAL,
      description: '3号组串近三日发电量较同型号组串偏低30%',
      equipmentNo: 'STR-B-003',
      station: '光伏A站',
      powerLoss: 3200,
      totalDowntimeMinutes: 0,
      reporterId: users[2].id,
      handlerId: users[2].id,
      createdAt: subDays(now, 3),
    });
    workOrders.push(await workOrderRepo.save(wo2));

    const wo3 = workOrderRepo.create({
      orderNo: 'WO202405220001',
      title: '数据采集器通信中断',
      status: WorkOrderStatus.PART_RECEIVED,
      abnormalType: AbnormalType.COMMUNICATION_FAILURE,
      description: '光伏B站数据采集器无法连接服务器，数据已中断2小时',
      equipmentNo: 'COM-B-001',
      station: '光伏B站',
      powerLoss: 0,
      totalDowntimeMinutes: 0,
      reporterId: users[2].id,
      handlerId: users[2].id,
      createdAt: subDays(now, 2),
    });
    workOrders.push(await workOrderRepo.save(wo3));

    const wo4 = workOrderRepo.create({
      orderNo: 'WO202405230001',
      title: '电网电压波动导致停机',
      status: WorkOrderStatus.DOWNTIME_CONFIRMED,
      abnormalType: AbnormalType.GRID_ABNORMAL,
      description: '电网电压骤升导致保护动作，全站逆变器停机',
      equipmentNo: 'ALL',
      station: '光伏A站',
      powerLoss: 45000,
      totalDowntimeMinutes: 180,
      reporterId: users[1].id,
      handlerId: users[1].id,
      createdAt: subDays(now, 1),
    });
    workOrders.push(await workOrderRepo.save(wo4));

    const wo5 = workOrderRepo.create({
      orderNo: 'WO202405230002',
      title: '暴雨天气全站停机',
      status: WorkOrderStatus.ABNORMAL_REPORTED,
      abnormalType: AbnormalType.WEATHER_ISSUE,
      description: '遭遇强暴雨天气，为安全起见手动停机',
      equipmentNo: 'ALL',
      station: '光伏B站',
      powerLoss: 0,
      reporterId: users[2].id,
      createdAt: now,
    });
    workOrders.push(await workOrderRepo.save(wo5));

    console.log('✅ 工单数据已创建');

    await downtimeRepo.save([
      {
        workOrderId: workOrders[0].id,
        startTime: subDays(now, 5),
        endTime: addHours(subDays(now, 5), 4),
        durationMinutes: 240,
        reason: '逆变器过温保护',
        isConfirmed: true,
        confirmedById: users[0].id,
        confirmedAt: addHours(subDays(now, 5), 5),
      },
      {
        workOrderId: workOrders[3].id,
        startTime: subDays(now, 1),
        endTime: addHours(subDays(now, 1), 3),
        durationMinutes: 180,
        reason: '电网电压波动',
        isConfirmed: true,
        confirmedById: users[0].id,
        confirmedAt: addHours(subDays(now, 1), 3.5),
      },
      {
        workOrderId: workOrders[4].id,
        startTime: now,
        reason: '暴雨天气',
        isConfirmed: false,
      },
    ]);
    console.log('✅ 停机记录已创建');

    await partUsageRepo.save([
      {
        workOrderId: workOrders[0].id,
        sparePartId: spareParts[0].id,
        quantity: 1,
        unitPrice: 12500,
        totalPrice: 12500,
        status: PartRequestStatus.RECEIVED,
        requestReason: '逆变器故障更换',
        requestedById: users[1].id,
        approvedById: users[3].id,
        approvedAt: addHours(subDays(now, 5), 1),
        receivedById: users[1].id,
        receivedAt: addHours(subDays(now, 5), 2),
      },
      {
        workOrderId: workOrders[2].id,
        sparePartId: spareParts[2].id,
        quantity: 2,
        unitPrice: 580,
        totalPrice: 1160,
        status: PartRequestStatus.RECEIVED,
        requestReason: '通信模块更换',
        requestedById: users[2].id,
        approvedById: users[3].id,
        approvedAt: addHours(subDays(now, 2), 1),
        receivedById: users[2].id,
        receivedAt: addHours(subDays(now, 2), 6),
      },
    ]);
    console.log('✅ 备件领用记录已创建');

    await reviewRepo.save([
      {
        workOrderId: workOrders[0].id,
        level: ReviewLevel.MAJOR,
        rootCause: '逆变器散热风扇损坏导致温度过高',
        repairProcess: '1. 现场检查发现散热风扇不转；2. 更换逆变器模块；3. 测试运行正常',
        improvementMeasures: '1. 增加月度巡检，重点检查散热系统；2. 备库增加风扇备件',
        lessonsLearned: '环境温度高时需增加巡检频次，提前发现隐患',
        actualDowntimeMinutes: 240,
        actualPowerLoss: 12500,
        actualPartCost: 12500,
        actualLaborCost: 800,
        totalCost: 13300,
        submittedById: users[1].id,
        submittedAt: subDays(now, 4.5),
        isVerified: true,
        verifiedById: users[0].id,
        verifiedAt: subDays(now, 4),
      },
      {
        workOrderId: workOrders[1].id,
        level: ReviewLevel.MINOR,
        rootCause: '组串接线端子氧化导致接触不良',
        repairProcess: '1. 检测发现3号组串电流偏低；2. 更换接线端子；3. 组串恢复正常发电',
        improvementMeasures: '1. 雨季前后重点检查户外接线端子；2. 使用防水性能更好的端子',
        lessonsLearned: '发电量对比分析可以提前发现隐性故障',
        actualDowntimeMinutes: 0,
        actualPowerLoss: 3200,
        actualPartCost: 150,
        actualLaborCost: 300,
        totalCost: 450,
        submittedById: users[2].id,
        submittedAt: subDays(now, 2.5),
        isVerified: false,
      },
    ]);
    console.log('✅ 复盘记录已创建');

    await statusHistoryRepo.save([
      { workOrderId: workOrders[0].id, fromStatus: null, toStatus: WorkOrderStatus.ABNORMAL_REPORTED, remark: '异常上报', operatedById: users[1].id, operatedAt: subDays(now, 5) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.ABNORMAL_REPORTED, toStatus: WorkOrderStatus.DOWNTIME_CONFIRMED, remark: '确认停机', operatedById: users[0].id, operatedAt: addHours(subDays(now, 5), 0.5) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.DOWNTIME_CONFIRMED, toStatus: WorkOrderStatus.PART_REQUESTED, remark: '申请备件', operatedById: users[1].id, operatedAt: addHours(subDays(now, 5), 0.8) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.PART_REQUESTED, toStatus: WorkOrderStatus.PART_APPROVED, remark: '审批通过', operatedById: users[3].id, operatedAt: addHours(subDays(now, 5), 1) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.PART_APPROVED, toStatus: WorkOrderStatus.PART_RECEIVED, remark: '已领取备件', operatedById: users[1].id, operatedAt: addHours(subDays(now, 5), 2) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.PART_RECEIVED, toStatus: WorkOrderStatus.REPAIR_COMPLETED, remark: '维修完成', operatedById: users[1].id, operatedAt: addHours(subDays(now, 5), 4) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.REPAIR_COMPLETED, toStatus: WorkOrderStatus.REVIEW_SUBMITTED, remark: '提交复盘', operatedById: users[1].id, operatedAt: subDays(now, 4.5) },
      { workOrderId: workOrders[0].id, fromStatus: WorkOrderStatus.REVIEW_SUBMITTED, toStatus: WorkOrderStatus.CLOSED, remark: '工单关闭', operatedById: users[0].id, operatedAt: subDays(now, 4) },
    ]);
    console.log('✅ 状态历史已创建');

    await queryRunner.commitTransaction();
    console.log('🎉 所有种子数据填充完成！');

    console.log('\n📋 测试账号:');
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.role}): username=${u.username}, id=${u.id}`);
    });

    console.log('\n📋 工单示例:');
    workOrders.forEach(wo => {
      console.log(`  - ${wo.orderNo}: ${wo.title} [${wo.status}]`);
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ 种子数据填充失败:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
