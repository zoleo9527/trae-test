const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticateToken, (req, res) => {
  const userStoreId = req.user.store_id;
  const isAdmin = req.user.role === 'admin';

  const transferWhere = isAdmin ? '1=1' : 'from_store_id = ? OR to_store_id = ?';
  const transferParams = isAdmin ? [] : [userStoreId, userStoreId];

  const transferStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM transfer_requests
    WHERE ${transferWhere}
  `).get(...transferParams);

  const inventoryWhere = isAdmin ? '1=1' : 'store_id = ?';
  const inventoryParams = isAdmin ? [] : [userStoreId];

  const inventoryStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
      SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(total_difference) as total_differences
    FROM inventory_checks
    WHERE ${inventoryWhere}
  `).get(...inventoryParams);

  const productWhere = isAdmin ? '1=1' : 'current_store_id = ?';
  const productParams = isAdmin ? [] : [userStoreId];

  const productStats = db.prepare(`
    SELECT 
      COUNT(*) as total_products,
      SUM(retail_price) as total_value
    FROM products
    WHERE ${productWhere}
  `).get(...productParams);

  const pendingDispositions = db.prepare(`
    SELECT COUNT(*) as count
    FROM difference_dispositions dd
    JOIN inventory_items ii ON dd.inventory_item_id = ii.id
    JOIN inventory_checks ic ON ii.inventory_check_id = ic.id
    WHERE dd.responsibility_confirmed = 0
      AND ${isAdmin ? '1=1' : 'ic.store_id = ?'}
  `).get(...(isAdmin ? [] : [userStoreId]));

  res.json({
    transfers: transferStats,
    inventory: inventoryStats,
    products: productStats,
    pending_dispositions: pendingDispositions.count
  });
});

router.get('/recent-activities', authenticateToken, (req, res) => {
  const { limit = 20 } = req.query;
  const userStoreId = req.user.store_id;
  const isAdmin = req.user.role === 'admin';
  
  let logs;
  if (isAdmin) {
    logs = db.prepare(`
      SELECT * FROM operation_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(parseInt(limit));
  } else {
    logs = db.prepare(`
      SELECT ol.*
      FROM operation_logs ol
      LEFT JOIN transfer_requests tr ON ol.ref_type = 'transfer' AND ol.ref_id = tr.id
      LEFT JOIN inventory_checks ic ON ol.ref_type = 'inventory' AND ol.ref_id = ic.id
      LEFT JOIN products p ON ol.ref_type = 'product' AND ol.ref_id = p.id
      LEFT JOIN difference_dispositions dd ON ol.ref_type = 'disposition' AND ol.ref_id = dd.id
      LEFT JOIN inventory_items ii ON dd.inventory_item_id = ii.id
      LEFT JOIN inventory_checks icd ON ii.inventory_check_id = icd.id
      LEFT JOIN repair_orders ro ON ol.ref_type = 'repair' AND ol.ref_id = ro.id
      WHERE 
        (ol.ref_type = 'transfer' AND (tr.from_store_id = ? OR tr.to_store_id = ?)) OR
        (ol.ref_type = 'inventory' AND ic.store_id = ?) OR
        (ol.ref_type = 'product' AND p.current_store_id = ?) OR
        (ol.ref_type = 'disposition' AND icd.store_id = ?) OR
        (ol.ref_type = 'repair' AND ro.store_id = ?)
      ORDER BY ol.created_at DESC
      LIMIT ?
    `).all(userStoreId, userStoreId, userStoreId, userStoreId, userStoreId, userStoreId, parseInt(limit));
  }

  res.json(logs);
});

router.get('/transfer-timeline', authenticateToken, (req, res) => {
  const { days = 30 } = req.query;
  const userStoreId = req.user.store_id;
  const isAdmin = req.user.role === 'admin';

  const whereClause = isAdmin ? '1=1' : 'from_store_id = ? OR to_store_id = ?';
  const params = isAdmin ? [] : [userStoreId, userStoreId];

  const timeline = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      status,
      COUNT(*) as count
    FROM transfer_requests
    WHERE ${whereClause}
      AND created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at), status
    ORDER BY date DESC
  `).all(...params, days);

  res.json(timeline);
});

module.exports = router;
