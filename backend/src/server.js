const express = require('express');
const cors = require('cors');
const path = require('path');

const quotesRouter = require('./routes/quotes');
const proofsRouter = require('./routes/proofs');
const shipmentsRouter = require('./routes/shipments');
const refundsRouter = require('./routes/refunds');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/quotes', quotesRouter);
app.use('/api/proofs', proofsRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/refunds', refundsRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Gift Quote System API is running' });
});

app.get('/api/stats', async (req, res) => {
  try {
    const { get } = require('./config/database');
    const stats = await get(`
      SELECT 
        (SELECT COUNT(*) FROM quotes) as total_quotes,
        (SELECT COUNT(*) FROM quotes WHERE status = 'draft') as draft_count,
        (SELECT COUNT(*) FROM quotes WHERE status = 'pending_approval') as pending_approval_count,
        (SELECT COUNT(*) FROM quotes WHERE status = 'proofing') as proofing_count,
        (SELECT COUNT(*) FROM quotes WHERE status = 'production') as production_count,
        (SELECT COUNT(*) FROM quotes WHERE status = 'shipped') as shipped_count,
        (SELECT COUNT(*) FROM quotes WHERE status = 'completed') as completed_count
    `);
    
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
