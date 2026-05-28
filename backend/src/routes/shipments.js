const express = require('express');
const router = express.Router();
const { all, get, run } = require('../config/database');
const { logActivity } = require('../middleware/logger');

router.post('/quote/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { total_quantity, warehouse, items, parent_shipment_id, created_by } = req.body;
    
    const date = new Date();
    const countResult = await get('SELECT COUNT(*) as cnt FROM shipments');
    const count = countResult.cnt + 1;
    const suffix = parent_shipment_id ? String.fromCharCode(64 + count) : '';
    const shipmentNo = `S${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(count).padStart(3, '0')}${suffix}`;
    
    const result = await run(`
      INSERT INTO shipments (quote_id, shipment_no, parent_shipment_id, status, total_quantity, warehouse)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `, [quoteId, shipmentNo, parent_shipment_id || null, total_quantity, warehouse]);
    
    const shipmentId = result.lastID;
    
    for (const item of items) {
      await run(`
        INSERT INTO shipment_items (shipment_id, product_name, quantity, batch_no, remarks)
        VALUES (?, ?, ?, ?, ?)
      `, [shipmentId, item.product_name, item.quantity, item.batch_no || '', item.remarks || '']);
    }
    
    const user = await get('SELECT name FROM users WHERE id = ?', [created_by]);
    await logActivity(quoteId, parent_shipment_id ? 'split_shipment' : 'create_shipment', 
      `创建${parent_shipment_id ? '拆单' : ''}发货单 ${shipmentNo}`, created_by, user?.name);
    
    res.json({ success: true, data: { shipment_id: shipmentId, shipment_no: shipmentNo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const { checked_by, logistics_company, tracking_no } = req.body;
    
    const shipment = await get('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!shipment) {
      return res.status(404).json({ success: false, message: '发货单不存在' });
    }
    
    await run(`
      UPDATE shipments 
      SET status = 'shipped', shipped_quantity = total_quantity, 
          logistics_company = ?, tracking_no = ?, checked_by = ?,
          shipped_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [logistics_company, tracking_no, checked_by, id]);
    
    const allShipments = await get('SELECT SUM(shipped_quantity) as shipped, SUM(total_quantity) as total FROM shipments WHERE quote_id = ?', [shipment.quote_id]);
    
    if (allShipments.shipped >= allShipments.total) {
      await run("UPDATE quotes SET status = 'shipped', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [shipment.quote_id]);
    } else {
      await run("UPDATE quotes SET status = 'partial_shipped', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [shipment.quote_id]);
    }
    
    const user = await get('SELECT name FROM users WHERE id = ?', [checked_by]);
    await logActivity(shipment.quote_id, 'check_shipment', 
      `仓配复核完成，${logistics_company} ${tracking_no}`, checked_by, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
