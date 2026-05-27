const { db, initDatabase } = require('./database');
const { hashPassword } = require('./auth');
const dayjs = require('dayjs');

function seed() {
  initDatabase();
  
  console.log('开始生成演示数据...');

  db.exec('BEGIN TRANSACTION');

  try {
    const users = [
      { username: 'manager', password: hashPassword('123456'), name: '张明远', role: 'manager', phone: '13800138001' },
      { username: 'sales1', password: hashPassword('123456'), name: '李雪琴', role: 'sales', phone: '13800138002' },
      { username: 'sales2', password: hashPassword('123456'), name: '王建国', role: 'sales', phone: '13800138003' },
      { username: 'warehouse1', password: hashPassword('123456'), name: '赵大宝', role: 'warehouse', phone: '13800138004' },
      { username: 'warehouse2', password: hashPassword('123456'), name: '陈小芳', role: 'warehouse', phone: '13800138005' }
    ];

    const userInsert = db.prepare('INSERT INTO users (username, password, name, role, phone) VALUES (?, ?, ?, ?, ?)');
    users.forEach(u => userInsert.run(u.username, u.password, u.name, u.role, u.phone));

    const warehouses = [
      { code: 'WH001', name: '杭州总仓', location: '杭州市余杭区良渚路88号', manager_id: 4 },
      { code: 'WH002', name: '上海分仓', location: '上海市嘉定区安亭镇66号', manager_id: 5 },
      { code: 'WH003', name: '北京分仓', location: '北京市大兴区亦庄开发区55号', manager_id: 4 }
    ];

    const whInsert = db.prepare('INSERT INTO warehouses (code, name, location, manager_id) VALUES (?, ?, ?, ?)');
    warehouses.forEach(w => whInsert.run(w.code, w.name, w.location, w.manager_id));

    const userWarehouseAccess = [
      { user_id: 2, warehouse_id: 1 },
      { user_id: 2, warehouse_id: 2 },
      { user_id: 3, warehouse_id: 1 },
      { user_id: 3, warehouse_id: 3 },
      { user_id: 4, warehouse_id: 1 },
      { user_id: 4, warehouse_id: 3 },
      { user_id: 5, warehouse_id: 2 }
    ];

    const uwaInsert = db.prepare('INSERT INTO user_warehouse_access (user_id, warehouse_id) VALUES (?, ?)');
    userWarehouseAccess.forEach(u => uwaInsert.run(u.user_id, u.warehouse_id));

    const products = [
      { sku: 'TEA001', name: '西湖龙井-明前特级', category: '绿茶', spec: '250g/盒', unit: '盒', base_price: 388.00, description: '杭州西湖核心产区，明前一芽一叶' },
      { sku: 'TEA002', name: '西湖龙井-雨前一级', category: '绿茶', spec: '250g/盒', unit: '盒', base_price: 218.00, description: '杭州西湖产区，雨前采摘' },
      { sku: 'TEA003', name: '武夷山大红袍-岩骨花香', category: '乌龙茶', spec: '125g/盒', unit: '盒', base_price: 458.00, description: '武夷山正岩核心区，传统炭焙' },
      { sku: 'TEA004', name: '武夷肉桂-果香', category: '乌龙茶', spec: '125g/盒', unit: '盒', base_price: 328.00, description: '武夷山马头岩，果香明显' },
      { sku: 'TEA005', name: '福鼎白茶-白毫银针', category: '白茶', spec: '150g/盒', unit: '盒', base_price: 588.00, description: '福鼎磻溪，头采白毫银针' },
      { sku: 'TEA006', name: '福鼎白茶-寿眉饼', category: '白茶', spec: '350g/饼', unit: '饼', base_price: 168.00, description: '2020年寿眉饼，转化良好' },
      { sku: 'TEA007', name: '云南普洱-班章古树', category: '普洱茶', spec: '357g/饼', unit: '饼', base_price: 888.00, description: '班章村古树纯料，2021年春茶' },
      { sku: 'TEA008', name: '云南普洱-熟普宫廷', category: '普洱茶', spec: '250g/罐', unit: '罐', base_price: 268.00, description: '宫廷级熟普，金毫显露' },
      { sku: 'TEA009', name: '安溪铁观音-清香型', category: '乌龙茶', spec: '250g/盒', unit: '盒', base_price: 188.00, description: '安溪感德镇，正味清香' },
      { sku: 'TEA010', name: '祁门红茶-特级', category: '红茶', spec: '200g/盒', unit: '盒', base_price: 198.00, description: '祁门核心产区，蜜香明显' }
    ];

    const prodInsert = db.prepare('INSERT INTO products (sku, name, category, spec, unit, base_price, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    products.forEach(p => prodInsert.run(p.sku, p.name, p.category, p.spec, p.unit, p.base_price, p.description));

    const batches = [];
    const batchDates = [
      { prod: 1, date: '2024-03-28', price: 360.00, qty: 120 },
      { prod: 1, date: '2024-04-05', price: 360.00, qty: 80 },
      { prod: 2, date: '2024-04-10', price: 195.00, qty: 200 },
      { prod: 3, date: '2024-02-15', price: 420.00, qty: 60 },
      { prod: 3, date: '2024-03-20', price: 420.00, qty: 40 },
      { prod: 4, date: '2024-02-20', price: 295.00, qty: 90 },
      { prod: 5, date: '2024-03-15', price: 550.00, qty: 50 },
      { prod: 6, date: '2023-10-10', price: 150.00, qty: 150 },
      { prod: 7, date: '2021-04-18', price: 850.00, qty: 30 },
      { prod: 8, date: '2023-08-15', price: 240.00, qty: 80 },
      { prod: 9, date: '2024-04-08', price: 165.00, qty: 120 },
      { prod: 10, date: '2024-03-25', price: 175.00, qty: 100 }
    ];

    for (let i = 0; i < batchDates.length; i++) {
      const b = batchDates[i];
      batches.push({
        batch_no: `B2024${String(i + 1).padStart(4, '0')}`,
        product_id: b.prod,
        warehouse_id: 1,
        quantity: b.qty,
        available_quantity: Math.max(0, b.qty - Math.floor(Math.random() * 20)),
        unit_price: b.price,
        production_date: b.date,
        expiry_date: dayjs(b.date).add(2, 'year').format('YYYY-MM-DD'),
        supplier: ['杭州茶厂有限公司', '武夷山岩茶厂', '福鼎白茶集团', '云南普洱茶厂'][Math.floor(Math.random() * 4)],
        inbound_no: `RK2024${String(i + 1).padStart(4, '0')}`,
        inbound_date: dayjs(b.date).add(3, 'day').format('YYYY-MM-DD'),
        remark: `批次${i + 1}正常入库`
      });
    }

    batches.push({
      batch_no: 'B20240013',
      product_id: 1,
      warehouse_id: 2,
      quantity: 30,
      available_quantity: 25,
      unit_price: 360.00,
      production_date: '2024-03-28',
      expiry_date: '2026-03-28',
      supplier: '杭州茶厂有限公司',
      inbound_no: 'RK20240013',
      inbound_date: '2024-04-01',
      remark: '上海分仓调拨入库'
    });

    const batchInsert = db.prepare('INSERT INTO inventory_batches (batch_no, product_id, warehouse_id, quantity, available_quantity, unit_price, production_date, expiry_date, supplier, inbound_no, inbound_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    batches.forEach(b => batchInsert.run(b.batch_no, b.product_id, b.warehouse_id, b.quantity, b.available_quantity, b.unit_price, b.production_date, b.expiry_date, b.supplier, b.inbound_no, b.inbound_date, b.remark));

    const stockTakePlans = [
      {
        plan_no: 'PD20240401', warehouse_id: 1, title: '2024年4月上旬库存盘点',
        type: 'periodic', status: 'completed', planned_date: '2024-04-08',
        start_time: '2024-04-08 09:00:00', end_time: '2024-04-08 17:30:00',
        creator_id: 1, executor_id: 4, reviewer_id: 1,
        remark: '月度常规盘点，重点核对批次效期'
      },
      {
        plan_no: 'PD20240415', warehouse_id: 1, title: '武夷岩茶专项盘点',
        type: 'special', status: 'completed', planned_date: '2024-04-15',
        start_time: '2024-04-15 10:00:00', end_time: '2024-04-15 16:00:00',
        creator_id: 1, executor_id: 4, reviewer_id: 1,
        remark: '客户反映批次问题，专项核查大红袍和肉桂库存'
      },
      {
        plan_no: 'PD20240501', warehouse_id: 1, title: '五一节前库存盘点',
        type: 'periodic', status: 'completed', planned_date: '2024-04-28',
        start_time: '2024-04-28 09:00:00', end_time: '2024-04-28 18:00:00',
        creator_id: 1, executor_id: 4, reviewer_id: 1,
        remark: '节前备货盘点，确保节日供应'
      },
      {
        plan_no: 'PD20240510', warehouse_id: 2, title: '上海分仓季度盘点',
        type: 'periodic', status: 'completed', planned_date: '2024-05-10',
        start_time: '2024-05-10 09:30:00', end_time: '2024-05-10 17:00:00',
        creator_id: 1, executor_id: 5, reviewer_id: 1,
        remark: '上海分仓季度全面盘点'
      },
      {
        plan_no: 'PD20240520', warehouse_id: 1, title: '5月中旬库存抽盘',
        type: 'spot_check', status: 'in_progress', planned_date: '2024-05-20',
        start_time: '2024-05-20 09:00:00', end_time: null,
        creator_id: 1, executor_id: 4, reviewer_id: null,
        remark: '重点抽查高价值品类库存'
      }
    ];

    const takePlanInsert = db.prepare('INSERT INTO stock_take_plans (plan_no, warehouse_id, title, type, status, planned_date, start_time, end_time, creator_id, executor_id, reviewer_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stockTakePlans.forEach(p => takePlanInsert.run(p.plan_no, p.warehouse_id, p.title, p.type, p.status, p.planned_date, p.start_time, p.end_time, p.creator_id, p.executor_id, p.reviewer_id, p.remark));

    const stockTakeItems = [];
    const takeResults = [
      { plan: 1, prod: 1, batch: 1, sys: 120, actual: 118, diff: -2, result: 'shortage', remark: '盘亏2盒，客户品鉴用茶' },
      { plan: 1, prod: 1, batch: 2, sys: 80, actual: 80, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 1, prod: 2, batch: 3, sys: 200, actual: 200, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 1, prod: 3, batch: 4, sys: 60, actual: 58, diff: -2, result: 'shortage', remark: '盘亏2盒，仓储破损' },
      { plan: 1, prod: 3, batch: 5, sys: 40, actual: 40, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 1, prod: 4, batch: 6, sys: 90, actual: 90, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 1, prod: 5, batch: 7, sys: 50, actual: 50, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 1, prod: 6, batch: 8, sys: 150, actual: 149, diff: -1, result: 'shortage', remark: '盘亏1饼，仓库人员误拿' },
      { plan: 2, prod: 3, batch: 4, sys: 58, actual: 58, diff: 0, result: 'normal', remark: '专项核对无误' },
      { plan: 2, prod: 3, batch: 5, sys: 40, actual: 40, diff: 0, result: 'normal', remark: '专项核对无误' },
      { plan: 2, prod: 4, batch: 6, sys: 90, actual: 90, diff: 0, result: 'normal', remark: '专项核对无误' },
      { plan: 3, prod: 1, batch: 1, sys: 118, actual: 115, diff: -3, result: 'shortage', remark: '盘亏3盒，2盒试饮1盒待查' },
      { plan: 3, prod: 1, batch: 2, sys: 80, actual: 80, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 3, prod: 2, batch: 3, sys: 200, actual: 198, diff: -2, result: 'shortage', remark: '盘亏2盒，客户样品' },
      { plan: 3, prod: 3, batch: 4, sys: 58, actual: 58, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 3, prod: 7, batch: 9, sys: 30, actual: 29, diff: -1, result: 'shortage', remark: '盘亏1饼，包装破损' },
      { plan: 4, prod: 1, batch: 13, sys: 25, actual: 25, diff: 0, result: 'normal', remark: '账实相符' },
      { plan: 5, prod: 5, batch: 7, sys: 50, actual: null, diff: null, result: null, remark: '待盘点' },
      { plan: 5, prod: 7, batch: 9, sys: 29, actual: null, diff: null, result: null, remark: '待盘点' },
      { plan: 5, prod: 3, batch: 4, sys: 58, actual: null, diff: null, result: null, remark: '待盘点' }
    ];

    takeResults.forEach((item, idx) => {
      const product = products[item.prod - 1];
      const batch = batches[item.batch - 1];
      const diffAmount = item.diff ? (item.diff * batch.unit_price).toFixed(2) : null;
      stockTakeItems.push({
        plan_id: item.plan,
        product_id: item.prod,
        batch_id: item.batch,
        system_quantity: item.sys,
        actual_quantity: item.actual,
        difference: item.diff,
        unit_price: batch.unit_price,
        difference_amount: diffAmount,
        check_result: item.result,
        remark: item.remark
      });
    });

    const takeItemInsert = db.prepare('INSERT INTO stock_take_items (plan_id, product_id, batch_id, system_quantity, actual_quantity, difference, unit_price, difference_amount, check_result, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stockTakeItems.forEach(i => takeItemInsert.run(i.plan_id, i.product_id, i.batch_id, i.system_quantity, i.actual_quantity, i.difference, i.unit_price, i.difference_amount, i.check_result, i.remark));

    const lossReports = [
      {
        report_no: 'SS20240410001', warehouse_id: 1,
        title: '4月10日库存盘点盘亏处理',
        loss_type: 'inventory_shortage', loss_reason: '2024年4月上旬盘点发现盘亏，主要为包装破损和试饮消耗',
        total_quantity: 5, total_amount: 1890.00, status: 'approved',
        reporter_id: 4, reviewer_id: 1, approver_id: 1,
        reported_at: '2024-04-10 14:30:00', reviewed_at: '2024-04-10 16:00:00', approved_at: '2024-04-11 09:00:00',
        related_stock_take_id: 1,
        remark: '其中2盒西湖龙井为客户品鉴用茶，2盒大红袍为仓储破损，1饼寿眉为仓库人员误操作'
      },
      {
        report_no: 'SS20240425001', warehouse_id: 1,
        title: '4月25日仓储破损上报',
        loss_type: 'damage', loss_reason: '雨季仓储湿度较大，部分包装受潮',
        total_quantity: 3, total_amount: 844.00, status: 'approved',
        reporter_id: 5, reviewer_id: 1, approver_id: 1,
        reported_at: '2024-04-25 10:20:00', reviewed_at: '2024-04-25 11:30:00', approved_at: '2024-04-25 14:00:00',
        related_stock_take_id: null,
        remark: '仓库通风设备检修期间发生的包装受潮，已安排维修'
      },
      {
        report_no: 'SS20240430001', warehouse_id: 1,
        title: '五一节前盘点损耗处理',
        loss_type: 'inventory_shortage', loss_reason: '五一节前备货盘点发现的损耗',
        total_quantity: 6, total_amount: 2478.00, status: 'reviewed',
        reporter_id: 4, reviewer_id: 1, approver_id: null,
        reported_at: '2024-04-29 17:00:00', reviewed_at: '2024-04-30 09:30:00', approved_at: null,
        related_stock_take_id: 3,
        remark: '包含2盒试饮、2盒样品、1盒破损、1盒待查'
      },
      {
        report_no: 'SS20240505001', warehouse_id: 1,
        title: '5月5日试饮活动损耗',
        loss_type: 'tasting', loss_reason: '五一期间门店试饮活动消耗',
        total_quantity: 8, total_amount: 2144.00, status: 'approved',
        reporter_id: 2, reviewer_id: 4, approver_id: 1,
        reported_at: '2024-05-05 15:00:00', reviewed_at: '2024-05-05 16:30:00', approved_at: '2024-05-06 10:00:00',
        related_stock_take_id: null,
        remark: '西湖龙井4盒，铁观音2盒，祁门红茶2盒，用于商场促销活动试饮'
      },
      {
        report_no: 'SS20240518001', warehouse_id: 1,
        title: '5月18日物流破损',
        loss_type: 'damage', loss_reason: '发往北京客户途中物流破损',
        total_quantity: 2, total_amount: 1176.00, status: 'pending',
        reporter_id: 5, reviewer_id: null, approver_id: null,
        reported_at: '2024-05-18 14:00:00', reviewed_at: null, approved_at: null,
        related_stock_take_id: null,
        remark: '2盒大红袍物流途中包装破损，已拍照取证，正在与物流协商理赔'
      }
    ];

    const lossInsert = db.prepare('INSERT INTO loss_reports (report_no, warehouse_id, title, loss_type, loss_reason, total_quantity, total_amount, status, reporter_id, reviewer_id, approver_id, reported_at, reviewed_at, approved_at, related_stock_take_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    lossReports.forEach(r => lossInsert.run(r.report_no, r.warehouse_id, r.title, r.loss_type, r.loss_reason, r.total_quantity, r.total_amount, r.status, r.reporter_id, r.reviewer_id, r.approver_id, r.reported_at, r.reviewed_at, r.approved_at, r.related_stock_take_id, r.remark));

    const lossItems = [
      { report: 1, batch: 1, product: 1, qty: 2, price: 388.00, amount: 776.00, responsibility: 'company', resp_person: null, remark: '客户品鉴用茶，用于杭州大厦VIP活动' },
      { report: 1, batch: 4, product: 3, qty: 2, price: 458.00, amount: 916.00, responsibility: 'warehouse', resp_person: 4, remark: '仓储期间外盒挤压变形，无法销售' },
      { report: 1, batch: 8, product: 6, qty: 1, price: 168.00, amount: 168.00, responsibility: 'warehouse', resp_person: 5, remark: '仓库人员整理时不慎掉落，茶饼碎裂' },
      { report: 2, batch: 2, product: 1, qty: 1, price: 388.00, amount: 388.00, responsibility: 'company', resp_person: null, remark: '雨季包装受潮，需做干燥处理' },
      { report: 2, batch: 10, product: 8, qty: 2, price: 268.00, amount: 536.00, responsibility: 'company', resp_person: null, remark: '罐口密封失效，茶叶受潮' },
      { report: 3, batch: 1, product: 1, qty: 3, price: 388.00, amount: 1164.00, responsibility: 'company', resp_person: null, remark: '2盒试饮1盒待查' },
      { report: 3, batch: 3, product: 2, qty: 2, price: 218.00, amount: 436.00, responsibility: 'sales', resp_person: 2, remark: '客户拜访样品' },
      { report: 3, batch: 9, product: 7, qty: 1, price: 888.00, amount: 888.00, responsibility: 'warehouse', resp_person: 4, remark: '包装边角破损' },
      { report: 4, batch: 1, product: 1, qty: 4, price: 388.00, amount: 1552.00, responsibility: 'company', resp_person: null, remark: '五一商场活动试饮' },
      { report: 4, batch: 11, product: 9, qty: 2, price: 188.00, amount: 376.00, responsibility: 'company', resp_person: null, remark: '五一商场活动试饮' },
      { report: 4, batch: 12, product: 10, qty: 2, price: 198.00, amount: 396.00, responsibility: 'company', resp_person: null, remark: '五一商场活动试饮' },
      { report: 5, batch: 4, product: 3, qty: 2, price: 588.00, amount: 1176.00, responsibility: 'third_party', resp_person: null, remark: '物流破损，顺丰理赔中' }
    ];

    const lossItemInsert = db.prepare('INSERT INTO loss_items (report_id, batch_id, product_id, quantity, unit_price, amount, responsibility, responsible_person_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    lossItems.forEach(i => lossItemInsert.run(i.report, i.batch, i.product, i.qty, i.price, i.amount, i.responsibility, i.resp_person, i.remark));

    const logs = [
      { module: 'auth', operation: 'login', record_id: null, operator_id: 1, operator_name: '张明远', content: '系统登录', old_value: null, new_value: null, created_at: '2024-04-08 08:30:00' },
      { module: 'stock_take', operation: 'create', record_id: 1, operator_id: 1, operator_name: '张明远', content: '创建盘点计划PD20240401', old_value: null, new_value: null, created_at: '2024-04-05 09:00:00' },
      { module: 'stock_take', operation: 'start', record_id: 1, operator_id: 4, operator_name: '赵大宝', content: '开始执行盘点', old_value: 'pending', new_value: 'in_progress', created_at: '2024-04-08 09:00:00' },
      { module: 'stock_take', operation: 'complete', record_id: 1, operator_id: 4, operator_name: '赵大宝', content: '完成盘点，发现差异', old_value: 'in_progress', new_value: 'completed', created_at: '2024-04-08 17:30:00' },
      { module: 'loss_report', operation: 'create', record_id: 1, operator_id: 4, operator_name: '赵大宝', content: '提交损耗报告SS20240410001', old_value: null, new_value: 'pending', created_at: '2024-04-10 14:30:00' },
      { module: 'loss_report', operation: 'review', record_id: 1, operator_id: 1, operator_name: '张明远', content: '审核通过', old_value: 'pending', new_value: 'reviewed', created_at: '2024-04-10 16:00:00' },
      { module: 'loss_report', operation: 'approve', record_id: 1, operator_id: 1, operator_name: '张明远', content: '审批通过，同意核销', old_value: 'reviewed', new_value: 'approved', created_at: '2024-04-11 09:00:00' },
      { module: 'inventory', operation: 'adjust', record_id: 1, operator_id: 1, operator_name: '张明远', content: '根据损耗报告调整库存', old_value: '150', new_value: '148', created_at: '2024-04-11 09:30:00' },
      { module: 'stock_take', operation: 'create', record_id: 2, operator_id: 1, operator_name: '张明远', content: '创建武夷岩茶专项盘点', old_value: null, new_value: null, created_at: '2024-04-14 10:00:00' },
      { module: 'stock_take', operation: 'complete', record_id: 2, operator_id: 4, operator_name: '赵大宝', content: '专项盘点完成，账实相符', old_value: 'in_progress', new_value: 'completed', created_at: '2024-04-15 16:00:00' },
      { module: 'loss_report', operation: 'create', record_id: 2, operator_id: 5, operator_name: '陈小芳', content: '提交仓储破损报告', old_value: null, new_value: 'pending', created_at: '2024-04-25 10:20:00' },
      { module: 'loss_report', operation: 'approve', record_id: 2, operator_id: 1, operator_name: '张明远', content: '审批通过，计入仓储成本', old_value: 'reviewed', new_value: 'approved', created_at: '2024-04-25 14:00:00' },
      { module: 'loss_report', operation: 'create', record_id: 4, operator_id: 2, operator_name: '李雪琴', content: '提交五一试饮活动损耗', old_value: null, new_value: 'pending', created_at: '2024-05-05 15:00:00' },
      { module: 'loss_report', operation: 'review', record_id: 4, operator_id: 4, operator_name: '赵大宝', content: '仓管确认出库记录', old_value: 'pending', new_value: 'reviewed', created_at: '2024-05-05 16:30:00' },
      { module: 'loss_report', operation: 'approve', record_id: 4, operator_id: 1, operator_name: '张明远', content: '审批通过，计入营销费用', old_value: 'reviewed', new_value: 'approved', created_at: '2024-05-06 10:00:00' }
    ];

    const logInsert = db.prepare('INSERT INTO operation_logs (module, operation, record_id, operator_id, operator_name, content, old_value, new_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    logs.forEach(l => logInsert.run(l.module, l.operation, l.record_id, l.operator_id, l.operator_name, l.content, l.old_value, l.new_value, l.created_at));

    const priceAdjustments = [
      { product_id: 1, adjust_type: 'activity', price_type: 'promotion', old_price: 388.00, new_price: 328.00, effective_date: '2024-04-28', expiry_date: '2024-05-05', reason: '五一劳动节促销活动', approver_id: 1, status: 'expired' },
      { product_id: 2, adjust_type: 'activity', price_type: 'promotion', old_price: 218.00, new_price: 188.00, effective_date: '2024-04-28', expiry_date: '2024-05-05', reason: '五一劳动节促销活动', approver_id: 1, status: 'expired' },
      { product_id: 5, adjust_type: 'permanent', price_type: 'base', old_price: 568.00, new_price: 588.00, effective_date: '2024-05-01', expiry_date: null, reason: '原料成本上涨，调整指导价', approver_id: 1, status: 'active' },
      { product_id: 1, adjust_type: 'activity', price_type: 'wholesale', old_price: 388.00, new_price: 348.00, effective_date: '2024-05-15', expiry_date: '2024-06-15', reason: '经销商批量订货优惠', approver_id: 1, status: 'active' }
    ];

    const priceInsert = db.prepare('INSERT INTO price_adjustments (product_id, adjust_type, price_type, old_price, new_price, effective_date, expiry_date, reason, approver_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    priceAdjustments.forEach(p => priceInsert.run(p.product_id, p.adjust_type, p.price_type, p.old_price, p.new_price, p.effective_date, p.expiry_date, p.reason, p.approver_id, p.status));

    const stockOuts = [
      { out_no: 'CK20240415001', warehouse_id: 1, type: 'transfer', target_warehouse_id: 2, customer_name: null, total_quantity: 30, status: 'completed', creator_id: 1, reviewer_id: 1, out_time: '2024-04-15 14:00:00', remark: '上海分仓补货' },
      { out_no: 'CK20240420001', warehouse_id: 1, type: 'sale', target_warehouse_id: null, customer_name: '杭州茗品轩茶庄', total_quantity: 45, status: 'completed', creator_id: 2, reviewer_id: 4, out_time: '2024-04-20 10:30:00', remark: '常规补货订单' },
      { out_no: 'CK20240428001', warehouse_id: 1, type: 'sale', target_warehouse_id: null, customer_name: '北京茶韵阁', total_quantity: 60, status: 'completed', creator_id: 3, reviewer_id: 4, out_time: '2024-04-28 09:00:00', remark: '五一节前备货，使用活动价格' },
      { out_no: 'CK20240501001', warehouse_id: 1, type: 'tasting', target_warehouse_id: null, customer_name: '杭州大厦活动现场', total_quantity: 8, status: 'completed', creator_id: 2, reviewer_id: 4, out_time: '2024-05-01 08:30:00', remark: '五一商场活动试饮用茶，关联损耗报告SS20240505001' },
      { out_no: 'CK20240510001', warehouse_id: 1, type: 'sale', target_warehouse_id: null, customer_name: '上海茶之缘', total_quantity: 35, status: 'pending', creator_id: 2, reviewer_id: null, out_time: null, remark: '待审核' },
      { out_no: 'CK20240518001', warehouse_id: 1, type: 'sale', target_warehouse_id: null, customer_name: '北京御茗轩', total_quantity: 12, status: 'completed', creator_id: 3, reviewer_id: 4, out_time: '2024-05-18 10:00:00', remark: '物流途中破损2盒，正在处理理赔' }
    ];

    const outInsert = db.prepare('INSERT INTO stock_out_records (out_no, warehouse_id, type, target_warehouse_id, customer_name, total_quantity, status, creator_id, reviewer_id, out_time, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stockOuts.forEach(o => outInsert.run(o.out_no, o.warehouse_id, o.type, o.target_warehouse_id, o.customer_name, o.total_quantity, o.status, o.creator_id, o.reviewer_id, o.out_time, o.remark));

    const stockOutItems = [
      { out_id: 1, batch: 1, product: 1, qty: 30, price: 360.00, amount: 10800.00, remark: '调拨上海分仓' },
      { out_id: 2, batch: 1, product: 1, qty: 15, price: 360.00, amount: 5400.00, remark: '批次B20240001' },
      { out_id: 2, batch: 3, product: 2, qty: 20, price: 195.00, amount: 3900.00, remark: '批次B20240003' },
      { out_id: 2, batch: 5, product: 3, qty: 10, price: 420.00, amount: 4200.00, remark: '批次B20240004' },
      { out_id: 3, batch: 2, product: 1, qty: 20, price: 360.00, amount: 7200.00, remark: '活动价328元/盒' },
      { out_id: 3, batch: 3, product: 2, qty: 25, price: 195.00, amount: 4875.00, remark: '活动价188元/盒' },
      { out_id: 3, batch: 4, product: 3, qty: 15, price: 420.00, amount: 6300.00, remark: '' },
      { out_id: 4, batch: 1, product: 1, qty: 4, price: 360.00, amount: 1440.00, remark: '试饮消耗' },
      { out_id: 4, batch: 11, product: 9, qty: 2, price: 165.00, amount: 330.00, remark: '试饮消耗' },
      { out_id: 4, batch: 12, product: 10, qty: 2, price: 175.00, amount: 350.00, remark: '试饮消耗' },
      { out_id: 5, batch: 6, product: 4, qty: 15, price: 295.00, amount: 4425.00, remark: '待出库' },
      { out_id: 5, batch: 7, product: 5, qty: 20, price: 550.00, amount: 11000.00, remark: '待出库' },
      { out_id: 6, batch: 4, product: 3, qty: 12, price: 420.00, amount: 5040.00, remark: '破损2盒，实收10盒' }
    ];

    const outItemInsert = db.prepare('INSERT INTO stock_out_items (out_id, batch_id, product_id, quantity, unit_price, amount, remark) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stockOutItems.forEach(i => outItemInsert.run(i.out_id, i.batch, i.product, i.qty, i.price, i.amount, i.remark));

    db.exec('COMMIT');
    console.log('演示数据生成完成！');
    console.log('');
    console.log('=== 测试账号 ===');
    console.log('经销负责人: manager / 123456');
    console.log('业务员: sales1 / 123456 或 sales2 / 123456');
    console.log('仓管: warehouse1 / 123456 或 warehouse2 / 123456');
    console.log('');
    console.log('数据包含:');
    console.log('- 5个用户（3种角色）');
    console.log('- 3个仓库');
    console.log('- 10个茶叶产品');
    console.log('- 13个库存批次');
    console.log('- 5个盘点计划（含不同状态）');
    console.log('- 16条盘点明细');
    console.log('- 5份损耗报告（含不同状态和责任归属）');
    console.log('- 12条损耗明细');
    console.log('- 15条操作日志');
    console.log('- 4条价格调整记录');
    console.log('- 6条出库记录（含调拨、销售、试饮）');

  } catch (e) {
    db.exec('ROLLBACK');
    console.error('数据生成失败:', e);
    throw e;
  }
}

seed();
