import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupplierService } from '../modules/supplier/supplier.service';
import { ProjectService } from '../modules/project/project.service';
import { PersonService } from '../modules/person/person.service';
import { CredentialService } from '../modules/credential/credential.service';
import { MaterialService } from '../modules/material/material.service';
import { SettlementService } from '../modules/settlement/settlement.service';
import { CheckinService } from '../modules/checkin/checkin.service';
import { ProjectStatus, ProjectPhase } from '../common/enums/project.enum';
import { CredentialType, CredentialStatus } from '../common/enums/credential.enum';
import { PersonType, CheckinType } from '../common/enums/checkin.enum';
import { MaterialStatus } from '../common/enums/material.enum';
import { SettlementStatus } from '../common/enums/settlement.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('开始创建测试数据...');

    const supplierService = app.get(SupplierService);
    const projectService = app.get(ProjectService);
    const personService = app.get(PersonService);
    const credentialService = app.get(CredentialService);
    const materialService = app.get(MaterialService);
    const settlementService = app.get(SettlementService);
    const checkinService = app.get(CheckinService);

    console.log('\n=== 1. 创建供应商 ===');
    const suppliers = [];
    suppliers.push(await supplierService.create({
      code: 'SUP001',
      name: '上海精工展览展示有限公司',
      contactPerson: '张经理',
      phone: '13800138001',
      email: 'zhang@shjg.com',
      address: '上海市浦东新区世纪大道100号',
      businessScope: '展台搭建、木结构制作、美工',
      isActive: true,
    }));
    suppliers.push(await supplierService.create({
      code: 'SUP002',
      name: '北京电力工程有限公司',
      contactPerson: '李工',
      phone: '13800138002',
      email: 'li@bjdl.com',
      address: '北京市朝阳区建国路88号',
      businessScope: '电力施工、照明系统、弱电工程',
      isActive: true,
    }));
    suppliers.push(await supplierService.create({
      code: 'SUP003',
      name: '广州物流运输公司',
      contactPerson: '王队长',
      phone: '13800138003',
      email: 'wang@gzwl.com',
      address: '广州市白云区机场路1000号',
      businessScope: '货物运输、仓储、配送',
      isActive: true,
    }));
    console.log('供应商创建完成:', suppliers.length);

    console.log('\n=== 2. 创建项目 ===');
    const projects = [];
    
    const normalProject = await projectService.create({
      projectNo: 'PRJ2025001',
      name: '2025上海国际汽车工业展览会 - 宝马展台',
      description: '宝马品牌主展台搭建项目，面积500平米，包含接待区、展示区、互动区、VIP室',
      status: ProjectStatus.IN_PROGRESS,
      startDate: '2025-04-10',
      endDate: '2025-04-28',
      constructionStartDate: '2025-04-10',
      constructionEndDate: '2025-04-15',
      exhibitionStartDate: '2025-04-16',
      exhibitionEndDate: '2025-04-25',
      teardownStartDate: '2025-04-26',
      teardownEndDate: '2025-04-28',
      venue: '国家会展中心（上海）',
      boothNo: '7.1馆 7A15',
      coordinator: '陈明',
      coordinatorPhone: '13900139001',
      siteSupervisor: '林强',
      siteSupervisorPhone: '13900139002',
      supplierId: suppliers[0].id,
      budgetAmount: 2500000,
    });
    await projectService.updatePhase(normalProject.id, ProjectPhase.CONSTRUCTION, 'system');
    projects.push(normalProject);

    const problemProject = await projectService.create({
      projectNo: 'PRJ2025002',
      name: '2025北京国际科技产业博览会 - 华为展台',
      description: '华为科技展台，展示最新5G技术和智能终端产品',
      status: ProjectStatus.PREPARING,
      startDate: '2025-05-01',
      endDate: '2025-05-15',
      constructionStartDate: '2025-05-01',
      constructionEndDate: '2025-05-04',
      exhibitionStartDate: '2025-05-05',
      exhibitionEndDate: '2025-05-12',
      teardownStartDate: '2025-05-13',
      teardownEndDate: '2025-05-15',
      venue: '中国国际展览中心（顺义馆）',
      boothNo: 'E1馆 E1001',
      coordinator: '赵华',
      coordinatorPhone: '13900139003',
      siteSupervisor: '周涛',
      siteSupervisorPhone: '13900139004',
      supplierId: suppliers[1].id,
      budgetAmount: 3800000,
    });
    projects.push(problemProject);

    const completedProject = await projectService.create({
      projectNo: 'PRJ2025003',
      name: '2025春季广交会 - 家电展区',
      description: '美的、格力联合展台',
      status: ProjectStatus.COMPLETED,
      startDate: '2025-03-01',
      endDate: '2025-03-15',
      venue: '广州琶洲会展中心',
      boothNo: 'A区 3.1馆',
      coordinator: '孙伟',
      coordinatorPhone: '13900139005',
      supplierId: suppliers[0].id,
      budgetAmount: 1200000,
    });
    projects.push(completedProject);
    console.log('项目创建完成:', projects.length);

    console.log('\n=== 3. 创建人员 ===');
    const persons = [];
    const personData = [
      { idCardNo: '310101199001010001', name: '王建国', type: PersonType.STAFF, phone: '13800138101', supplierId: null, position: '项目总监' },
      { idCardNo: '310101199001010002', name: '刘芳', type: PersonType.STAFF, phone: '13800138102', supplierId: null, position: '现场经理' },
      { idCardNo: '310101199001010003', name: '陈小明', type: PersonType.SUPPLIER, phone: '13800138103', supplierId: suppliers[0].id, position: '木工组长' },
      { idCardNo: '310101199001010004', name: '张伟', type: PersonType.SUPPLIER, phone: '13800138104', supplierId: suppliers[0].id, position: '美工' },
      { idCardNo: '310101199001010005', name: '李刚', type: PersonType.SUPPLIER, phone: '13800138105', supplierId: suppliers[1].id, position: '电工' },
      { idCardNo: '310101199001010006', name: '赵强', type: PersonType.SUPPLIER, phone: '13800138106', supplierId: suppliers[1].id, position: '电工' },
      { idCardNo: '310101199001010007', name: '孙磊', type: PersonType.CONTRACTOR, phone: '13800138107', supplierId: null, position: '空调安装' },
      { idCardNo: '310101199001010008', name: '周静', type: PersonType.VISITOR, phone: '13800138108', supplierId: null, position: '客户代表' },
      { idCardNo: '310101199001010009', name: '吴涛', type: PersonType.SUPPLIER, phone: '13800138109', supplierId: suppliers[0].id, position: '木工' },
      { idCardNo: '310101199001010010', name: '郑华', type: PersonType.SUPPLIER, phone: '13800138110', supplierId: suppliers[0].id, position: '油漆工' },
      { idCardNo: '310101199001010011', name: '钱进', type: PersonType.SUPPLIER, phone: '13800138111', supplierId: suppliers[2].id, position: '司机' },
      { idCardNo: '310101199001010012', name: '马超', type: PersonType.SUPPLIER, phone: '13800138112', supplierId: suppliers[2].id, position: '装卸工' },
    ];

    for (const p of personData) {
      persons.push(await personService.create(p));
    }
    console.log('人员创建完成:', persons.length);

    console.log('\n=== 4. 创建进场证件（正常流程）===');
    const credentials = [];
    
    const cred1 = await credentialService.create({
      projectId: normalProject.id,
      personId: persons[2].id,
      type: CredentialType.CONSTRUCTION_WORKER,
      validFrom: '2025-04-10',
      validTo: '2025-04-28',
      workArea: '7.1馆 7A15',
      accessLevel: '施工区',
    });
    await credentialService.updateStatus(cred1.id, { status: CredentialStatus.SUBMITTED, operator: '陈小明' });
    await credentialService.updateStatus(cred1.id, { status: CredentialStatus.UNDER_REVIEW, operator: '审核员' });
    await credentialService.updateStatus(cred1.id, { status: CredentialStatus.APPROVED, operator: '刘芳', reviewRemark: '资料齐全，批准进场' });
    await credentialService.updateStatus(cred1.id, { status: CredentialStatus.PRINTED, operator: '制证员' });
    await credentialService.updateStatus(cred1.id, { status: CredentialStatus.ISSUED, operator: '现场保安' });
    credentials.push(cred1);

    const cred2 = await credentialService.create({
      projectId: normalProject.id,
      personId: persons[3].id,
      type: CredentialType.CONSTRUCTION_WORKER,
      validFrom: '2025-04-10',
      validTo: '2025-04-28',
      workArea: '7.1馆 7A15',
      accessLevel: '施工区',
    });
    await credentialService.updateStatus(cred2.id, { status: CredentialStatus.SUBMITTED, operator: '张伟' });
    await credentialService.updateStatus(cred2.id, { status: CredentialStatus.UNDER_REVIEW, operator: '审核员' });
    await credentialService.updateStatus(cred2.id, { status: CredentialStatus.APPROVED, operator: '刘芳', reviewRemark: '批准' });
    credentials.push(cred2);

    const cred3 = await credentialService.create({
      projectId: normalProject.id,
      personId: persons[4].id,
      type: CredentialType.ELECTRICIAN,
      validFrom: '2025-04-10',
      validTo: '2025-04-28',
      workArea: '7.1馆 7A15 配电区',
      accessLevel: '施工区+配电房',
    });
    await credentialService.updateStatus(cred3.id, { status: CredentialStatus.SUBMITTED, operator: '李刚' });
    await credentialService.updateStatus(cred3.id, { status: CredentialStatus.UNDER_REVIEW, operator: '审核员' });
    credentials.push(cred3);

    console.log('\n=== 5. 创建进场证件（问题流程 - 漏办、被拒）===');
    const cred4 = await credentialService.create({
      projectId: problemProject.id,
      personId: persons[5].id,
      type: CredentialType.ELECTRICIAN,
      validFrom: '2025-05-01',
      validTo: '2025-05-15',
      workArea: 'E1馆 E1001',
      accessLevel: '施工区',
      remark: '特种作业证已过期，需要重新提交',
    });
    await credentialService.updateStatus(cred4.id, { status: CredentialStatus.SUBMITTED, operator: '赵强' });
    await credentialService.updateStatus(cred4.id, { status: CredentialStatus.UNDER_REVIEW, operator: '审核员' });
    await credentialService.updateStatus(cred4.id, { status: CredentialStatus.REJECTED, operator: '赵华', reviewRemark: '电工特种作业操作证已过期，请重新提交有效证件' });
    credentials.push(cred4);

    const cred5 = await credentialService.create({
      projectId: problemProject.id,
      personId: persons[6].id,
      type: CredentialType.HEIGHT_WORKER,
      validFrom: '2025-05-01',
      validTo: '2025-05-15',
      workArea: 'E1馆 E1001',
      accessLevel: '高空作业区',
    });
    credentials.push(cred5);

    const cred6 = await credentialService.create({
      projectId: normalProject.id,
      personId: persons[8].id,
      type: CredentialType.CONSTRUCTION_WORKER,
      validFrom: '2025-04-10',
      validTo: '2025-04-28',
      workArea: '7.1馆 7A15',
      accessLevel: '施工区',
    });
    credentials.push(cred6);
    console.log('证件创建完成:', credentials.length);

    console.log('\n=== 6. 创建物料（正常流程）===');
    const materials = [];
    
    const mat1 = await materialService.create({
      projectId: normalProject.id,
      supplierId: suppliers[0].id,
      name: '木结构展台主体',
      category: '结构材料',
      specification: '防火板+钢结构，500㎡',
      quantity: 1,
      unit: '项',
      unitPrice: 800000,
      totalPrice: 800000,
      expectedDeliveryDate: '2025-04-08',
      remark: '主结构材料',
    });
    await materialService.updateStatus(mat1.id, { status: MaterialStatus.PENDING_REVIEW, operator: '陈小明' });
    await materialService.updateStatus(mat1.id, { status: MaterialStatus.APPROVED, operator: '刘芳', reviewRemark: '规格符合要求' });
    await materialService.updateStatus(mat1.id, { status: MaterialStatus.DELIVERED, operator: '系统', receiver: '刘芳' });
    await materialService.updateStatus(mat1.id, { status: MaterialStatus.INSTALLED, operator: '林强' });
    materials.push(mat1);

    const mat2 = await materialService.create({
      projectId: normalProject.id,
      supplierId: suppliers[0].id,
      name: 'LED大屏P2.5',
      category: '影音设备',
      specification: 'P2.5室内全彩屏 20㎡',
      quantity: 1,
      unit: '项',
      unitPrice: 250000,
      totalPrice: 250000,
      expectedDeliveryDate: '2025-04-10',
    });
    await materialService.updateStatus(mat2.id, { status: MaterialStatus.PENDING_REVIEW, operator: '陈小明' });
    await materialService.updateStatus(mat2.id, { status: MaterialStatus.APPROVED, operator: '刘芳' });
    materials.push(mat2);

    console.log('\n=== 7. 创建物料（问题流程 - 版本混乱）===');
    const mat3 = await materialService.create({
      projectId: problemProject.id,
      supplierId: suppliers[0].id,
      name: '接待台石材',
      category: '装饰材料',
      specification: '大理石 爵士白',
      quantity: 20,
      unit: '㎡',
      unitPrice: 800,
      totalPrice: 16000,
      expectedDeliveryDate: '2025-04-25',
      remark: 'V1版本 - 初始设计',
    });
    await materialService.updateStatus(mat3.id, { status: MaterialStatus.PENDING_REVIEW, operator: '供应商' });
    await materialService.updateStatus(mat3.id, { status: MaterialStatus.REJECTED, operator: '赵华', reviewRemark: '客户要求改为鱼肚白，颜色不对' });
    materials.push(mat3);

    const mat3v2 = await materialService.createNewVersion(mat3.id, {
      specification: '大理石 鱼肚白',
      quantity: 20,
      unitPrice: 850,
      remark: 'V2版本 - 客户变更颜色',
    });
    await materialService.updateStatus(mat3v2.id, { status: MaterialStatus.PENDING_REVIEW, operator: '供应商' });
    materials.push(mat3v2);
    console.log('物料创建完成:', materials.length);

    console.log('\n=== 8. 创建对账单（正常流程）===');
    const settlements = [];
    
    const set1 = await settlementService.create({
      projectId: completedProject.id,
      supplierId: suppliers[0].id,
      contractAmount: 1200000,
      settlementItems: '展台搭建、美工制作、运输、撤展',
      remark: '广交会项目结算',
    });
    await settlementService.updateStatus(set1.id, { status: SettlementStatus.PENDING_CONFIRM, operator: '孙伟' });
    await settlementService.supplierConfirm(set1.id, { confirmedAmount: 1200000, supplierRemark: '确认无误' });
    await settlementService.updateStatus(set1.id, { status: SettlementStatus.AUDITING, operator: '系统' });
    await settlementService.updateStatus(set1.id, { status: SettlementStatus.AUDIT_PASSED, operator: '财务', auditAmount: 1180000, remark: '扣除物料损耗罚款20000元' });
    await settlementService.updateStatus(set1.id, { status: SettlementStatus.PAYMENT_SCHEDULED, operator: '财务', expectedPaymentDate: '2025-04-15' });
    await settlementService.updateStatus(set1.id, { status: SettlementStatus.PAID, operator: '出纳' });
    settlements.push(set1);

    console.log('\n=== 9. 创建对账单（问题流程 - 对账中）===');
    const set2 = await settlementService.create({
      projectId: normalProject.id,
      supplierId: suppliers[0].id,
      contractAmount: 2500000,
      settlementItems: '木结构、美工、灯光音响、劳务',
      remark: '宝马项目进度款',
    });
    await settlementService.updateStatus(set2.id, { status: SettlementStatus.PENDING_CONFIRM, operator: '陈明' });
    settlements.push(set2);

    const set3 = await settlementService.create({
      projectId: normalProject.id,
      supplierId: suppliers[1].id,
      contractAmount: 350000,
      settlementItems: '电力工程、照明系统',
      remark: '电力项目预付款',
    });
    await settlementService.updateStatus(set3.id, { status: SettlementStatus.PENDING_CONFIRM, operator: '陈明' });
    await settlementService.supplierConfirm(set3.id, { confirmedAmount: 380000, supplierRemark: '增加了UPS电源配置，总价增加3万' });
    await settlementService.updateStatus(set3.id, { status: SettlementStatus.DISPUTED, operator: '系统' });
    settlements.push(set3);
    console.log('对账单创建完成:', settlements.length);

    console.log('\n=== 10. 创建签到记录 ===');
    const checkins = [];
    
    const checkinDates = ['2025-04-10', '2025-04-11', '2025-04-12'];
    for (const date of checkinDates) {
      checkins.push(await checkinService.create({
        projectId: normalProject.id,
        personId: persons[2].id,
        credentialId: cred1.id,
        type: CheckinType.ENTRY,
        checkinTime: `${date}T08:00:00`,
        checkinPoint: '西1入口',
        temperature: 36.5,
      }));
      checkins.push(await checkinService.create({
        projectId: normalProject.id,
        personId: persons[2].id,
        credentialId: cred1.id,
        type: CheckinType.EXIT,
        checkinTime: `${date}T18:30:00`,
        checkinPoint: '西1入口',
      }));
    }

    checkins.push(await checkinService.create({
      projectId: normalProject.id,
      personId: persons[3].id,
      credentialId: cred2.id,
      type: CheckinType.ENTRY,
      checkinTime: '2025-04-12T09:15:00',
      checkinPoint: '西1入口',
      temperature: 36.7,
    }));
    console.log('签到记录创建完成:', checkins.length);

    console.log('\n=== 测试数据创建完成 ===');
    console.log('\n=== 可直接测试的API端点示例 ===');
    
    console.log('\n【正常流程 - 证件办理全链路】');
    console.log('  GET  /api/projects/PRJ2025001/no');
    console.log('  GET  /api/credentials?projectId=' + normalProject.id);
    console.log('  GET  /api/credentials/' + cred1.id + '/history');
    console.log('  PUT  /api/credentials/' + cred2.id + '/status  (从APPROVED→PRINTED→ISSUED)');

    console.log('\n【问题流程 - 证件漏办/被拒】');
    console.log('  GET  /api/credentials/' + cred4.id);
    console.log('  GET  /api/credentials/' + cred5.id);
    console.log('  GET  /api/credentials/stats?projectId=' + problemProject.id);

    console.log('\n【正常流程 - 物料版本管理】');
    console.log('  GET  /api/materials?projectId=' + normalProject.id);
    console.log('  GET  /api/materials/' + mat1.id + '/history');

    console.log('\n【问题流程 - 物料版本冲突】');
    console.log('  GET  /api/materials/versions/' + mat3.materialNo);
    console.log('  GET  /api/materials/' + mat3.id + '/history');

    console.log('\n【正常流程 - 供应商对账完成】');
    console.log('  GET  /api/settlements/' + set1.id);
    console.log('  GET  /api/settlements/' + set1.id + '/history');

    console.log('\n【问题流程 - 对账争议中】');
    console.log('  GET  /api/settlements/' + set3.id);
    console.log('  GET  /api/settlements/stats?projectId=' + normalProject.id);

    console.log('\n【签到记录查看】');
    console.log('  GET  /api/checkins/today?projectId=' + normalProject.id);
    console.log('  GET  /api/checkins?projectId=' + normalProject.id);

    console.log('\n【项目全景看板】');
    console.log('  GET  /api/projects/' + normalProject.id + '/dashboard');

    console.log('\n数据种子执行完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据种子执行失败:', error);
    process.exit(1);
  }
}

bootstrap();
