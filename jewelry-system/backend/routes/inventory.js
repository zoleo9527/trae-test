const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { logOperation, getLogs } = require('../utils/logger');

const router = express.Router();

function generateCheckNo() {
  const date = new Date();
  const prefix = 'INV';
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

router.get('/', authenticateToken, (req, res) => {
  const { status, storeId, page = 1, pageSize = 20 } = req.query;
  const userStoreId = req.user.store_id;
  
  let query = `
    SELECT i.*,
           s.name as store_name,
           cu.name as checker_name,
           rv.name as reviewer_name,
           cn.name as confirmer_name
    FROM inventory_checks i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN users cu ON i.checked_by = cu.id
    LEFT JOIN users rv ON i.reviewed_by = rv.id
    LEFT JOIN users cn ON i.confirmed_by = cn.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  
  if (storeId) {
    query += ' AND i.store_id = ?';
    params.push(storeId);
  } else if (req.user.role !== 'admin') {
    query += ' AND i.store_id = ?';
    params.push(userStoreId);
  }

  query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const checks = db.prepare(query).all(...params);
  
  const total = db.prepare('SELECT COUNT(*) as total FROM inventory_checks WHERE 1=1').get().total;

  res.json({ data: checks, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', authenticateToken, (req, res) => {
  const check = db.prepare(`
    SELECT i.*,
           s.name as store_name,
           cu.name as checker_name,
           rv.name as reviewer_name,
           cn.name as confirmer_name
    FROM inventory_checks i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN users cu ON i.checked_by = cu.id
    LEFT JOIN users rv ON i.reviewed_by = rv.id
    LEFT JOIN users cn ON i.confirmed_by = cn.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!check) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }

  const items = db.prepare(`
    SELECT ii.*,
           p.sku, p.name as product_name, p.category, p.material, p.retail_price, p.status as product_status
    FROM inventory_items ii
    LEFT JOIN products p ON ii.product_id = p.id
    WHERE ii.inventory_check_id = ?
  `).all(req.params.id);

  const itemsWithDispositions = items.map(item => {
    if (item.difference_type !== 'none') {
      const dispositions = db.prepare(`
        SELECT d.*,
               tr.request_no as related_transfer_no,
               rp.name as responsible_person_name,
               cf.name as confirmer_name
        FROM difference_dispositions d
        LEFT JOIN transfer_requests tr ON d.related_transfer_id = tr.id
        LEFT JOIN users rp ON d.responsible_person = rp.id
        LEFT JOIN users cf ON d.confirmed_by = cf.id
        WHERE d.inventory_item_id = ?
        ORDER BY d.created_at DESC
      `).all(item.id);
      return { ...item, dispositions };
    }
    return item;
  });

  const logs = getLogs('inventory', req.params.id);
  res.json({ ...check, items: itemsWithDispositions, logs });
});

router.post('/', authenticateToken, requireRoles('sales_associate', 'store_manager', 'after_sales'), (req, res) => {
  const { store_id, check_date, remarks } = req.body;

  if (!store_id || !check_date) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (req.user.role !== 'admin' && store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能创建本门店的盘点' });
  }

  const products = db.prepare(`
    SELECT id, sku, name, category, material, weight, retail_price
    FROM products 
    WHERE current_store_id = ? AND status IN ('in_stock', 'repairing')
  `).all(store_id);

  const id = uuidv4();
  const checkNo = generateCheckNo();

  db.prepare(`
    INSERT INTO inventory_checks 
    (id, check_no, store_id, check_date, checked_by, status, total_expected, remarks)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
  `).run(id, checkNo, store_id, check_date, req.user.id, products.length, remarks || null);

  const insertItem = db.prepare(`
    INSERT INTO inventory_items 
    (id, inventory_check_id, product_id, expected_quantity, actual_quantity, difference, difference_type)
    VALUES (?, ?, ?, 1, 1, 0, 'none')
  `);

  products.forEach(product => {
    insertItem.run(uuidv4(), id, product.id);
  });

  logOperation({
    operationType: 'create',
    refType: 'inventory',
    refId: id,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '创建盘点单',
    toStatus: 'draft',
    remarks: `盘点单号: ${checkNo}, 共${products.length}件货品`
  });

  res.status(201).json({ id, check_no: checkNo, status: 'draft', item_count: products.length });
});

router.put('/:id/items', authenticateToken, (req, res) => {
  const { items } = req.body;
  const checkId = req.params.id;

  const check = db.prepare('SELECT * FROM inventory_checks WHERE id = ?').get(checkId);
  if (!check) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }

  if (check.status !== 'draft') {
    return res.status(400).json({ error: '只能编辑草稿状态的盘点' });
  }

  if (check.checked_by !== req.user.id && check.store_id !== req.user.store_id) {
    return res.status(403).json({ error: '无权限编辑此盘点' });
  }

  const updateItem = db.prepare(`
    UPDATE inventory_items 
    SET actual_quantity = ?, difference = ?, difference_type = ?, remarks = ?
    WHERE id = ?
  `);

  items.forEach(item => {
    const diff = item.actual_quantity - item.expected_quantity;
    const diffType = diff > 0 ? 'surplus' : diff < 0 ? 'shortage' : 'none';
    updateItem.run(item.actual_quantity, diff, diffType, item.remarks || null, item.id);
  });

  const stats = db.prepare(`
    SELECT 
      SUM(expected_quantity) as total_expected,
      SUM(actual_quantity) as total_actual,
      SUM(CASE WHEN difference_type != 'none' THEN 1 ELSE 0 END) as total_difference
    FROM inventory_items 
    WHERE inventory_check_id = ?
  `).get(checkId);

  db.prepare(`
    UPDATE inventory_checks 
    SET total_expected = ?, total_actual = ?, total_difference = ?
    WHERE id = ?
  `).run(stats.total_expected || 0, stats.total_actual || 0, stats.total_difference || 0, checkId);

  logOperation({
    operationType: 'update',
    refType: 'inventory',
    refId: checkId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '更新盘点明细',
    remarks: `差异数: ${stats.total_difference}件`
  });

  res.json({ success: true });
});

