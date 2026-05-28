const { run, get } = require('../config/database');
const dayjs = require('dayjs');

async function seedData() {
  const users = [
    ['zhang_san', '张三', 'business', '商务部'],
    ['li_si', '李四', 'proofing', '打样部'],
    ['wang_wu', '王五', 'warehouse', '仓配部'],
    ['zhao_liu', '赵六', 'manager', '审批部'],
    ['qian_qi', '钱七', 'customer_service', '客服部'],
  ];

  for (const u of users) {
    await run(`
      INSERT OR IGNORE INTO users (username, name, role, department)
      VALUES (?, ?, ?, ?)
    `, u);
  }

  const now = dayjs();

  const quote1Result = await run(`
    INSERT INTO quotes (quote_no, version, customer_name, customer_contact, project_name, 
      product_type, quantity, unit_price, total_price, delivery_date, status, 
      created_by, current_handler, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Q202405001', 1, '腾讯科技', '王经理 13800138001', '2024员工端午福利礼盒',
    '端午礼盒', 500, 128.00, 64000.00, now.add(15, 'day').format('YYYY-MM-DD'),
    'completed', 1, 1, now.subtract(20, 'day').format(), now.subtract(5, 'day').format()
  ]);
  const quote1Id = quote1Result.lastID;

  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote1Id, 1, '腾讯科技', '2024员工端午福利礼盒', 500, 128.00, 64000.00,
    now.add(15, 'day').format('YYYY-MM-DD'), 1, '初始报价']);

  await run(`
    INSERT INTO approvals (quote_id, approval_type, approver_id, status, comments, approved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [quote1Id, 'price_approval', 4, 'approved', '价格合理，同意',
    now.subtract(18, 'day').format(), now.subtract(19, 'day').format()]);

  await run(`
    INSERT INTO proofs (quote_id, proof_no, status, assigned_to, proof_images, 
      customer_feedback, confirmed_by, confirmed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote1Id, 'P202405001', 'confirmed', 2,
    JSON.stringify(['/images/proof1_1.jpg', '/images/proof1_2.jpg']),
    '客户确认打样效果，logo位置微调后可以量产', 1,
    now.subtract(14, 'day').format(), now.subtract(17, 'day').format(), now.subtract(14, 'day').format()]);

  const ship1Result = await run(`
    INSERT INTO shipments (quote_id, shipment_no, parent_shipment_id, status, 
      total_quantity, shipped_quantity, warehouse, logistics_company, tracking_no, 
      checked_by, shipped_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote1Id, 'S202405001', null, 'shipped',
    500, 500, '深圳仓', '顺丰速运', 'SF1234567890', 3,
    now.subtract(8, 'day').format(), now.subtract(10, 'day').format()]);
  const ship1Id = ship1Result.lastID;

  await run(`
    INSERT INTO shipment_items (shipment_id, product_name, quantity, batch_no, remarks)
    VALUES (?, ?, ?, ?, ?)
  `, [ship1Id, '端午福利礼盒-标准版', 500, 'B202405001', '整单发出']);

  const logs1 = [
    ['create_quote', '创建报价单 Q202405001', 1, '张三'],
    ['submit_approval', '提交价格审批', 1, '张三'],
    ['approve', '价格审批通过', 4, '赵六'],
    ['create_proof', '创建打样任务', 1, '张三'],
    ['upload_proof', '上传打样照片', 2, '李四'],
    ['confirm_proof', '客户确认打样', 1, '张三'],
    ['create_shipment', '创建发货单', 3, '王五'],
    ['check_shipment', '仓配复核完成', 3, '王五'],
    ['complete', '订单完成', 1, '张三'],
  ];
  for (let i = 0; i < logs1.length; i++) {
    const [type, detail, opId, opName] = logs1[i];
    await run(`
      INSERT INTO activity_logs (quote_id, action_type, action_detail, operator_id, operator_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [quote1Id, type, detail, opId, opName, now.subtract(20 - i, 'day').format()]);
  }

  const quote2Result = await run(`
    INSERT INTO quotes (quote_no, version, customer_name, customer_contact, project_name, 
      product_type, quantity, unit_price, total_price, delivery_date, status, 
      created_by, current_handler, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Q202405002', 3, '阿里巴巴', '李总 13900139002', '618促销定制礼品套装',
    '商务套装', 2000, 88.00, 176000.00, now.add(7, 'day').format('YYYY-MM-DD'),
    'proofing', 1, 2, now.subtract(15, 'day').format(), now.subtract(1, 'day').format()
  ]);
  const quote2Id = quote2Result.lastID;

  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote2Id, 1, '阿里巴巴', '618促销定制礼品', 1000, 95.00, 95000.00,
    now.add(20, 'day').format('YYYY-MM-DD'), 1, '初次报价']);
  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote2Id, 2, '阿里巴巴', '618促销定制礼品套装', 1500, 90.00, 135000.00,
    now.add(15, 'day').format('YYYY-MM-DD'), 1, '客户要求增加数量，降价']);
  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote2Id, 3, '阿里巴巴', '618促销定制礼品套装', 2000, 88.00, 176000.00,
    now.add(7, 'day').format('YYYY-MM-DD'), 1, '再次追加数量，协商后最终价格']);

  await run(`
    INSERT INTO approvals (quote_id, approval_type, approver_id, status, comments, approved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [quote2Id, 'price_approval', 4, 'approved', '量大可以接受此价格',
    now.subtract(10, 'day').format(), now.subtract(12, 'day').format()]);

  await run(`
    INSERT INTO proofs (quote_id, proof_no, status, assigned_to, proof_images, 
      customer_feedback, confirmed_by, confirmed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote2Id, 'P202405002', 'customer_review', 2,
    JSON.stringify(['/images/proof2_1.jpg']),
    '客户反馈：颜色偏暗，需要重新打样', null, null,
    now.subtract(8, 'day').format(), now.subtract(2, 'day').format()]);

  const logs2 = [
    ['create_quote', '创建报价单 Q202405002 版本1', 1, '张三'],
    ['update_quote', '更新报价至版本2：数量1500，单价90', 1, '张三'],
    ['update_quote', '更新报价至版本3：数量2000，单价88', 1, '张三'],
    ['submit_approval', '提交价格审批', 1, '张三'],
    ['approve', '价格审批通过', 4, '赵六'],
    ['create_proof', '创建打样任务', 1, '张三'],
    ['upload_proof', '上传第一次打样照片', 2, '李四'],
    ['customer_feedback', '客户反馈颜色偏暗，要求重打', 1, '张三'],
    ['reproof', '安排重新打样', 2, '李四'],
  ];
  for (let i = 0; i < logs2.length; i++) {
    const [type, detail, opId, opName] = logs2[i];
    await run(`
      INSERT INTO activity_logs (quote_id, action_type, action_detail, operator_id, operator_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [quote2Id, type, detail, opId, opName, now.subtract(15 - i, 'day').format()]);
  }

  const quote3Result = await run(`
    INSERT INTO quotes (quote_no, version, customer_name, customer_contact, project_name, 
      product_type, quantity, unit_price, total_price, delivery_date, status, 
      created_by, current_handler, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Q202405003', 2, '字节跳动', '周小姐 13700137003', '周年庆纪念徽章',
    '金属徽章', 3000, 15.00, 45000.00, now.subtract(5, 'day').format('YYYY-MM-DD'),
    'partial_shipped', 1, 3, now.subtract(30, 'day').format(), now.subtract(3, 'day').format()
  ]);
  const quote3Id = quote3Result.lastID;

  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 1, '字节跳动', '周年庆纪念徽章', 3000, 18.00, 54000.00,
    now.subtract(10, 'day').format('YYYY-MM-DD'), 1, '初始报价']);
  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 2, '字节跳动', '周年庆纪念徽章', 3000, 15.00, 45000.00,
    now.subtract(5, 'day').format('YYYY-MM-DD'), 1, '竞争比价后降价']);

  await run(`
    INSERT INTO approvals (quote_id, approval_type, approver_id, status, comments, approved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 'price_approval', 4, 'approved', '同意，注意品质',
    now.subtract(25, 'day').format(), now.subtract(28, 'day').format()]);

  await run(`
    INSERT INTO proofs (quote_id, proof_no, status, assigned_to, proof_images, 
      customer_feedback, confirmed_by, confirmed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 'P202405003', 'confirmed', 2,
    JSON.stringify(['/images/proof3_1.jpg', '/images/proof3_2.jpg']),
    '确认效果', 1, now.subtract(20, 'day').format(),
    now.subtract(25, 'day').format(), now.subtract(20, 'day').format()]);

  const ship3aResult = await run(`
    INSERT INTO shipments (quote_id, shipment_no, parent_shipment_id, status, 
      total_quantity, shipped_quantity, warehouse, logistics_company, tracking_no, 
      checked_by, shipped_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 'S202405003A', null, 'shipped',
    1500, 1500, '东莞仓', '中通快递', 'ZT9876543210', 3,
    now.subtract(10, 'day').format(), now.subtract(12, 'day').format()]);
  const ship3aId = ship3aResult.lastID;

  await run(`
    INSERT INTO shipment_items (shipment_id, product_name, quantity, batch_no, remarks)
    VALUES (?, ?, ?, ?, ?)
  `, [ship3aId, '周年庆纪念徽章-金色', 1500, 'M202405001', '第一批发出']);

  await run(`
    INSERT INTO shipments (quote_id, shipment_no, parent_shipment_id, status, 
      total_quantity, shipped_quantity, warehouse, logistics_company, tracking_no, 
      checked_by, shipped_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 'S202405003B', ship3aId, 'pending',
    1500, 0, '东莞仓', null, null, null, null,
    now.subtract(8, 'day').format()]);

  await run(`
    INSERT INTO refunds (quote_id, refund_no, amount, reason, status, applicant_id, approved_by, approved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote3Id, 'R202405001', 2250.00, '第一批1500个中有30个瑕疵品，按成本退款',
    'approved', 5, 4, now.subtract(5, 'day').format(), now.subtract(6, 'day').format()]);

  const logs3 = [
    ['create_quote', '创建报价单 Q202405003', 1, '张三'],
    ['update_quote', '更新报价版本2：单价15', 1, '张三'],
    ['submit_approval', '提交审批', 1, '张三'],
    ['approve', '审批通过', 4, '赵六'],
    ['create_proof', '打样任务', 1, '张三'],
    ['confirm_proof', '打样确认', 1, '张三'],
    ['split_shipment', '客户要求拆单：先1500后1500', 1, '张三'],
    ['partial_ship', '第一批1500个发出', 3, '王五'],
    ['quality_issue', '客户反馈30个有瑕疵', 5, '钱七'],
    ['apply_refund', '申请退款2250元', 5, '钱七'],
    ['approve_refund', '退款审批通过', 4, '赵六'],
  ];
  for (let i = 0; i < logs3.length; i++) {
    const [type, detail, opId, opName] = logs3[i];
    await run(`
      INSERT INTO activity_logs (quote_id, action_type, action_detail, operator_id, operator_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [quote3Id, type, detail, opId, opName, now.subtract(30 - i * 2, 'day').format()]);
  }

  const quote4Result = await run(`
    INSERT INTO quotes (quote_no, version, customer_name, customer_contact, project_name, 
      product_type, quantity, unit_price, total_price, delivery_date, status, 
      created_by, current_handler, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Q202405004', 1, '美团', '陈经理 13600136004', '骑手夏日降温礼包',
    '降温礼包', 10000, 35.00, 350000.00, now.add(25, 'day').format('YYYY-MM-DD'),
    'pending_approval', 1, 4, now.subtract(2, 'day').format(), now.subtract(1, 'day').format()
  ]);
  const quote4Id = quote4Result.lastID;

  await run(`
    INSERT INTO quote_versions (quote_id, version, customer_name, project_name, 
      quantity, unit_price, total_price, delivery_date, modified_by, modify_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quote4Id, 1, '美团', '骑手夏日降温礼包', 10000, 35.00, 350000.00,
    now.add(25, 'day').format('YYYY-MM-DD'), 1, '大订单报价']);

  await run(`
    INSERT INTO approvals (quote_id, approval_type, approver_id, status, comments, approved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [quote4Id, 'price_approval', 4, 'pending', null, null, now.subtract(1, 'day').format()]);

  const logs4 = [
    ['create_quote', '创建报价单 Q202405004', 1, '张三'],
    ['submit_approval', '提交价格审批（大单需经理确认）', 1, '张三'],
  ];
  for (let i = 0; i < logs4.length; i++) {
    const [type, detail, opId, opName] = logs4[i];
    await run(`
      INSERT INTO activity_logs (quote_id, action_type, action_detail, operator_id, operator_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [quote4Id, type, detail, opId, opName, now.subtract(2 - i, 'day').format()]);
  }

  console.log('示例数据导入完成');
  console.log(`导入了 4 个报价单，涵盖：`);
  console.log(`  - Q202405001: 正常完成流（腾讯端午礼盒）`);
  console.log(`  - Q202405002: 打样问题流（阿里618礼品-重打样中）`);
  console.log(`  - Q202405003: 拆单+售后流（字节徽章-部分发货+退款）`);
  console.log(`  - Q202405004: 审批中流（美团降温礼包-待审批）`);

  process.exit(0);
}

seedData().catch(err => {
  console.error('导入失败:', err);
  process.exit(1);
});
