const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const stores = db.prepare('SELECT * FROM stores ORDER BY name').all();
  res.json(stores);
});

router.get('/:id/stats', authenticateToken, (req, res) => {
  const storeId = req.params.id;
  
  if (req.user.role !== 'admin' && req.user.store_id !== storeId) {
    return res.status(403).json({ error: '无权限查看此门店数据' });
  }

  const productStats = db.prepare(`
    SELECT 
      COUNT(*) as total_products,
      SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
      SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END) as allocated,
      SUM(CASE WHEN status = 'transferred' THEN 1 ELSE 0 END) as transferred,
      SUM(CASE WHEN status = 'repairing' THEN 1 ELSE 0 END) as repairing,
      SUM(retail_price) as total_value
    FROM products 
    WHERE current_store_id = ?
  `).get(storeId);

  const transferStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN from_store_id = ? THEN 1 ELSE 0 END) as outgoing_total,
      SUM(CASE WHEN to_store_id = ? THEN 1 ELSE 0 END) as incoming_total,
      SUM(CASE WHEN from_store_id = ? AND status = 'pending' THEN 1 ELSE 0 END) as outgoing_pending,
      SUM(CASE WHEN to_store_id = ? AND status = 'shipped' THEN 1 ELSE 0 END) as incoming_shipped
    FROM transfer_requests
    WHERE from_store_id = ? OR to_store_id = ?
  `).get(storeId, storeId, storeId, storeId, storeId, storeId);

  const inventoryStats = db.prepare(`
    SELECT 
      COUNT(*) as total_checks,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
      SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(total_difference) as total_differences
    FROM inventory_checks
    WHERE store_id = ?
  `).get(storeId);

  res.json({
    products: productStats,
    transfers: transferStats,
    inventory: inventoryStats
  });
});

module.exports = router;
