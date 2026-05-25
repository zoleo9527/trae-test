import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import rehearsalRoutes from './routes/rehearsalRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/performances', performanceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rehearsals', rehearsalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`剧院管理系统服务已启动: http://localhost:${PORT}`);
  console.log('');
  console.log('测试账号:');
  console.log('  剧院经理: manager / manager123');
  console.log('  票务主管: ticket / ticket123');
  console.log('  后台统筹: backend / backend123');
  console.log('');
});
