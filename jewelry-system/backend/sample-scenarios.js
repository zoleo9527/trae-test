const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

function createSampleScenarios() {
  const existingTransfers = db.prepare('SELECT COUNT(*) as count FROM transfer_requests').get().count;
  if (existingTransfers > 0) {
    console.log('Sample scenarios already exist, skipping');
    return;
  }

  console.log('Creating sample business scenarios...');

  const normalFlowTransfer = createNormalFlowTransfer();
  console.log('✓ 正常流程调货申请已创建');

  const problemFlowTransfer = createProblemFlowTransfer();
  console.log('✓ 问题流程调货申请已创建');

  const inventoryWithDifference = createInventoryWithDifference();
  console.log('✓ 含差异的盘点单已创建');

  const inventoryWithTransferRelatedDiff = createTransferRelatedDifference(inventoryWithDifference, problemFlowTransfer);
  console.log('✓ 调货相关差异处理已创建');

  console.log('\n=== 测试场景创建完成 ===\n');
  console.log('【正常流场景】');
  console.log('  调货单号: TRF-NORMAL-001');
  console.log('  状态: 待店长审批');
  console.log('  流程: 李导购申请 → 张店长审批 → 发货 → 收货确认\n');
  
  console.log('【问题流场景】');
  console.log('  调货单号: TRF-PROBLEM-001');
  console.log('  状态: 已发货（未收货）');
  console.log('  问题: 调货后未及时确认收货，导致盘点差异\n');
  
  console.log('【盘点差异场景】');
  console.log('  盘点单号: INV-TEST-001');
  console.log('  状态: 复核中');
  console.log('  差异: 盘亏1件（与问题调货关联）\n');
}

function createNormalFlowTransfer() {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO transfer_requests 
    (id, request_no, from_store_id, to_store_id, product_id, requested_by, reason, priority, status, created_at)
    VALUES (?, 'TRF-NORMAL-001', 'store_001', 'store_002', 'prod_001', 'user_sa_001', ?, 'high', 'pending', ?)
  `).run(id, '上海门店VIP客户定制订单需求，需调经典六爪钻戒', now);

  db.prepare('UPDATE products SET status = ? WHERE id = ?').run('allocated', 'prod_001');

  db.prepare(`
    INSERT INTO operation_logs 
    (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, to_status, created_at)
    VALUES (?, 'create', 'transfer', ?, 'user_sa_001', '李导购', '创建调货申请', 'pending', ?)
  `).run(uuidv4(), id, now);

  return id;
}

function createProblemFlowTransfer() {
  const id = uuidv4();
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare(`
    INSERT INTO transfer_requests 
    (id, request_no, from_store_id, to_store_id, product_id, requested_by, reason, priority, status, 
     approved_by, approved_at, shipped_by, shipped_at, created_at)
    VALUES (?, 'TRF-PROBLEM-001', 'store_001', 'store_002', 'prod_002', 'user_sa_002', ?, 'normal', 'shipped',
            'user_sm_001', ?, 'user_sa_001', ?, ?)
  `).run(id, '上海门店客户展示需求', twoDaysAgo, oneDayAgo, twoDaysAgo);

  db.prepare('UPDATE products SET status = ? WHERE id = ?').run('transferred', 'prod_002');

  const logs = [
    { type: 'create', action: '创建调货申请', status: 'pending', time: twoDaysAgo },
    { type: 'approve', action: '店长批准调货', status: 'approved', time: twoDaysAgo },
    { type: 'ship', action: '货品已发出', status: 'shipped', time: oneDayAgo }
  ];

  logs.forEach(log => {
    db.prepare(`
      INSERT INTO operation_logs 
      (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, to_status, created_at)
      VALUES (?, ?, 'transfer', ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), log.type, id, log.type === 'create' ? 'user_sa_002' : 'user_sm_001', 
           log.type === 'create' ? '王导购' : '张店长', log.action, log.status, log.time);
  });

  return id;
}

function createInventoryWithDifference() {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO inventory_checks 
    (id, check_no, store_id, check_date, checked_by, status, total_expected, total_actual, total_difference, 
     reviewed_by, reviewed_at, created_at)
    VALUES (?, 'INV-TEST-001', 'store_001', DATE('now'), 'user_sa_001', 'reviewing', 5, 4, 1,
            'user_as_001', ?, ?)
  `).run(id, now, now);

  const products = ['prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_007'];
  
  products.forEach((prodId, index) => {
    const itemId = uuidv4();
    const isMissing = prodId === 'prod_002';
    
    db.prepare(`
      INSERT INTO inventory_items 
      (id, inventory_check_id, product_id, expected_quantity, actual_quantity, difference, difference_type, remarks)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?)
    `).run(itemId, id, prodId, 
           isMissing ? 0 : 1, 
           isMissing ? -1 : 0, 
           isMissing ? 'shortage' : 'none',
           isMissing ? '未找到实物，账面在库' : null);
  });

  db.prepare(`
    INSERT INTO operation_logs 
    (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, to_status, created_at)
    VALUES (?, 'create', 'inventory', ?, 'user_sa_001', '李导购', '创建盘点单', 'draft', ?)
  `).run(uuidv4(), id, now);

  db.prepare(`
    INSERT INTO operation_logs 
    (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, to_status, created_at)
    VALUES (?, 'submit', 'inventory', ?, 'user_sa_001', '李导购', '提交盘点', 'submitted', ?)
  `).run(uuidv4(), id, now);

  db.prepare(`
    INSERT INTO operation_logs 
    (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, to_status, created_at)
    VALUES (?, 'review', 'inventory', ?, 'user_as_001', '赵售后', '开始复核盘点', 'reviewing', ?)
  `).run(uuidv4(), id, now);

  return id;
}

function createTransferRelatedDifference(inventoryId, transferId) {
  const inventoryItem = db.prepare(`
    SELECT * FROM inventory_items 
    WHERE inventory_check_id = ? AND difference_type = 'shortage'
  `).get(inventoryId);

  if (!inventoryItem) return;

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO difference_dispositions 
    (id, inventory_item_id, disposition_type, related_transfer_id, responsible_person, 
     responsibility_confirmed, compensation_amount, compensation_status, remarks, created_at)
    VALUES (?, ?, 'transfer_related', ?, 'user_sa_001', 0, 0, 'pending', ?, ?)
  `).run(id, inventoryItem.id, transferId, 
         '系统自动关联调货单 TRF-PROBLEM-001，该货品已发出但对方未确认收货，建议核实后处理', now);

  db.prepare(`
    INSERT INTO operation_logs 
    (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, created_at)
    VALUES (?, 'create', 'disposition', ?, 'user_as_001', '赵售后', '创建差异处理（调货相关）', ?)
  `).run(uuidv4(), id, now);

  return id;
}

module.exports = { createSampleScenarios };

if (require.main === module) {
  createSampleScenarios();
}
