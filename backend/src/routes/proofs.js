const express = require('express');
const router = express.Router();
const { all, get, run } = require('../config/database');
const { logActivity } = require('../middleware/logger');

router.post('/quote/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { assigned_to, created_by } = req.body;
    
    const date = new Date();
    const countResult = await get('SELECT COUNT(*) as cnt FROM proofs');
    const proofNo = `P${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(countResult.cnt + 1).padStart(3, '0')}`;
    
    await run(`
      INSERT INTO proofs (quote_id, proof_no, status, assigned_to)
      VALUES (?, ?, 'pending', ?)
    `, [quoteId, proofNo, assigned_to]);
    
    await run("UPDATE quotes SET status = 'proofing', current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [assigned_to, quoteId]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [created_by]);
    await logActivity(quoteId, 'create_proof', `创建打样任务 ${proofNo}`, created_by, user?.name);
    
    res.json({ success: true, data: { proof_no: proofNo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/upload', async (req, res) => {
  try {
    const { id } = req.params;
    const { images, operator_id } = req.body;
    
    const proof = await get('SELECT * FROM proofs WHERE id = ?', [id]);
    if (!proof) {
      return res.status(404).json({ success: false, message: '打样记录不存在' });
    }
    
    if (proof.status !== 'pending' && proof.status !== 'reproofing') {
      return res.status(400).json({ success: false, message: '当前状态不允许上传样照' });
    }
    
    await run(`
      UPDATE proofs 
      SET proof_images = ?, status = 'uploaded', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(images), id]);
    
    await run("UPDATE quotes SET current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [operator_id, proof.quote_id]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [operator_id]);
    await logActivity(proof.quote_id, 'upload_proof', `上传打样照片: ${images.length}张`, operator_id, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/submit-review', async (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id } = req.body;
    
    const proof = await get('SELECT * FROM proofs WHERE id = ?', [id]);
    if (!proof) {
      return res.status(404).json({ success: false, message: '打样记录不存在' });
    }
    
    if (proof.status !== 'uploaded') {
      return res.status(400).json({ success: false, message: '请先上传样照再提交客户确认' });
    }
    
    await run(`
      UPDATE proofs SET status = 'customer_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [id]);
    
    const quote = await get('SELECT created_by FROM quotes WHERE id = ?', [proof.quote_id]);
    await run("UPDATE quotes SET current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [quote.created_by, proof.quote_id]);
    
    const user = await get('SELECT name FROM users WHERE id = ?', [operator_id]);
    await logActivity(proof.quote_id, 'submit_review', '提交客户确认', operator_id, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, confirmed, operator_id, proof_user_id } = req.body;
    
    const proof = await get('SELECT * FROM proofs WHERE id = ?', [id]);
    if (!proof) {
      return res.status(404).json({ success: false, message: '打样记录不存在' });
    }
    
    if (proof.status !== 'customer_review' && proof.status !== 'reproofing') {
      return res.status(400).json({ success: false, message: '请先上传样照并提交客户确认' });
    }
    
    if (confirmed) {
      await run(`
        UPDATE proofs 
        SET customer_feedback = ?, status = 'confirmed', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [feedback, operator_id, id]);
      
      await run("UPDATE quotes SET status = 'production', current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [operator_id, proof.quote_id]);
    } else {
      await run(`
        UPDATE proofs 
        SET customer_feedback = ?, status = 'reproofing', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [feedback, id]);
      
      await run("UPDATE quotes SET current_handler = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [proof_user_id || proof.assigned_to, proof.quote_id]);
    }
    
    const user = await get('SELECT name FROM users WHERE id = ?', [operator_id]);
    await logActivity(proof.quote_id, confirmed ? 'confirm_proof' : 'customer_feedback', 
      `客户${confirmed ? '确认打样' : '反馈'}：${feedback}`, operator_id, user?.name);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
