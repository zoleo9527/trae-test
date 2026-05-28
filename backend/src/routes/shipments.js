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
    
    const allShipmentsForQuote = await all('SELECT * FROM shipments WHERE quote_id = ?', [quoteId]);
    const suffix = allShipmentsForQuote.length > 0 ? String.fromCharCode(65 + allShipmentsForQuote.length) : '';
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
    
    const quote = await get('SELECT quantity as total_order_qty FROM quotes WHERE id = ?', [shipment.quote_id]);
    const shippedQtyResult = await get('SELECT COALESCE(SUM(shipped_quantity), 0) as shipped FROM shipments WHERE quote_id = ? AND status = ?', 
      [shipment.quote_id, 'shipped']);
    
    const totalShipped = shippedQtyResult.shipped;
    const totalOrder = quote.total_order_qty;
    
    if (totalShipped >= totalOrder) {
      await run("UPDATE quotes SET status = 'shipped', current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [checked_by, shipment.quote_id]);
    } else if (totalShipped > 0) {
      await run("UPDATE quotes SET status = 'partial_shipped', current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [checked_by, shipment.quote_id]);
    } else {
      await run("UPDATE quotes SET current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [checked_by, shipment.quote_id]);
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
