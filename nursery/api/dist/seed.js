"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
require("./bootstrap");
const bootstrap_1 = require("./bootstrap");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nursery',
    synchronize: true,
    entities: [bootstrap_1.User, bootstrap_1.Plot, bootstrap_1.Inspection, bootstrap_1.Disease, bootstrap_1.DiseaseTimeline, bootstrap_1.Negotiation],
});
async function seed() {
    await AppDataSource.initialize();
    console.log('数据库连接成功');
    const userRepo = AppDataSource.getRepository(bootstrap_1.User);
    const plotRepo = AppDataSource.getRepository(bootstrap_1.Plot);
    const inspectionRepo = AppDataSource.getRepository(bootstrap_1.Inspection);
    const diseaseRepo = AppDataSource.getRepository(bootstrap_1.Disease);
    const timelineRepo = AppDataSource.getRepository(bootstrap_1.DiseaseTimeline);
    const negotiationRepo = AppDataSource.getRepository(bootstrap_1.Negotiation);
    await negotiationRepo.createQueryBuilder().delete().where('1 = 1').execute();
    await timelineRepo.createQueryBuilder().delete().where('1 = 1').execute();
    await diseaseRepo.createQueryBuilder().delete().where('1 = 1').execute();
    await inspectionRepo.createQueryBuilder().delete().where('1 = 1').execute();
    await plotRepo.createQueryBuilder().delete().where('1 = 1').execute();
    await userRepo.createQueryBuilder().delete().where('1 = 1').execute();
    const zhaoJianguo = userRepo.create({ name: '赵建国', role: bootstrap_1.UserRole.BASE_MANAGER, phone: '13800000001' });
    const zhangMing = userRepo.create({ name: '张明', role: bootstrap_1.UserRole.INSPECTOR, phone: '13800000002' });
    const liFang = userRepo.create({ name: '李芳', role: bootstrap_1.UserRole.INSPECTOR, phone: '13800000003' });
    const wangLei = userRepo.create({ name: '王磊', role: bootstrap_1.UserRole.SALES, phone: '13800000004' });
    const chenXiaohong = userRepo.create({ name: '陈小红', role: bootstrap_1.UserRole.SALES, phone: '13800000005' });
    const [u1, u2, u3, u4, u5] = await userRepo.save([zhaoJianguo, zhangMing, liFang, wangLei, chenXiaohong]);
    console.log('✅ 用户创建完成');
    const plot1 = plotRepo.create({ name: '东区-A3', location: '东区', variety: '香樟', specification: '胸径8cm', quantity: 200, inspectorId: u2.id });
    const plot2 = plotRepo.create({ name: '西区-B7', location: '西区', variety: '银杏', specification: '胸径10cm', quantity: 150, inspectorId: u3.id });
    const plot3 = plotRepo.create({ name: '南区-C2', location: '南区', variety: '桂花', specification: '冠幅1.5m', quantity: 180, inspectorId: u2.id });
    const plot4 = plotRepo.create({ name: '北区-D1', location: '北区', variety: '红叶石楠', specification: '高度60cm', quantity: 120, inspectorId: u3.id });
    const plot5 = plotRepo.create({ name: '中区-E5', location: '中区', variety: '紫薇', specification: '地径5cm', quantity: 100, inspectorId: u2.id });
    const plot6 = plotRepo.create({ name: '东区-A1', location: '东区', variety: '广玉兰', specification: '胸径12cm', quantity: 80, inspectorId: u3.id });
    const plot7 = plotRepo.create({ name: '西区-B2', location: '西区', variety: '樱花', specification: '地径6cm', quantity: 200, inspectorId: u2.id });
    const [p1, p2, p3, p4, p5, p6, p7] = await plotRepo.save([plot1, plot2, plot3, plot4, plot5, plot6, plot7]);
    console.log('✅ 地块创建完成');
    const insp1 = inspectionRepo.create({
        plotId: p1.id, inspectorId: u2.id,
        growthStatus: '良好', soilCondition: '正常', moistureCondition: '适宜',
        remark: '苗木长势良好，无异常', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-15', hasDisease: false,
    });
    const insp2 = inspectionRepo.create({
        plotId: p2.id, inspectorId: u3.id,
        growthStatus: '一般', soilCondition: '偏干', moistureCondition: '不足',
        remark: '发现少量蚜虫', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-16', hasDisease: true,
    });
    const insp3a = inspectionRepo.create({
        plotId: p3.id, inspectorId: u2.id,
        growthStatus: '良好', soilCondition: '正常', moistureCondition: '适宜',
        remark: '苗木长势正常', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-10', hasDisease: false,
    });
    const insp3b = inspectionRepo.create({
        plotId: p3.id, inspectorId: u2.id,
        growthStatus: '较差', soilCondition: '偏湿', moistureCondition: '过湿',
        remark: '发现根腐病症状，部分苗木叶片发黄', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-18', hasDisease: true,
    });
    const insp4 = inspectionRepo.create({
        plotId: p4.id, inspectorId: u3.id,
        growthStatus: '一般', soilCondition: '正常', moistureCondition: '适宜',
        remark: '发现叶斑病', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-12', hasDisease: true,
    });
    const insp5 = inspectionRepo.create({
        plotId: p5.id, inspectorId: u2.id,
        growthStatus: '良好', soilCondition: '正常', moistureCondition: '适宜',
        remark: '苗木长势良好，无异常', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-20', hasDisease: false,
    });
    const insp6 = inspectionRepo.create({
        plotId: p6.id, inspectorId: u3.id,
        growthStatus: '较差', soilCondition: '板结', moistureCondition: '过湿',
        remark: '发现介壳虫，危害严重，部分枝条枯死', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-22', hasDisease: true,
    });
    const insp7 = inspectionRepo.create({
        plotId: p7.id, inspectorId: u2.id,
        growthStatus: '良好', soilCondition: '正常', moistureCondition: '适宜',
        remark: '无异常，花期正常', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-21', hasDisease: false,
    });
    const insp8 = inspectionRepo.create({
        plotId: p1.id, inspectorId: u2.id,
        growthStatus: '良好', soilCondition: '正常', moistureCondition: '适宜',
        remark: '定期巡查，苗木正常', status: bootstrap_1.InspectionStatus.COMPLETED,
        inspectionDate: '2026-05-25', hasDisease: false,
    });
    const insp9 = inspectionRepo.create({
        plotId: p6.id, inspectorId: u3.id,
        growthStatus: '良好', soilCondition: '正常', moistureCondition: '适宜',
        remark: '', status: bootstrap_1.InspectionStatus.PENDING,
        inspectionDate: '2026-05-28', hasDisease: false,
    });
    const [i1, i2, i3a, i3b, i4, i5, i6, i7, i8, i9] = await inspectionRepo.save([
        insp1, insp2, insp3a, insp3b, insp4, insp5, insp6, insp7, insp8, insp9,
    ]);
    console.log('✅ 巡查记录创建完成');
    const disease2 = diseaseRepo.create({
        inspectionId: i2.id, plotId: p2.id, reporterId: u3.id,
        type: '蚜虫', severity: bootstrap_1.DiseaseSeverity.MINOR,
        description: '银杏叶片背面发现少量蚜虫聚集，约5棵受影响',
        affectedQuantity: 5, status: bootstrap_1.DiseaseStatus.RESOLVED,
        reportedAt: new Date('2026-05-16T10:00:00'),
        confirmedAt: new Date('2026-05-16T14:00:00'),
        resolvedAt: new Date('2026-05-19T16:00:00'),
        isOverdue: false,
    });
    const disease3b = diseaseRepo.create({
        inspectionId: i3b.id, plotId: p3.id, reporterId: u2.id,
        type: '根腐病', severity: bootstrap_1.DiseaseSeverity.MAJOR,
        description: '桂花根部腐烂，50棵受影响，部分苗木叶片发黄枯萎，疑似排水不畅导致',
        affectedQuantity: 50, status: bootstrap_1.DiseaseStatus.CONFIRMED,
        reportedAt: new Date('2026-05-18T09:00:00'),
        confirmedAt: new Date('2026-05-18T15:00:00'),
        isOverdue: false,
    });
    const disease4 = diseaseRepo.create({
        inspectionId: i4.id, plotId: p4.id, reporterId: u3.id,
        type: '叶斑病', severity: bootstrap_1.DiseaseSeverity.MODERATE,
        description: '红叶石楠叶片出现褐色斑点，约20棵受影响，已有17天未处理',
        affectedQuantity: 20, status: bootstrap_1.DiseaseStatus.REPORTED,
        reportedAt: new Date('2026-05-12T11:00:00'),
        isOverdue: true,
    });
    const disease6 = diseaseRepo.create({
        inspectionId: i6.id, plotId: p6.id, reporterId: u3.id,
        type: '介壳虫', severity: bootstrap_1.DiseaseSeverity.MAJOR,
        description: '广玉兰发现大量介壳虫，30棵受影响，枝条上布满白色蜡质分泌物，部分叶片发黄脱落',
        affectedQuantity: 30, status: bootstrap_1.DiseaseStatus.TREATING,
        reportedAt: new Date('2026-05-22T09:00:00'),
        confirmedAt: new Date('2026-05-22T11:30:00'),
        isOverdue: false,
    });
    const [d2, d3b, d4, d6] = await diseaseRepo.save([disease2, disease3b, disease4, disease6]);
    console.log('✅ 病害记录创建完成');
    const tl2_1 = timelineRepo.create({
        diseaseId: d2.id, operatorId: u3.id, action: '上报病害',
        content: '发现银杏蚜虫，轻度危害，5棵受影响', operatedAt: new Date('2026-05-16T10:00:00'),
    });
    const tl2_2 = timelineRepo.create({
        diseaseId: d2.id, operatorId: u1.id, action: '确认病害',
        content: '确认为蚜虫危害，需及时处理，建议喷洒吡虫啉', operatedAt: new Date('2026-05-16T14:00:00'),
    });
    const tl2_3 = timelineRepo.create({
        diseaseId: d2.id, operatorId: u1.id, action: '开始处理',
        content: '安排张明喷洒吡虫啉1000倍液进行防治', operatedAt: new Date('2026-05-17T09:00:00'),
    });
    const tl2_4 = timelineRepo.create({
        diseaseId: d2.id, operatorId: u3.id, action: '处理完成',
        content: '蚜虫已清除，复查确认苗木恢复正常，无新虫口', operatedAt: new Date('2026-05-19T16:00:00'),
    });
    const tl3b_1 = timelineRepo.create({
        diseaseId: d3b.id, operatorId: u2.id, action: '上报病害',
        content: '发现桂花根腐病，重度危害，50棵受影响，根部腐烂有异味', operatedAt: new Date('2026-05-18T09:00:00'),
    });
    const tl3b_2 = timelineRepo.create({
        diseaseId: d3b.id, operatorId: u1.id, action: '确认病害',
        content: '确认为根腐病，系排水不畅积水所致，需启动协商流程处理补植', operatedAt: new Date('2026-05-18T15:00:00'),
    });
    const tl3b_3 = timelineRepo.create({
        diseaseId: d3b.id, operatorId: u1.id, action: '开始处理',
        content: '已开沟排水，对受影响较轻的苗木灌根处理，严重的移除集中处理', operatedAt: new Date('2026-05-19T08:00:00'),
    });
    const tl4_1 = timelineRepo.create({
        diseaseId: d4.id, operatorId: u3.id, action: '上报病害',
        content: '发现红叶石楠叶斑病，中度危害，20棵受影响，叶片出现褐色圆斑', operatedAt: new Date('2026-05-12T11:00:00'),
    });
    const tl4_2 = timelineRepo.create({
        diseaseId: d4.id, operatorId: u1.id, action: '系统提醒',
        content: '⚠️ 病害上报已超过3天未处理，请及时跟进！', operatedAt: new Date('2026-05-15T09:00:00'),
    });
    const tl4_3 = timelineRepo.create({
        diseaseId: d4.id, operatorId: u1.id, action: '系统提醒',
        content: '⚠️ 病害上报已超过7天未处理，存在客户索赔风险！', operatedAt: new Date('2026-05-19T09:00:00'),
    });
    const tl6_1 = timelineRepo.create({
        diseaseId: d6.id, operatorId: u3.id, action: '上报病害',
        content: '发现广玉兰介壳虫，重度危害，30棵受影响，枝条布满虫体', operatedAt: new Date('2026-05-22T09:00:00'),
    });
    const tl6_2 = timelineRepo.create({
        diseaseId: d6.id, operatorId: u1.id, action: '确认病害',
        content: '确认为介壳虫危害，需立即处理，防止扩散', operatedAt: new Date('2026-05-22T11:30:00'),
    });
    const tl6_3 = timelineRepo.create({
        diseaseId: d6.id, operatorId: u1.id, action: '开始处理',
        content: '安排人工刮除虫体+喷洒噻嗪酮，连续3次，间隔7天', operatedAt: new Date('2026-05-23T08:00:00'),
    });
    const tl6_4 = timelineRepo.create({
        diseaseId: d6.id, operatorId: u4.id, action: '启动协商',
        content: '该批次广玉兰原计划5月25日发往上海客户，虫害可能影响交付', operatedAt: new Date('2026-05-24T14:00:00'),
    });
    await timelineRepo.save([
        tl2_1, tl2_2, tl2_3, tl2_4,
        tl3b_1, tl3b_2, tl3b_3,
        tl4_1, tl4_2, tl4_3,
        tl6_1, tl6_2, tl6_3, tl6_4,
    ]);
    console.log('✅ 病害时间线创建完成');
    const neg3b = negotiationRepo.create({
        diseaseId: d3b.id, initiatorId: u4.id,
        salesOpinion: '客户杭州绿城原定5月30日起苗，南区-C2桂花需供应45棵。现50棵受根腐病影响，其中20棵已死亡。建议：1. 对受损桂花进行补植，保留健康苗木加强养护；2. 从备用苗床调苗满足交付；3. 与客户沟通延迟部分交付。',
        baseOpinion: '同意补植方案，已安排开沟改善排水。备用苗床有桂花30棵冠幅1.2m可应急。补植30棵（含死亡替换20棵+预防10棵），预计6月5日前完成。建议与客户协商延迟10天交付，确保补植后苗木状态良好。',
        replantQuantity: 30, replantVariety: '桂花', replantDate: '2026-06-01',
        status: bootstrap_1.NegotiationStatus.CONFIRMED,
        confirmedById: u1.id,
        confirmedAt: new Date('2026-05-20T10:00:00'),
    });
    const neg6 = negotiationRepo.create({
        diseaseId: d6.id, initiatorId: u5.id,
        salesOpinion: '上海客户原订5月25日发广玉兰25棵，东区-A1现20棵受介壳虫影响。客户表示如不能按时交付将按合同索赔5%违约金（约¥12,000）。建议：1. 优先处理虫害确保健康；2. 与客户沟通延迟3天交付；3. 如客户不同意，从其他基地调苗。',
        baseOpinion: '虫害正在处理中，预计5月28日可控制。建议先与客户沟通延迟交付，同时联系周边基地调苗备选。如虫害控制效果好，可选择性发货未受影响的健康苗。',
        replantQuantity: 25, replantVariety: '广玉兰', replantDate: '2026-05-28',
        status: bootstrap_1.NegotiationStatus.IN_PROGRESS,
    });
    const neg7 = negotiationRepo.create({
        diseaseId: d4.id, initiatorId: u4.id,
        salesOpinion: '红叶石楠原计划供应苏州景观项目100棵，现叶斑病影响20棵。项目6月1日进场，时间紧迫。建议：1. 紧急处理叶斑病；2. 筛选健康苗木优先发货；3. 协商补苗方案。',
        status: bootstrap_1.NegotiationStatus.PENDING,
    });
    await negotiationRepo.save([neg3b, neg6, neg7]);
    console.log('✅ 协商记录创建完成');
    console.log('\n🎉 种子数据创建完成！');
    console.log('\n📋 测试样例说明：');
    console.log('\n【正常流程 - 银杏蚜虫】');
    console.log('  5月16日 李芳巡查发现→赵建国确认→安排张明喷药→5月19日复查完成');
    console.log('  涉及：巡查#2 → 病害#2（已解决）');
    console.log('\n【问题流程 - 红叶石楠叶斑病】');
    console.log('  5月12日 李芳上报→无人跟进→5月15日系统提醒→5月19日再次提醒→5月26日仍未处理（已逾期）');
    console.log('  涉及：巡查#4 → 病害#4（逾期未处理）→ 协商#3（待处理）');
    console.log('\n【复杂流程 - 桂花根腐病】');
    console.log('  5月18日 张明发现→赵建国确认→启动协商→销售/基地意见→5月20日确认补植30棵');
    console.log('  涉及：巡查#5 → 病害#3（处理中）→ 协商#1（已确认）');
    console.log('\n【进行中 - 广玉兰介壳虫】');
    console.log('  5月22日 李芳发现→赵建国确认→开始处理→销售担心交付→5月24日启动协商');
    console.log('  涉及：巡查#7 → 病害#6（处理中）→ 协商#2（协商中）');
    console.log('\n💡 多条件筛选建议：');
    console.log('  - 按状态筛：逾期病害 / 协商中');
    console.log('  - 按时间筛：5月15日-5月25日');
    console.log('  - 按严重程度：重度');
    console.log('  - 按地块：南区 / 东区');
    console.log('  - 组合筛选：5月病害 + 重度 + 未解决');
    await AppDataSource.destroy();
}
seed().catch(err => {
    console.error('❌ 种子数据创建失败:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map