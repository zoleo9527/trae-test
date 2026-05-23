const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

router.get('/inventory-item/:itemId', authenticateToken, (req, res) => {
  const dispositions = db.prepare(`
    SELECT d.*,
           ii.product_id,
           p.sku, p.name as product_name, p.retail_price,
           tr.request_no as related_transfer_no,
           rp.name as responsible_person_name,
           cf.name as confirmer_name
    FROM difference_dispositions d
    JOIN inventory_items ii ON d.inventory_item_id = ii.id
    LEFT JOIN products p ON ii.product_id = p.id
    LEFT JOIN transfer_requests tr ON d.related_transfer_id = tr.id
    LEFT JOIN users rp ON d.responsible_person = rp.id
    LEFT JOIN users cf ON d.confirmed_by = cf.id
    WHERE d.inventory_item_id = ?
  `).all(req.params.itemId);

  res.json(dispositions);
});

router.post('/', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const { inventory_item_id, disposition_type, related_transfer_id, responsible_person, compensation_amount, remarks } = req.body;

  if (!inventory_item_id || !disposition_type) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const item = db.prepare(`
    SELECT ii.*, ic.store_id, ic.status as inventory_status
    FROM inventory_items ii
    JOIN inventory_checks ic ON ii.inventory_check_id = ic.id
    WHERE ii.id = ?
  `).get(inventory_item_id);

  if (!item) {
    return res.status(404).json({ error: '盘点明细不存在' });
  }

  if (!['reviewing', 'confirmed'].includes(item.inventory_status)) {
    return res.status(400).json({ error: '当前盘点状态不可创建差异处理' });
  }

  if (related_transfer_id) {
    const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(related_transfer_id);
    if (!transfer) {
      return res.status(404).json({ error: '关联调货单不存在' });
    }
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO difference_dispositions 
    (id, inventory_item_id, disposition_type, related_transfer_id, responsible_person, 
     responsibility_confirmed, compensation_amount, compensation_status, remarks)
    VALUES (?, ?, ?, ?, ?, 0, ?, 'pending', ?)
  `).run(id, inventory_item_id, disposition_type, related_transfer_id || null, responsible_person || null, 
        compensation_amount || 0, remarks || null);

  logOperation({
    operationType: 'create',
    refType: 'disposition',
    refId: id,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '创建差异处理',
    remarks: `类型: ${disposition_type}, 金额: ${compensation_amount || 0}`
  });

  res.status(201).json({ id, success: true });
});

router.put('/:id', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const { disposition_type, related_transfer_id, responsible_person, compensation_amount, remarks } = req.body;
  const dispositionId = req.params.id;

  const disposition = db.prepare('SELECT * FROM difference_dispositions WHERE id = ?').get(dispositionId);
  if (!disposition) {
    return res.status(404).json({ error: '差异处理不存在' });
  }

  if (disposition.responsibility_confirmed) {
    return res.status(400).json({ error: '已确认的差异处理不可编辑' });
  }

  db.prepare(`
    UPDATE difference_dispositions 
    SET disposition_type = ?, related_transfer_id = ?, responsible_person = ?, 
        compensation_amount = ?, remarks = ?
    WHERE id = ?
  `).run(disposition_type, related_transfer_id || null, responsible_person || null, 
         compensation_amount || 0, remarks || null, dispositionId);

  logOperation({
    operationType: 'update',
    refType: 'disposition',
    refId: dispositionId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '更新差异处理'
  });

  res.json({ success: true });
});

router.post('/:id/confirm', authenticateToken, requireRoles('store_manager'), (req, res) => {
  const dispositionId = req.params.id;

  const disposition = db.prepare(`
    SELECT d.*, ic.store_id
    FROM difference_dispositions d
    JOIN inventory_items ii ON d.inventory_item_id = ii.id
    JOIN inventory_checks ic ON ii.inventory_check_id = ic.id
    WHERE d.id = ?
  `).get(dispositionId);

  if (!disposition) {
    return res.status(404).json({ error: '差异处理不存在' });
  }

  if (disposition.store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能确认本门店的差异处理' });
  }

  if (disposition.responsibility_confirmed) {
    return res.status(400).json({ error: '差异处理已确认' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE difference_dispositions 
    SET responsibility_confirmed = 1, confirmed_by = ?, confirmed_at = ?
    WHERE id = ?
  `).run(req.user.id, now, dispositionId);

  logOperation({
    operationType: 'confirm',
    refType: 'disposition',
    refId: dispositionId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '确认差异责任',
    toStatus: 'confirmed'
  });

  res.json({ success: true });
});

router.post('/:id/compensation-status', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const { status } = req.body;
  const dispositionId = req.params.id;

  if (!['pending', 'paid', 'waived', 'in_progress'].includes(status)) {
    return res.status(400).json({ error: '无效的赔付状态' });
  }

  const disposition = db.prepare(`
    SELECT d.*, ic.store_id
    FROM difference_dispositions d
    JOIN inventory_items ii ON d.inventory_item_id = ii.id
    JOIN inventory_checks ic ON ii.inventory_check_id = ic.id
    WHERE d.id = ?
  `).get(dispositionId);

  if (!disposition) {
    return res.status(404).json({ error: '差异处理不存在' });
  }

  if (disposition.store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能操作本门店的差异处理' });
  }

  db.prepare('UPDATE difference_dispositions SET compensation_status = ? WHERE id = ?')
    .run(status, dispositionId);

  logOperation({
    operationType: 'update',
    refType: 'disposition',
    refId: dispositionId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: `更新赔付状态为: ${status}`
  });

  res.json({ success: true, status });
});

module.exports = router;