router.post('/:id/submit', authenticateToken, (req, res) => {
  const checkId = req.params.id;

  const check = db.prepare('SELECT * FROM inventory_checks WHERE id = ?').get(checkId);
  if (!check) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }

  if (check.status !== 'draft') {
    return res.status(400).json({ error: '只能提交草稿状态的盘点' });
  }

  if (check.checked_by !== req.user.id) {
    return res.status(403).json({ error: '只能提交自己创建的盘点' });
  }

  db.prepare('UPDATE inventory_checks SET status = ? WHERE id = ?').run('submitted', checkId);

  logOperation({
    operationType: 'submit',
    refType: 'inventory',
    refId: checkId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '提交盘点',
    fromStatus: 'draft',
    toStatus: 'submitted'
  });

  res.json({ success: true, status: 'submitted' });
});

router.post('/:id/review', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const checkId = req.params.id;

  const check = db.prepare('SELECT * FROM inventory_checks WHERE id = ?').get(checkId);
  if (!check) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }

  if (!['submitted', 'reviewing'].includes(check.status)) {
    return res.status(400).json({ error: '当前状态不可复核' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE inventory_checks 
    SET status = 'reviewing', reviewed_by = ?, reviewed_at = ?
    WHERE id = ?
  `).run(req.user.id, now, checkId);

  logOperation({
    operationType: 'review',
    refType: 'inventory',
    refId: checkId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '开始复核盘点',
    fromStatus: check.status,
    toStatus: 'reviewing'
  });

  res.json({ success: true, status: 'reviewing' });
});

router.post('/:id/confirm', authenticateToken, requireRoles('store_manager'), (req, res) => {
  const checkId = req.params.id;

  const check = db.prepare('SELECT * FROM inventory_checks WHERE id = ?').get(checkId);
  if (!check) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }

  if (check.status !== 'reviewing') {
    return res.status(400).json({ error: '只能确认复核后的盘点' });
  }

  if (check.store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能确认本门店的盘点' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE inventory_checks 
    SET status = 'confirmed', confirmed_by = ?, confirmed_at = ?
    WHERE id = ?
  `).run(req.user.id, now, checkId);

  logOperation({
    operationType: 'confirm',
    refType: 'inventory',
    refId: checkId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '确认盘点结果',
    fromStatus: 'reviewing',
    toStatus: 'confirmed'
  });

  res.json({ success: true, status: 'confirmed' });
});

router.post('/:id/resolve', authenticateToken, requireRoles('store_manager'), (req, res) => {
  const checkId = req.params.id;

  const check = db.prepare('SELECT * FROM inventory_checks WHERE id = ?').get(checkId);
  if (!check) {
    return res.status(404).json({ error: '盘点记录不存在' });
  }

  if (!['reviewing', 'confirmed'].includes(check.status)) {
    return res.status(400).json({ error: '只能处理复核中或已确认的盘点' });
  }

  const diffItems = db.prepare(`
    SELECT ii.id, ii.difference_type
    FROM inventory_items ii
    WHERE ii.inventory_check_id = ? AND ii.difference_type != 'none'
  `).all(checkId);

  const diffWithDisposition = db.prepare(`
    SELECT DISTINCT ii.id
    FROM inventory_items ii
    JOIN difference_dispositions dd ON ii.id = dd.inventory_item_id
    WHERE ii.inventory_check_id = ? AND ii.difference_type != 'none'
  `).all(checkId).map(r => r.id);

  const noDispositionItems = diffItems.filter(item => !diffWithDisposition.includes(item.id));
  if (noDispositionItems.length > 0) {
    return res.status(400).json({ error: `有 ${noDispositionItems.length} 条差异未创建处理记录` });
  }

  const pendingDispositions = db.prepare(`
    SELECT COUNT(*) as count 
    FROM difference_dispositions dd
    JOIN inventory_items ii ON dd.inventory_item_id = ii.id
    WHERE ii.inventory_check_id = ? AND dd.responsibility_confirmed = 0
  `).get(checkId);

  if (pendingDispositions.count > 0) {
    return res.status(400).json({ error: `还有 ${pendingDispositions.count} 条差异处理未确认责任归属` });
  }

  const pendingCompensation = db.prepare(`
    SELECT COUNT(*) as count 
    FROM difference_dispositions dd
    JOIN inventory_items ii ON dd.inventory_item_id = ii.id
    WHERE ii.inventory_check_id = ? AND dd.compensation_status = 'pending' AND dd.compensation_amount > 0
  `).get(checkId);

  if (pendingCompensation.count > 0) {
    return res.status(400).json({ error: `还有 ${pendingCompensation.count} 条赔付结果未落定（需标记为已赔付/已豁免）` });
  }

  db.prepare('UPDATE inventory_checks SET status = ? WHERE id = ?').run('resolved', checkId);

  logOperation({
    operationType: 'resolve',
    refType: 'inventory',
    refId: checkId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '完成盘点差异处理',
    fromStatus: check.status,
    toStatus: 'resolved'
  });

  res.json({ success: true, status: 'resolved' });
});

module.exports = router;
