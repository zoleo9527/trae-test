import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './config/database.js';

import { authenticate } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import complaintRoutes from './routes/complaints.js';
import milestoneRoutes from './routes/milestones.js';
import reminderRoutes from './routes/reminders.js';
import confirmationRoutes from './routes/confirmations.js';
import auditRoutes from './routes/audit.js';

const app = express();
const PORT = process.env.PORT || 3000;

initDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);

app.use('/api/users', authenticate, userRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/complaints', authenticate, complaintRoutes);
app.use('/api/milestones', authenticate, milestoneRoutes);
app.use('/api/reminders', authenticate, reminderRoutes);
app.use('/api/confirmations', authenticate, confirmationRoutes);
app.use('/api/audit', authenticate, auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   家装监理系统 - 客诉登记与节点提醒服务已启动                ║
║                                                           ║
║   服务地址: http://localhost:${PORT}                        ║
║   健康检查: http://localhost:${PORT}/api/health             ║
║                                                           ║
║   测试账号:                                               ║
║     监理负责人: supervisor / 123456                           ║
║     项目管家:   manager / 123456                          ║
║     业主客服:   service / 123456                          ║
║     管理员:     admin / 123456                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
