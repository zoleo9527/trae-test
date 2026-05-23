const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const gridDocsRoutes = require('./routes/gridDocs');
const paymentRoutes = require('./routes/payment');
const workOrderRoutes = require('./routes/workOrders');
const sparePartsRoutes = require('./routes/spareParts');
const dashboardRoutes = require('./routes/dashboard');
const powerDataRoutes = require('./routes/powerData');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/grid-docs', gridDocsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/spare-parts', sparePartsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/power-data', powerDataRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '光伏运维管理系统 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
