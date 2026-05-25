const express = require('express');
const authRoutes = require('./authRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const equipmentRoutes = require('./equipmentRoutes');
const reviewRoutes = require('./reviewRoutes');
const orderRoutes = require('./orderRoutes');
const remarkRoutes = require('./remarkRoutes');
const auditRoutes = require('./auditRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Theater Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', orderRoutes);
router.use('/remarks', remarkRoutes);
router.use('/audit-logs', auditRoutes);

module.exports = router;
