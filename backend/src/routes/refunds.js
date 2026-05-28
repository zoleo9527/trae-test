const express = require('express');
const router = express.Router();
const { all, get, run } = require('../config/database');
const { logActivity } = require('../middleware/logger');

router.post('/quote/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { amount, reason, applicant_id } = req.body;
    
    const date = new Date();
    const countResult = await get('SELECT COUNT(*) as cnt FROM refunds');
    const refundNo = `R${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(countResult.cnt + 1).padStart(3, '0')}`;
    
    await run(`
      INSERT INTO refunds (quote_id, refund_no, amount, reason, status, applicant_id)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `, [quoteId, refundNo, amount, reason, applicant_id]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [applicant_id]);
    await logActivity(quoteId, 'apply_refund', `申请退款 ${amount}元：${reason}`, applicant_id, user?.name);
    
    res.json({ success: true, data: { refund_no: refundNo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, status } = req.body;
    
    const refund = await get('SELECT * FROM refunds WHERE id = ?', [id]);
    if (!refund) {
      return res.status(404).json({ success: false, message: '退款记录不存在' });
    }
    
    await run(`
      UPDATE refunds 
      SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, approved_by, id]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [approved_by]);
    await logActivity(refund.quote_id, status === 'approved' ? 'approve_refund' : 'reject_refund', 
      `退款${status === 'approved' ? '通过' : '拒绝'}`, approved_by, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
