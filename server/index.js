const express = require('express');
const cors = require('cors');
const path = require('path');

const customerRoutes = require('./routes/customers');
const trialRoutes = require('./routes/trials');
const followupRoutes = require('./routes/followups');
const orderRoutes = require('./routes/orders');
const approvalRoutes = require('./routes/approvals');
const staffRoutes = require('./routes/staff');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
