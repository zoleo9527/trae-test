const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/supplies', require('./routes/supplies'));
app.use('/api/renewals', require('./routes/renewals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/status-history', require('./routes/statusHistory'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
