const express = require('express');
const cors = require('cors');
const { initDatabase, initSampleData } = require('./database');
const { createSampleScenarios } = require('./sample-scenarios');

const authRoutes = require('./routes/auth');
const transferRoutes = require('./routes/transfers');
const inventoryRoutes = require('./routes/inventory');
const dispositionRoutes = require('./routes/dispositions');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/stores');
const dashboardRoutes = require('./routes/dashboard');
const repairRoutes = require('./routes/repairs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();
initSampleData();
createSampleScenarios();

app.use('/api/auth', authRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dispositions', dispositionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/repairs', repairRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jewelry System API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   珠宝门店调货与盘点管理系统 - 后端服务已启动               ║
║                                                            ║
║   服务地址: http://localhost:${PORT}                        ║
║   健康检查: http://localhost:${PORT}/api/health             ║
║                                                            ║
║   测试账号:                                                ║
║     - 店长:   bj_manager / 123456  (北京王府井店)          ║
║     - 导购:   bj_sales1  / 123456                          ║
║     - 售后:   bj_aftersale / 123456                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
