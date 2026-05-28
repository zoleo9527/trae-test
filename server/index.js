const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = require('./database');
const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const berthRoutes = require('./routes/berth');
const paymentRoutes = require('./routes/payments');
const crewRoutes = require('./routes/crew');
const supplyRoutes = require('./routes/supplies');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/berth-plans', authenticateToken, berthRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/crew-changes', authenticateToken, crewRoutes);
app.use('/api/supplies', authenticateToken, supplyRoutes);
app.use('/api/alerts', authenticateToken, alertRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Initializing sample data...');
  setTimeout(() => {
    require('./init-data')();
  }, 1000);
});
