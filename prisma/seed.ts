import { PrismaClient, UserRole, MaterialStatus, InspectionType, EvidenceType, InspectionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始创建种子数据...');

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.changeLog.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.evidence.deleteMany(),
    prisma.inspection.deleteMany(),
    prisma.material.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
    prisma.idempotencyRecord.deleteMany()
  ]);

  console.log('👤 创建用户...');
  const users = await Promise.all([
    prisma.user.create({
      data: { id: uuidv4(), name: '张监理', phone: '13800000001', role: UserRole.SUPERVISOR }
    }),
    prisma.user.create({
      data: { id: uuidv4(), name: '李管家', phone: '13800000002', role: UserRole.PROJECT_MANAGER }
    }),
    prisma.user.create({
      data: { id: uuidv4(), name: '王客服', phone: '13800000003', role: UserRole.CUSTOMER_SERVICE }
    }),
    prisma.user.create({
      data: { id: uuidv4(), name: '业主-陈先生', phone: '13800000004', role: UserRole.OWNER }
    })
  ]);
  console.log(`  ✓ 创建了 ${users.length} 个用户`);

  console.log('🏗️ 创建项目...');
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        id: uuidv4(),
        name: '万科城市花园A栋1201',
        address: '北京市朝阳区万科城市花园A栋1201',
        ownerName: '陈先生',
        ownerPhone: '13900001234'
      }
    }),
    prisma.project.create({
      data: {
        id: uuidv4(),
        name: '碧桂园B栋803',
        address: '北京市海淀区碧桂园B栋803',
        ownerName: '刘女士',
        ownerPhone: '13900005678'
      }
    })
  ]);
  console.log(`  ✓ 创建了 ${projects.length} 个项目`);

  console.log('📦 创建主材数据 - 正常流程样例...');
  const normalMaterial = await prisma.material.create({
    data: {
      id: uuidv4(),
      projectId: projects[0].id,
      name: '实木地板',
      category: '地板',
      brand: '圣象',
      model: 'DX-8801',
      quantity: 120,
      unit: '㎡',
      estimatedPrice: 48000,
      status: MaterialStatus.ACCEPTED,
      creatorId: users[1].id,
      handlerId: users[0].id,
      idempotencyKey: uuidv4(),
      version: 5,
      actualArrivalDate: new Date('2024-01-15'),
      installationStartDate: new Date('2024-01-18'),
      installationEndDate: new Date('2024-01-20'),
      expectedArrivalDate: new Date('2024-01-14')
    }
  });

  await prisma.changeLog.createMany({
    data: [
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'PENDING_ARRIVAL', newValue: 'ARRIVED', changedBy: users[1].id, changeReason: '主材到货', changedAt: new Date('2024-01-15') },
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'ARRIVED', newValue: 'INSPECTION_PENDING', changedBy: users[1].id, changeReason: '等待验收', changedAt: new Date('2024-01-15T10:00:00') },
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'INSPECTION_PENDING', newValue: 'INSPECTION_PASSED', changedBy: users[0].id, changeReason: '到场验收通过', changedAt: new Date('2024-01-16') },
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'INSPECTION_PASSED', newValue: 'INSTALLATION_PENDING', changedBy: users[0].id, changeReason: '等待安装', changedAt: new Date('2024-01-17') },
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'INSTALLATION_PENDING', newValue: 'INSTALLING', changedBy: users[0].id, changeReason: '开始安装', changedAt: new Date('2024-01-18') },
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'INSTALLING', newValue: 'INSTALLATION_COMPLETED', changedBy: users[0].id, changeReason: '安装完成', changedAt: new Date('2024-01-20') },
      { id: uuidv4(), materialId: normalMaterial.id, fieldName: 'status', oldValue: 'INSTALLATION_COMPLETED', newValue: 'ACCEPTED', changedBy: users[0].id, changeReason: '最终验收通过', changedAt: new Date('2024-01-21') }
    ]
  });

  await prisma.inspection.createMany({
    data: [
      {
        id: uuidv4(),
        materialId: normalMaterial.id,
        type: InspectionType.MATERIAL_ARRIVAL,
        result: 'PASS',
        status: InspectionStatus.PASSED,
        inspectorId: users[0].id,
        inspectedAt: new Date('2024-01-16')
      },
      {
        id: uuidv4(),
        materialId: normalMaterial.id,
        type: InspectionType.INSTALLATION_QUALITY,
        result: 'PASS',
        status: InspectionStatus.PASSED,
        inspectorId: users[0].id,
        inspectedAt: new Date('2024-01-20')
      },
      {
        id: uuidv4(),
        materialId: normalMaterial.id,
        type: InspectionType.FINAL_ACCEPTANCE,
        result: 'PASS',
        status: InspectionStatus.PASSED,
        inspectorId: users[0].id,
        inspectedAt: new Date('2024-01-21')
      }
    ]
  });

  console.log('  ✓ 正常流程样例创建完成');

  console.log('📦 创建主材数据 - 问题流程样例...');
  const problemMaterial = await prisma.material.create({
    data: {
      id: uuidv4(),
      projectId: projects[0].id,
      name: '定制橱柜',
      category: '橱柜',
      brand: '欧派',
      model: 'OP-Kitchen-001',
      quantity: 1,
      unit: '套',
      estimatedPrice: 28500,
      status: MaterialStatus.REJECTED,
      creatorId: users[1].id,
      handlerId: users[0].id,
      idempotencyKey: uuidv4(),
      version: 6,
      actualArrivalDate: new Date('2024-01-20'),
      installationStartDate: new Date('2024-01-22'),
      installationEndDate: new Date('2024-01-25'),
      expectedArrivalDate: new Date('2024-01-18')
    }
  });

  await prisma.changeLog.createMany({
    data: [
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'PENDING_ARRIVAL', newValue: 'ARRIVED', changedBy: users[1].id, changeReason: '主材到货', changedAt: new Date('2024-01-20') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'ARRIVED', newValue: 'INSPECTION_PENDING', changedBy: users[1].id, changeReason: '等待验收', changedAt: new Date('2024-01-20T14:00:00') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSPECTION_PENDING', newValue: 'INSPECTION_FAILED', changedBy: users[0].id, changeReason: '到货验收不通过', changedAt: new Date('2024-01-21') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSPECTION_FAILED', newValue: 'INSPECTION_PENDING', changedBy: users[0].id, changeReason: '重新验收', changedAt: new Date('2024-01-23') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSPECTION_PENDING', newValue: 'INSPECTION_PASSED', changedBy: users[0].id, changeReason: '到场验收通过', changedAt: new Date('2024-01-23T15:00:00') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSPECTION_PASSED', newValue: 'INSTALLATION_PENDING', changedBy: users[0].id, changeReason: '等待安装', changedAt: new Date('2024-01-24') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSTALLATION_PENDING', newValue: 'INSTALLING', changedBy: users[0].id, changeReason: '开始安装', changedAt: new Date('2024-01-22') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSTALLING', newValue: 'INSTALLATION_COMPLETED', changedBy: users[0].id, changeReason: '安装完成', changedAt: new Date('2024-01-25') },
      { id: uuidv4(), materialId: problemMaterial.id, fieldName: 'status', oldValue: 'INSTALLATION_COMPLETED', newValue: 'REJECTED', changedBy: users[0].id, changeReason: '安装验收驳回', changedAt: new Date('2024-01-26') }
    ]
  });

  const problemInspection1 = await prisma.inspection.create({
    data: {
      id: uuidv4(),
      materialId: problemMaterial.id,
      type: InspectionType.MATERIAL_ARRIVAL,
      result: 'FAIL',
      status: InspectionStatus.REJECTED,
      rejectionReason: '门板有划痕，尺寸偏差3mm',
      inspectorId: users[0].id,
      inspectedAt: new Date('2024-01-21')
    }

    const problemInspection2 = await prisma.inspection.create({
      data: {
        id: uuidv4(),
        materialId: problemMaterial.id,
        type: InspectionType.MATERIAL_ARRIVAL,
        result: 'PASS',
        status: InspectionStatus.SUPPLEMENTED,
        supplementNote: '已更换门板，尺寸复测合格',
        inspectorId: users[0].id,
        inspectedAt: new Date('2024-01-23')
      }
    });

    const problemInspection3 = await prisma.inspection.create({
      data: {
        id: uuidv4(),
        materialId: problemMaterial.id,
        type: InspectionType.FINAL_ACCEPTANCE,
        result: 'FAIL',
        status: InspectionStatus.REJECTED,
        rejectionReason: '台面拼接缝隙过大，拉手安装位置偏差',
        inspectorId: users[0].id,
        inspectedAt: new Date('2024-01-26')
    }
  });

  await prisma.evidence.createMany({
    data: [
      { id: uuidv4(), inspectionId: problemInspection1.id, type: EvidenceType.PHOTO, url: 'https://example.com/photos/door-scratch.jpg', description: '门板划痕照片', uploadedBy: users[0].id },
      { id: uuidv4(), inspectionId: problemInspection1.id, type: EvidenceType.PHOTO, url: 'https://example.com/photos/size-check.jpg', description: '尺寸测量记录', uploadedBy: users[0].id },
      { id: uuidv4(), inspectionId: problemInspection2.id, type: EvidenceType.PHOTO, url: 'https://example.com/photos/new-door.jpg', description: '新门板到货验收', uploadedBy: users[0].id },
      { id: uuidv4(), inspectionId: problemInspection3.id, type: EvidenceType.PHOTO, url: 'https://example.com/photos/gap.jpg', description: '台面缝隙过大', uploadedBy: users[0].id },
      { id: uuidv4(), inspectionId: problemInspection3.id, type: EvidenceType.VIDEO, url: 'https://example.com/videos/installation.mp4', description: '安装过程录像', uploadedBy: users[0].id }
    ]
  });

  await prisma.comment.createMany({
    data: [
      { id: uuidv4(), inspectionId: problemInspection1.id, content: '已联系厂家，承诺3天内更换门板', authorId: users[1].id },
      { id: uuidv4(), inspectionId: problemInspection1.id, content: '好的，请更新后续进度', authorId: users[2].id },
      { id: uuidv4(), inspectionId: problemInspection3.id, content: '已安排工人明天上门整改', authorId: users[1].id },
      { id: uuidv4(), materialId: problemMaterial.id, content: '业主对延期表示不满，请加快整改进度', authorId: users[2].id }
    ]
  });

  console.log('  ✓ 问题流程样例创建完成');

  console.log('📦 创建更多主材数据...');
  const moreMaterials = [
    { name: '瓷砖', category: '瓷砖', brand: '马可波罗', model: 'MK-8001', quantity: 200, unit: '片', status: MaterialStatus.INSTALLING },
    { name: '乳胶漆', category: '涂料', brand: '多乐士', model: 'DL-5010', quantity: 15, unit: '桶', status: MaterialStatus.INSPECTION_PENDING },
    { name: '室内门', category: '门窗', brand: 'TATA', model: 'TA-003', quantity: 4, unit: '樘', status: MaterialStatus.PENDING_ARRIVAL },
    { name: '马桶', category: '卫浴', brand: '科勒', model: 'KL-3001', quantity: 2, unit: '个', status: MaterialStatus.INSPECTION_PASSED },
    { name: '花洒套装', category: '卫浴', brand: '摩恩', model: 'ME-2010', quantity: 2, unit: '套', status: MaterialStatus.CANCELLED }
  ];

  await Promise.all(
    moreMaterials.map(m =>
      prisma.material.create({
        data: {
          id: uuidv4(),
          projectId: projects[Math.floor(Math.random() * projects.length)].id,
          ...m,
          creatorId: users[1].id,
          handlerId: users[0].id,
          idempotencyKey: uuidv4(),
          version: 1,
          estimatedPrice: Math.floor(Math.random() * 50000) + 5000
        }
      })
    )
  );
  console.log(`  ✓ 创建了 ${moreMaterials.length} 个补充主材`);

  await prisma.auditLog.createMany({
    data: [
      { id: uuidv4(), userId: users[0].id, action: 'CREATE_MATERIAL', materialId: normalMaterial.id, details: '{"name":"实木地板"}', createdAt: new Date('2024-01-10') },
      { id: uuidv4(), userId: users[0].id, action: 'STATUS_CHANGE', materialId: normalMaterial.id, details: '{"oldStatus":"PENDING_ARRIVAL","newStatus":"ARRIVED"}', createdAt: new Date('2024-01-15') },
      { id: uuidv4(), userId: users[0].id, action: 'CREATE_INSPECTION', materialId: normalMaterial.id, details: '{"type":"MATERIAL_ARRIVAL","result":"PASS"}', createdAt: new Date('2024-01-16') },
      { id: uuidv4(), userId: users[0].id, action: 'CREATE_INSPECTION', materialId: problemMaterial.id, details: '{"type":"MATERIAL_ARRIVAL","result":"FAIL"}', createdAt: new Date('2024-01-21') },
      { id: uuidv4(), userId: users[0].id, action: 'SUPPLEMENT_INSPECTION', materialId: problemMaterial.id, details: '{"supplementNote":"已更换门板"}', createdAt: new Date('2024-01-23') },
      { id: uuidv4(), userId: users[0].id, action: 'REJECT_INSPECTION', materialId: problemMaterial.id, details: '{"rejectionReason":"台面拼接缝隙过大"}', createdAt: new Date('2024-01-26') }
    ]
  });

  console.log('\n🎉 种子数据创建完成!');
  console.log('\n📋 测试账号 (在请求头 x-user-id 中使用以下ID):');
  users.forEach(u => {
    console.log(`  ${u.role.padEnd(18)}: ${u.id} (${u.name})`);
  });
  console.log('\n🏗️  项目ID:');
  projects.forEach(p => {
    console.log(`  ${p.name}: ${p.id}`);
  });
  console.log('\n📦 主材ID:');
  console.log(`  正常流程(实木地板): ${normalMaterial.id}`);
  console.log(`  问题流程(定制橱柜): ${problemMaterial.id}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
