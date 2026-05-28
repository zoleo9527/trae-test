const express = require('express');
const router = express.Router();
const { all, get, run } = require('../config/database');
const { logActivity } = require('../middleware/logger');

router.get('/', async (req, res) => {
  try {
    const { status, customer_name, product_type, start_date, end_date, page = 1, pageSize = 20 } = req.query;
    
    let whereClause = ['1=1'];
    let params = [];
    
    if (status) {
      whereClause.push('q.status = ?');
      params.push(status);
    }
    if (customer_name) {
      whereClause.push('q.customer_name LIKE ?');
      params.push(`%${customer_name}%`);
    }
    if (product_type) {
      whereClause.push('q.product_type LIKE ?');
      params.push(`%${product_type}%`);
    }
    if (start_date) {
      whereClause.push('q.created_at >= ?');
      params.push(start_date);
    }
    if (end_date) {
      whereClause.push('q.created_at <= ?');
      params.push(end_date);
    }
    
    const offset = (page - 1) * pageSize;
    
    const countResult = await get(`
      SELECT COUNT(*) as total FROM quotes q WHERE ${whereClause.join(' AND ')}
    `, params);
    const total = countResult.total;
    
    const quotes = await all(`
      SELECT q.*, 
             u.name as creator_name,
             h.name as handler_name
      FROM quotes q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users h ON q.current_handler = h.id
      WHERE ${whereClause.join(' AND ')}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);
    
    res.json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const quote = await get(`
      SELECT q.*, 
             u.name as creator_name,
             h.name as handler_name
      FROM quotes q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users h ON q.current_handler = h.id
      WHERE q.id = ?
    `, [id]);
    
    if (!quote) {
      return res.status(404).json({ success: false, message: '报价单不存在' });
    }
    
    const versions = await all(`
      SELECT v.*, u.name as modifier_name
      FROM quote_versions v
      LEFT JOIN users u ON v.modified_by = u.id
      WHERE v.quote_id = ?
      ORDER BY v.version DESC
    `, [id]);
    
    const approvals = await all(`
      SELECT a.*, u.name as approver_name
      FROM approvals a
      LEFT JOIN users u ON a.approver_id = u.id
      WHERE a.quote_id = ?
      ORDER BY a.created_at DESC
    `, [id]);
    
    const proofs = await all(`
      SELECT p.*, u.name as assignee_name, c.name as confirmer_name
      FROM proofs p
      LEFT JOIN users u ON p.assigned_to = u.id
      LEFT JOIN users c ON p.confirmed_by = c.id
      WHERE p.quote_id = ?
      ORDER BY p.created_at DESC
    `, [id]);
    
    const shipments = await all(`
      SELECT s.*, u.name as checker_name
      FROM shipments s
      LEFT JOIN users u ON s.checked_by = u.id
      WHERE s.quote_id = ?
      ORDER BY s.created_at DESC
    `, [id]);
    
    for (const shipment of shipments) {
      shipment.items = await all(`
        SELECT * FROM shipment_items WHERE shipment_id = ?
      `, [shipment.id]);
    }
    
    const refunds = await all(`
      SELECT r.*, u.name as applicant_name, a.name as approver_name
      FROM refunds r
      LEFT JOIN users u ON r.applicant_id = u.id
      LEFT JOIN users a ON r.approved_by = a.id
      WHERE r.quote_id = ?
      ORDER BY r.created_at DESC
    `, [id]);
    
    const logs = await all(`
      SELECT * FROM activity_logs WHERE quote_id = ? ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: {
        quote,
        versions,
        approvals,
        proofs,
        shipments,
        refunds,
        logs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_contact, project_name, product_type, quantity, unit_price, delivery_date, created_by } = req.body;
    
    const date = new Date();
    const countResult = await get('SELECT COUNT(*) as cnt FROM quotes');
    const quoteNo = `Q${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(countResult.cnt + 1).padStart(3, '0')}`;
    
    const total_price = quantity * unit_price;
    
    const result = await run(`
      INSERT INTO quotes (quote_no, customer_name, customer_contact, project_name, product_type, 
        quantity, unit_price, total_price, delivery_date, status, created_by, current_handler)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    `, [quoteNo, customer_name, customer_contact, project_name, product_type, 
      quantity, unit_price, total_price, delivery_date, created_by, created_by]);
    
    const quoteId = result.lastID;
    
    await run(`
      INSERT INTO quote_versions (quote_id, version, customer_name, project_name, quantity, 
        unit_price, total_price, delivery_date, modified_by, modify_reason)
      VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, '初始报价')
    `, [quoteId, customer_name, project_name, quantity, unit_price, total_price, delivery_date, created_by]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [created_by]);
    await logActivity(quoteId, 'create_quote', `创建报价单 ${quoteNo}`, created_by, user?.name);
    
    res.json({
      success: true,
      data: { id: quoteId, quote_no: quoteNo }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, project_name, quantity, unit_price, delivery_date, modified_by, modify_reason } = req.body;
    
    const quote = await get('SELECT * FROM quotes WHERE id = ?', [id]);
    if (!quote) {
      return res.status(404).json({ success: false, message: '报价单不存在' });
    }
    
    const newVersion = quote.version + 1;
    const total_price = quantity * unit_price;
    
    await run(`
      UPDATE quotes 
      SET customer_name = ?, project_name = ?, quantity = ?, unit_price = ?, 
          total_price = ?, delivery_date = ?, version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [customer_name, project_name, quantity, unit_price, total_price, delivery_date, newVersion, id]);
    
    await run(`
      INSERT INTO quote_versions (quote_id, version, customer_name, project_name, quantity, 
        unit_price, total_price, delivery_date, modified_by, modify_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, newVersion, customer_name, project_name, quantity, unit_price, total_price, delivery_date, modified_by, modify_reason]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [modified_by]);
    await logActivity(id, 'update_quote', `更新报价至版本${newVersion}：${modify_reason}`, modified_by, user?.name);
    
    res.json({ success: true, data: { version: newVersion } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/submit-approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_id, submitter_id } = req.body;
    
    await run("UPDATE quotes SET status = 'pending_approval', current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [approver_id, id]);
    
    await run(`
      INSERT INTO approvals (quote_id, approval_type, approver_id, status)
      VALUES (?, 'price_approval', ?, 'pending')
    `, [id, approver_id]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [submitter_id]);
    await logActivity(id, 'submit_approval', '提交价格审批', submitter_id, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_id, comments, status } = req.body;
    
    const approval = await get('SELECT * FROM approvals WHERE quote_id = ? AND status = ?', [id, 'pending']);
    if (approval) {
      await run(`
        UPDATE approvals SET status = ?, comments = ?, approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, comments, approval.id]);
    }
    
    const quote = await get('SELECT created_by FROM quotes WHERE id = ?', [id]);
    const quoteStatus = status === 'approved' ? 'approved' : 'rejected';
    const handler = status === 'approved' ? quote.created_by : quote.created_by;
    await run("UPDATE quotes SET status = ?, current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [quoteStatus, handler, id]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [approver_id]);
    await logActivity(id, status === 'approved' ? 'approve' : 'reject', 
      `${status === 'approved' ? '审批通过' : '审批拒绝'}：${comments}`, approver_id, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
