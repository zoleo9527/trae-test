const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { spareParts, workOrders } = require('../data/database');

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

router.get('/alerts/low-stock', authenticateToken, (req, res) => {
  const lowStockItems = spareParts.filter(p => p.stock <= p.minStock);
  res.json(lowStockItems);
});

router.post('/:id/request', authenticateToken, (req, res) => {
  const partIndex = spareParts.findIndex(p => p.id === req.params.id);
  if (partIndex === -1) {
    return res.status(404).json({ error: '备件不存在' });
  }

  const { quantity, workOrderId } = req.body;
  if (spareParts[partIndex].stock < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  spareParts[partIndex].stock -= quantity;

  const usageRecord = {
    workOrderId,
    workOrderTitle: '',
    quantity,
    operator: req.user.name,
    time: new Date().toISOString(),
  };

  if (!spareParts[partIndex].usageHistory) {
    spareParts[partIndex].usageHistory = [];
  }

  if (workOrderId) {
    const woIndex = workOrders.findIndex(w => w.id === workOrderId);
    if (woIndex !== -1) {
      usageRecord.workOrderTitle = workOrders[woIndex].title;

      if (!workOrders[woIndex].spareParts) {
        workOrders[woIndex].spareParts = [];
      }
      workOrders[woIndex].spareParts.push({
        id: spareParts[partIndex].id,
        name: spareParts[partIndex].name,
        quantity,
        status: 'used',
        requestTime: new Date().toISOString(),
      });
    }
  }

  spareParts[partIndex].usageHistory.unshift(usageRecord);
  
  res.json({
    success: true,
    remainingStock: spareParts[partIndex].stock,
    part: spareParts[partIndex],
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

router.get('/:id', authenticateToken, (req, res) => {
  const part = spareParts.find(p => p.id === req.params.id);
  if (!part) {
    return res.status(404).json({ error: '备件不存在' });
  }
  res.json(part);
});

module.exports = router;
