const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const sequelize = require('./config/database');
const {
  User, Book, Channel, SampleShipment, Feedback, Return,
  Reconciliation, ReconciliationItem, ActivityLog
} = require('./models');

const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const feedbackRoutes = require('./routes/feedbacks');
const returnRoutes = require('./routes/returns');
const reconciliationRoutes = require('./routes/reconciliations');
const dashboardRoutes = require('./routes/dashboard');
const commonRoutes = require('./routes/common');

const {
  getInitUsers, getInitBooks, getInitChannels, getInitShipments,
  getInitFeedbacks, getInitReturns, getInitReconciliations,
  getInitReconciliationItems, getInitActivityLogs
} = require('./data/initData');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/reconciliations', reconciliationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/common', commonRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '图书发行系统服务正常' });
});

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: true });
    console.log('数据库表创建完成');

    await User.bulkCreate(getInitUsers());
    console.log('用户数据初始化完成');

    await Book.bulkCreate(getInitBooks());
    console.log('图书数据初始化完成');

    await Channel.bulkCreate(getInitChannels());
    console.log('渠道数据初始化完成');

    await SampleShipment.bulkCreate(getInitShipments());
    console.log('寄送数据初始化完成');

    await Feedback.bulkCreate(getInitFeedbacks());
    console.log('反馈数据初始化完成');

    await Return.bulkCreate(getInitReturns());
    console.log('退货数据初始化完成');

    await Reconciliation.bulkCreate(getInitReconciliations());
    console.log('对账数据初始化完成');

    await ReconciliationItem.bulkCreate(getInitReconciliationItems());
    console.log('对账明细初始化完成');

    await ActivityLog.bulkCreate(getInitActivityLogs());
    console.log('操作日志初始化完成');

    console.log('所有初始化数据已加载');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

app.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  await initDatabase();
});
