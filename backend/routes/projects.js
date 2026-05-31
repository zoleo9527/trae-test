const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { status, manager_id } = req.query;
  let sql = `
    SELECT p.*, u.name as manager_name 
    FROM projects p 
    LEFT JOIN users u ON p.manager_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (manager_id) {
    sql += ' AND p.manager_id = ?';
    params.push(manager_id);
  }
  db.all(sql, params, (err, projects) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(projects);
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT p.*, u.name as manager_name 
    FROM projects p 
    LEFT JOIN users u ON p.manager_id = u.id
    WHERE p.id = ?
  `, [id], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json(project);
  });
});

router.post('/', (req, res) => {
  const { name, client_name, address, contract_start_date, contract_end_date, contract_amount, manager_id } = req.body;
  db.run(`
    INSERT INTO projects (name, client_name, address, contract_start_date, contract_end_date, contract_amount, manager_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [name, client_name, address, contract_start_date, contract_end_date, contract_amount, manager_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '创建成功' });
  });
});

router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, remark, changed_by } = req.body;
  
  db.get('SELECT status FROM projects WHERE id = ?', [id], (err, oldProject) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.run('UPDATE projects SET status = ? WHERE id = ?', [status, id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.run(`
        INSERT INTO status_history (related_type, related_id, old_status, new_status, remark, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['project', id, oldProject.status, status, remark, changed_by]);
      res.json({ message: '状态更新成功' });
    });
  });
});

module.exports = router;
