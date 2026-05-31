const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { project_id, status } = req.query;
  let sql = `
    SELECT r.*, p.name as project_name, p.client_name, p.contract_end_date,
           u.name as visitor_name
    FROM renewals r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u ON r.visitor_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) {
    sql += ' AND r.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.visit_date DESC';
  db.all(sql, params, (err, renewals) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(renewals);
  });
});

router.get('/pending-followup', (req, res) => {
  db.all(`
    SELECT r.*, p.name as project_name, p.client_name, p.contract_end_date,
           u.name as visitor_name
    FROM renewals r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u ON r.visitor_id = u.id
    WHERE r.status = 'followup'
    ORDER BY r.next_followup_date ASC
  `, (err, renewals) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(renewals);
  });
});

router.get('/:id/comments', (req, res) => {
  const { id } = req.params;
  db.all(`
    SELECT c.*, u.name as creator_name
    FROM comments c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.related_type = 'renewal' AND c.related_id = ?
    ORDER BY c.created_at DESC
  `, [id], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(comments);
  });
});

router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content, created_by } = req.body;
  db.run(`
    INSERT INTO comments (related_type, related_id, content, created_by)
    VALUES (?, ?, ?, ?)
  `, ['renewal', id, content, created_by], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '评论添加成功' });
  });
});

router.post('/', (req, res) => {
  const { project_id, visit_date, visitor_id, client_contact, satisfaction_score, 
          feedback, renewal_intention, next_followup_date, status } = req.body;
  db.run(`
    INSERT INTO renewals (project_id, visit_date, visitor_id, client_contact, 
                          satisfaction_score, feedback, renewal_intention, 
                          next_followup_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [project_id, visit_date, visitor_id, client_contact, satisfaction_score,
      feedback, renewal_intention, next_followup_date, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '回访记录创建成功' });
  });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, remark, changed_by, next_followup_date } = req.body;
  
  db.get('SELECT status, next_followup_date FROM renewals WHERE id = ?', [id], (err, oldRenewal) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    let updateSql = 'UPDATE renewals SET status = ?';
    const params = [status];
    
    if (next_followup_date) {
      updateSql += ', next_followup_date = ?';
      params.push(next_followup_date);
    }
    updateSql += ' WHERE id = ?';
    params.push(id);
    
    db.run(updateSql, params, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      let historyRemark = remark || '';
      if (next_followup_date && oldRenewal.next_followup_date !== next_followup_date) {
        historyRemark = (historyRemark ? historyRemark + '; ' : '') + `跟进日期从 ${oldRenewal.next_followup_date || '未设置'} 更新为 ${next_followup_date}`;
      }
      
      db.run(`
        INSERT INTO status_history (related_type, related_id, old_status, new_status, remark, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['renewal', id, oldRenewal.status, status, historyRemark, changed_by]);
      
      res.json({ message: '状态更新成功' });
    });
  });
});

module.exports = router;
