const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { spareParts } = require('../data/database');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { category, lowStock, keyword } = req.query;
  let filtered = [...spareParts];

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (lowStock === 'true') {
    filtered = filtered.filter(p => p.stock <= p.minStock);
  }
  if (keyword) {
    filtered = filtered.filter(p => 
      p.name.includes(keyword) || p.model.includes(keyword)
    );
  }

  res.json(filtered);
});

router.get('/:id', authenticateToken, (req, res) => {
  const part = spareParts.find(p => p.id === req.params.id);
  if (!part) {
    return res.status(404).json({ error: '备件不存在' });
  }
  res.json(part);
});

router.post('/:id/request', authenticateToken, (req, res) => {
  const index = spareParts.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '备件不存在' });
  }

  const { quantity, workOrderId } = req.body;
  if (spareParts[index].stock < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  spareParts[index].stock -= quantity;
  
  res.json({
    success: true,
    remainingStock: spareParts[index].stock,
  });
});

router.post('/:id/restock', authenticateToken, (req, res) => {
  const index = spareParts.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '备件不存在' });
  }

  const { quantity } = req.body;
  spareParts[index].stock += quantity;
  spareParts[index].lastPurchase = new Date().toISOString().split('T')[0];
  
  res.json(spareParts[index]);
});

router.get('/alerts/low-stock', authenticateToken, (req, res) => {
  const lowStockItems = spareParts.filter(p => p.stock <= p.minStock);
  res.json(lowStockItems);
});

module.exports = router;
