const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { storeId, status, category, search, page = 1, pageSize = 50 } = req.query;
  const userStoreId = req.user.store_id;
  
  let query = `
    SELECT p.*, s.name as store_name
    FROM products p
    LEFT JOIN stores s ON p.current_store_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (storeId) {
    query += ' AND p.current_store_id = ?';
    params.push(storeId);
  } else if (req.user.role !== 'admin') {
    query += ' AND p.current_store_id = ?';
    params.push(userStoreId);
  }

  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND p.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (p.sku LIKE ? OR p.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const products = db.prepare(query).all(...params);
  
  const total = db.prepare('SELECT COUNT(*) as total FROM products WHERE 1=1').get().total;

  res.json({ data: products, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', authenticateToken, (req, res) => {
  const product = db.prepare(`
    SELECT p.*, s.name as store_name
    FROM products p
    LEFT JOIN stores s ON p.current_store_id = s.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) {
    return res.status(404).json({ error: '货品不存在' });
  }

  const transfers = db.prepare(`
    SELECT t.*, 
           fs.name as from_store_name,
           ts.name as to_store_name,
           ru.name as requester_name
    FROM transfer_requests t
    LEFT JOIN stores fs ON t.from_store_id = fs.id
    LEFT JOIN stores ts ON t.to_store_id = ts.id
    LEFT JOIN users ru ON t.requested_by = ru.id
    WHERE t.product_id = ?
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all(req.params.id);

  const repairs = db.prepare(`
    SELECT r.*, s.name as store_name
    FROM repair_orders r
    LEFT JOIN stores s ON r.store_id = s.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
    LIMIT 5
  `).all(req.params.id);

  res.json({ ...product, transfer_history: transfers, repair_history: repairs });
});

module.exports = router;
