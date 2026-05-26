const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const seedData = () => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const staff = [
    { id: 'staff_001', name: '张明', role: 'manager', phone: '13800000001' },
    { id: 'staff_002', name: '李华', role: 'sales', phone: '13800000002' },
    { id: 'staff_003', name: '王芳', role: 'sales', phone: '13800000003' },
    { id: 'staff_004', name: '陈伟', role: 'warehouse', phone: '13800000004' },
  ];

  const insertStaff = db.prepare(
    'INSERT OR IGNORE INTO staff (id, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  staff.forEach(s => insertStaff.run(s.id, s.name, s.role, s.phone, now));

  const customers = [
    { id: 'cust_001', name: '刘总', company: '祥云茶楼', phone: '13900000001', address: '北京市朝阳区茶城路88号', level: 'vip', source: '展会', assigned_staff_id: 'staff_002' },
    { id: 'cust_002', name: '周经理', company: '品茗轩', phone: '13900000002', address: '上海市黄浦区南京东路168号', level: 'regular', source: '转介绍', assigned_staff_id: 'staff_002' },
    { id: 'cust_003', name: '赵老板', company: '茶韵坊', phone: '13900000003', address: '广州市天河区体育西路200号', level: 'potential', source: '线上咨询', assigned_staff_id: 'staff_003' },
    { id: 'cust_004', name: '孙女士', company: '清饮茶舍', phone: '13900000004', address: '深圳市南山区科技园路50号', level: 'potential', source: '门店', assigned_staff_id: 'staff_003' },
  ];

  const insertCustomer = db.prepare(
    'INSERT OR IGNORE INTO customers (id, name, company, phone, address, level, source, assigned_staff_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  customers.forEach(c => insertCustomer.run(c.id, c.name, c.company, c.phone, c.address, c.level, c.source, c.assigned_staff_id, now, now));

  const products = [
    { id: 'prod_001', name: '西湖龙井-明前特级', category: '绿茶', spec: '250g/罐', unit_price: 580, stock_quantity: 120, warehouse: '杭州仓' },
    { id: 'prod_002', name: '武夷大红袍-岩韵', category: '乌龙茶', spec: '200g/罐', unit_price: 420, stock_quantity: 80, warehouse: '福州仓' },
    { id: 'prod_003', name: '云南普洱-陈香3年', category: '普洱茶', spec: '357g/饼', unit_price: 280, stock_quantity: 200, warehouse: '昆明仓' },
    { id: 'prod_004', name: '安溪铁观音-清香型', category: '乌龙茶', spec: '500g/盒', unit_price: 360, stock_quantity: 150, warehouse: '福州仓' },
    { id: 'prod_005', name: '黄山毛峰-一级', category: '绿茶', spec: '200g/罐', unit_price: 198, stock_quantity: 300, warehouse: '杭州仓' },
  ];

  const insertProduct = db.prepare(
    'INSERT OR IGNORE INTO tea_products (id, name, category, spec, unit_price, stock_quantity, warehouse, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  products.forEach(p => insertProduct.run(p.id, p.name, p.category, p.spec, p.unit_price, p.stock_quantity, p.warehouse, now));

  const trials = [
    {
      id: 'trial_001',
      customer_id: 'cust_001',
      product_id: 'prod_001',
      trial_quantity: 2,
      trial_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      assigned_staff_id: 'staff_002',
      status: 'completed',
      feedback: '香气清高持久，汤色清澈明亮，客户很满意',
      satisfaction_score: 5,
    },
    {
      id: 'trial_002',
      customer_id: 'cust_002',
      product_id: 'prod_002',
      trial_quantity: 3,
      trial_date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
      assigned_staff_id: 'staff_002',
      status: 'completed',
      feedback: '岩韵明显，但客户觉得价格偏高',
      satisfaction_score: 4,
    },
    {
      id: 'trial_003',
      customer_id: 'cust_003',
      product_id: 'prod_003',
      trial_quantity: 5,
      trial_date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
      assigned_staff_id: 'staff_003',
      status: 'in_progress',
      feedback: null,
      satisfaction_score: null,
    },
    {
      id: 'trial_004',
      customer_id: 'cust_004',
      product_id: 'prod_004',
      trial_quantity: 2,
      trial_date: dayjs().format('YYYY-MM-DD'),
      assigned_staff_id: 'staff_003',
      status: 'pending',
      feedback: null,
      satisfaction_score: null,
    },
  ];

  const insertTrial = db.prepare(
    'INSERT OR IGNORE INTO trial_records (id, customer_id, product_id, trial_quantity, trial_date, assigned_staff_id, status, feedback, satisfaction_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  trials.forEach(t => insertTrial.run(t.id, t.customer_id, t.product_id, t.trial_quantity, t.trial_date, t.assigned_staff_id, t.status, t.feedback, t.satisfaction_score, now, now));

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const dayAfterTomorrow = dayjs().add(2, 'day').format('YYYY-MM-DD');

  const followups = [
    {
      id: 'follow_001',
      trial_id: 'trial_001',
      customer_id: 'cust_001',
      assigned_staff_id: 'staff_002',
      scheduled_date: today,
      scheduled_time: '09:00',
      followup_type: 'phone',
      status: 'pending',
      actual_date: null,
      content: null,
      result: null,
      next_followup_date: null,
      sort_order: 0,
    },
    {
      id: 'follow_002',
      trial_id: 'trial_001',
      customer_id: 'cust_001',
      assigned_staff_id: 'staff_002',
      scheduled_date: today,
      scheduled_time: '10:30',
      followup_type: 'visit',
      status: 'pending',
      actual_date: null,
      content: null,
      result: null,
      next_followup_date: null,
      sort_order: 1,
    },
    {
      id: 'follow_003',
      trial_id: 'trial_002',
      customer_id: 'cust_002',
      assigned_staff_id: 'staff_002',
      scheduled_date: today,
      scheduled_time: '14:00',
      followup_type: 'wechat',
      status: 'pending',
      actual_date: null,
      content: null,
      result: null,
      next_followup_date: null,
      sort_order: 2,
    },
    {
      id: 'follow_004',
      trial_id: 'trial_003',
      customer_id: 'cust_003',
      assigned_staff_id: 'staff_003',
      scheduled_date: tomorrow,
      scheduled_time: '09:00',
      followup_type: 'phone',
      status: 'pending',
      actual_date: null,
      content: null,
      result: null,
      next_followup_date: null,
      sort_order: 0,
    },
    {
      id: 'follow_005',
      trial_id: 'trial_003',
      customer_id: 'cust_003',
      assigned_staff_id: 'staff_003',
      scheduled_date: dayAfterTomorrow,
      scheduled_time: '14:00',
      followup_type: 'visit',
      status: 'pending',
      actual_date: null,
      content: null,
      result: null,
      next_followup_date: null,
      sort_order: 0,
    },
    {
      id: 'follow_006',
      trial_id: 'trial_004',
      customer_id: 'cust_004',
      assigned_staff_id: 'staff_003',
      scheduled_date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      scheduled_time: '10:00',
      followup_type: 'phone',
      status: 'pending',
      actual_date: null,
      content: null,
      result: null,
      next_followup_date: null,
      sort_order: 0,
    },
  ];

  const insertFollowup = db.prepare(
    'INSERT OR IGNORE INTO followup_tasks (id, trial_id, customer_id, assigned_staff_id, scheduled_date, scheduled_time, followup_type, status, actual_date, content, result, next_followup_date, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  followups.forEach(f => insertFollowup.run(f.id, f.trial_id, f.customer_id, f.assigned_staff_id, f.scheduled_date, f.scheduled_time, f.followup_type, f.status, f.actual_date, f.content, f.result, f.next_followup_date, f.sort_order, now, now));

  const orders = [
    {
      id: 'order_001',
      order_no: 'ORD20240501001',
      customer_id: 'cust_001',
      product_id: 'prod_001',
      quantity: 10,
      unit_price: 580,
      total_amount: 5800,
      discount_rate: 0.1,
      final_amount: 5220,
      warehouse: '杭州仓',
      delivery_address: '北京市朝阳区茶城路88号',
      status: 'shipped',
      batch_no: 'XHLJ20240415A',
      created_by: 'staff_002',
      approved_by: 'staff_001',
      approved_at: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
      shipped_by: 'staff_004',
      shipped_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      received_at: null,
    },
    {
      id: 'order_002',
      order_no: 'ORD20240502002',
      customer_id: 'cust_002',
      product_id: 'prod_004',
      quantity: 20,
      unit_price: 360,
      total_amount: 7200,
      discount_rate: 0.15,
      final_amount: 6120,
      warehouse: '福州仓',
      delivery_address: '上海市黄浦区南京东路168号',
      status: 'pending_approval',
      batch_no: null,
      created_by: 'staff_002',
      approved_by: null,
      approved_at: null,
      shipped_by: null,
      shipped_at: null,
      received_at: null,
    },
    {
      id: 'order_003',
      order_no: 'ORD20240503003',
      customer_id: 'cust_001',
      product_id: 'prod_003',
      quantity: 50,
      unit_price: 280,
      total_amount: 14000,
      discount_rate: 0.2,
      final_amount: 11200,
      warehouse: '昆明仓',
      delivery_address: '北京市朝阳区茶城路88号',
      status: 'rejected',
      batch_no: null,
      created_by: 'staff_002',
      approved_by: 'staff_001',
      approved_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      shipped_by: null,
      shipped_at: null,
      received_at: null,
    },
  ];

  const insertOrder = db.prepare(
    'INSERT OR IGNORE INTO orders (id, order_no, customer_id, product_id, quantity, unit_price, total_amount, discount_rate, final_amount, warehouse, delivery_address, status, batch_no, created_by, approved_by, approved_at, shipped_by, shipped_at, received_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  orders.forEach(o => insertOrder.run(o.id, o.order_no, o.customer_id, o.product_id, o.quantity, o.unit_price, o.total_amount, o.discount_rate, o.final_amount, o.warehouse, o.delivery_address, o.status, o.batch_no, o.created_by, o.approved_by, o.approved_at, o.shipped_by, o.shipped_at, o.received_at, now, now));

  const approvals = [
    {
      id: 'appr_001',
      order_id: 'order_001',
      approver_id: 'staff_001',
      action: 'approve',
      reason: null,
    },
    {
      id: 'appr_003',
      order_id: 'order_003',
      approver_id: 'staff_001',
      action: 'reject',
      reason: '折扣率20%超出审批权限，最高15%。请与客户确认或提交特批申请。',
    },
  ];

  const insertApproval = db.prepare(
    'INSERT OR IGNORE INTO approval_records (id, order_id, approver_id, action, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  approvals.forEach(a => insertApproval.run(a.id, a.order_id, a.approver_id, a.action, a.reason, now));

  const exceptions = [
    {
      id: 'excp_001',
      related_type: 'order',
      related_id: 'order_001',
      exception_type: 'batch_mix',
      description: '发货时发现批次号为XHLJ20240415A的库存不足，临时调用了XHLJ20240410B批次的产品。两个批次生产日期相差5天，品质一致。',
      reported_by: 'staff_004',
      status: 'resolved',
      handled_by: 'staff_001',
      handled_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
      resolution: '已电话告知客户，客户表示理解。已在系统中备注更换批次信息。',
      evidence_urls: 'batch_switch_note_001.jpg',
    },
    {
      id: 'excp_002',
      related_type: 'order',
      related_id: 'order_002',
      exception_type: 'price_confusion',
      description: '业务员报价时提到"活动价"，但系统中该产品暂无活动。客户坚持按活动价下单。',
      reported_by: 'staff_002',
      status: 'pending',
      handled_by: null,
      handled_at: null,
      resolution: null,
      evidence_urls: null,
    },
  ];

  const insertException = db.prepare(
    'INSERT OR IGNORE INTO exception_records (id, related_type, related_id, exception_type, description, reported_by, status, handled_by, handled_at, resolution, evidence_urls, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  exceptions.forEach(e => insertException.run(e.id, e.related_type, e.related_id, e.exception_type, e.description, e.reported_by, e.status, e.handled_by, e.handled_at, e.resolution, e.evidence_urls, now));

  const remarks = [
    {
      id: 'remark_001',
      related_type: 'customer',
      related_id: 'cust_001',
      content: '刘总偏好清香型绿茶，对价格不敏感，注重品质和包装',
      created_by: 'staff_002',
      is_supplement: 0,
    },
    {
      id: 'remark_002',
      related_type: 'trial',
      related_id: 'trial_001',
      content: '补充：客户反映2罐样品中有一罐包装略有挤压，但不影响品质，已致歉',
      created_by: 'staff_002',
      is_supplement: 1,
    },
    {
      id: 'remark_003',
      related_type: 'order',
      related_id: 'order_003',
      content: '客户要求20%折扣是因为是老客户介绍，且订购量大。需要再沟通。',
      created_by: 'staff_002',
      is_supplement: 0,
    },
  ];

  const insertRemark = db.prepare(
    'INSERT OR IGNORE INTO remarks (id, related_type, related_id, content, created_by, is_supplement, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  remarks.forEach(r => insertRemark.run(r.id, r.related_type, r.related_id, r.content, r.created_by, r.is_supplement, now));

  console.log('样例数据插入完成');
};

seedData();
