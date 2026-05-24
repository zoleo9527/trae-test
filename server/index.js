const express = require('express');
const next = require('next');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const studentRoutes = require('./routes/students');
const documentRoutes = require('./routes/documents');
const visaRoutes = require('./routes/visa');
const deadlineRoutes = require('./routes/deadlines');
const issueRoutes = require('./routes/issues');
const messageRoutes = require('./routes/messages');

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  server.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
  server.use(cookieParser());
  server.use(express.json());

  server.use('/api/auth', authRoutes);
  server.use('/api/dashboard', dashboardRoutes);
  server.use('/api/students', studentRoutes);
  server.use('/api/documents', documentRoutes);
  server.use('/api/visa', visaRoutes);
  server.use('/api/deadlines', deadlineRoutes);
  server.use('/api/issues', issueRoutes);
  server.use('/api/messages', messageRoutes);

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log('> Demo accounts:');
    console.log('  顾问主管: manager@demo.com / password123');
    console.log('  文案老师: writer@demo.com / password123');
    console.log('  签证助理: visa@demo.com / password123');
  });
});
