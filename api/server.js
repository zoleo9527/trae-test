const express = require('express');
const cors = require('cors');
const { openDB, migrate, DB_PATH } = require('./db');
const fs = require('fs');
const seed = require('./seed');

if (!fs.existsSync(DB_PATH)) {
  console.log('[api] Database not found, running seed...');
  seed();
} else {
  console.log('[api] Database found, running migrate...');
  migrate();
}

const app = express();
app.use(cors());
app.use(express.json());

const db = openDB();

function getUserFromToken(req) {
  const token = req.headers['x-session-token'];
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token);
  return row || null;
}

function requireAuth(req, res, next) {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: '未登录或会话无效' });
  req.user = user;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.user);
});

app.get('/api/users', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, username, name, role FROM users ORDER BY id').all();
  res.json(rows);
});

app.post('/api/login', (req, res) => {
  const { username } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const token = `${user.username}-${Date.now()}`;
  db.prepare('INSERT INTO sessions(token, user_id, created_at) VALUES(?,?,?)')
    .run(token, user.id, new Date().toISOString());
  res.json({ token, user });
});

app.get('/api/subsidies', requireAuth, (req, res) => {
  const status = req.query.status;
  let rows;
  if (status) {
    rows = db.prepare(`
      SELECT s.*, u.name AS operator_name, submit.name AS submitter_name
      FROM subsidy_applications s
      LEFT JOIN users u ON u.id = s.scheduled_operator_id
      JOIN users submit ON submit.id = s.submitted_by
      WHERE s.status = ?
      ORDER BY s.id DESC
    `).all(status);
  } else {
    rows = db.prepare(`
      SELECT s.*, u.name AS operator_name, submit.name AS submitter_name
      FROM subsidy_applications s
      LEFT JOIN users u ON u.id = s.scheduled_operator_id
      JOIN users submit ON submit.id = s.submitted_by
      ORDER BY s.id DESC
    `).all();
  }
  res.json(rows);
});

app.get('/api/subsidies/:id', requireAuth, (req, res) => {
  const row = db.prepare(`
    SELECT s.*, u.name AS operator_name, submit.name AS submitter_name
    FROM subsidy_applications s
    LEFT JOIN users u ON u.id = s.scheduled_operator_id
    JOIN users submit ON submit.id = s.submitted_by
    WHERE s.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: '不存在' });
  const reports = db.prepare(`
    SELECT r.*, u.name AS operator_name
    FROM task_reports r JOIN users u ON u.id = r.operator_id
    WHERE r.application_id = ? ORDER BY r.id DESC
  `).all(req.params.id);
  const fuels = db.prepare(`
    SELECT f.*, u.name AS operator_name
    FROM fuel_logs f JOIN users u ON u.id = f.operator_id
    WHERE f.application_id = ? ORDER BY f.id DESC
  `).all(req.params.id);
  const materials = db.prepare('SELECT * FROM subsidy_materials WHERE application_id = ?')
    .all(req.params.id);
  const flags = db.prepare(`
    SELECT f.*, u.name AS created_by_name
    FROM review_flags f LEFT JOIN users u ON u.id = f.created_by
    WHERE f.application_id = ? ORDER BY f.id DESC
  `).all(req.params.id);
  res.json({ ...row, reports, fuels, materials, flags });
});

app.post('/api/subsidies', requireAuth, (req, res) => {
  const { farmer_name, field_name, field_area, crop_type, operation_type } = req.body;
  if (!farmer_name || !field_name || !field_area || !crop_type || !operation_type) {
    return res.status(400).json({ error: '字段不完整' });
  }
  const code = `BT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
  const info = db.prepare(`
    INSERT INTO subsidy_applications(code, farmer_name, field_name, field_area,
      crop_type, operation_type, status, submitted_by, submitted_at)
    VALUES(?,?,?,?,?,?,?,?,?)
  `).run(code, farmer_name, field_name, field_area, crop_type,
    operation_type, 'submitted', req.user.id, new Date().toISOString());

  const materials = ['土地流转合同', '身份证复印件', '作业确认单', '农机作业小票'];
  const insMat = db.prepare('INSERT INTO subsidy_materials(application_id, material_type) VALUES(?,?)');
  for (const m of materials) insMat.run(info.lastInsertRowid, m);
  res.json({ id: info.lastInsertRowid, code });
});

app.post('/api/subsidies/:id/schedule', requireAuth, requireRole(['director', 'dispatcher']),
  (req, res) => {
    const { scheduled_for, operator_id } = req.body;
    db.prepare(`
      UPDATE subsidy_applications
      SET scheduled_for = ?, scheduled_operator_id = ?, status = 'scheduled'
      WHERE id = ?
    `).run(scheduled_for, operator_id, req.params.id);
    res.json({ ok: true });
  });

app.post('/api/subsidies/:id/reject', requireAuth, requireRole(['director', 'dispatcher']),
  (req, res) => {
    const { note } = req.body;
    db.prepare("UPDATE subsidy_applications SET status = 'rejected', note = ? WHERE id = ?")
      .run(note || '驳回', req.params.id);
    res.json({ ok: true });
  });

app.post('/api/subsidies/:id/resubmit', requireAuth,
  (req, res) => {
    db.prepare("UPDATE subsidy_applications SET status = 'submitted', note = NULL WHERE id = ?")
      .run(req.params.id);
    res.json({ ok: true });
  });

app.post('/api/subsidies/:id/complete', requireAuth, requireRole(['director', 'dispatcher', 'operator']),
  (req, res) => {
    db.prepare("UPDATE subsidy_applications SET status = 'completed' WHERE id = ?")
      .run(req.params.id);
    res.json({ ok: true });
  });

app.post('/api/subsidies/:id/report', requireAuth, (req, res) => {
  const { progress_pct, area_done, issue_type, issue_note } = req.body;
  db.prepare(`
    INSERT INTO task_reports(application_id, operator_id, reported_at,
      progress_pct, area_done, issue_type, issue_note)
    VALUES(?,?,?,?,?,?,?)
  `).run(req.params.id, req.user.id, new Date().toISOString(),
    progress_pct, area_done, issue_type, issue_note);
  res.json({ ok: true });
});

app.get('/api/fuels', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT f.*, s.code AS app_code, u.name AS operator_name
    FROM fuel_logs f LEFT JOIN subsidy_applications s ON s.id = f.application_id
    JOIN users u ON u.id = f.operator_id
    ORDER BY f.id DESC
  `).all();
  res.json(rows);
});

app.post('/api/fuels', requireAuth, (req, res) => {
  const { application_id, vehicle_no, liters, cost, note } = req.body;
  db.prepare(`
    INSERT INTO fuel_logs(application_id, operator_id, vehicle_no, liters, cost, recorded_at, note)
    VALUES(?,?,?,?,?,?,?)
  `).run(application_id || null, req.user.id, vehicle_no, liters, cost,
    new Date().toISOString(), note);
  res.json({ ok: true });
});

app.post('/api/materials/:id/collect', requireAuth, (req, res) => {
  db.prepare(`
    UPDATE subsidy_materials SET collected = 1, collected_at = ? WHERE id = ?
  `).run(new Date().toISOString(), req.params.id);
  res.json({ ok: true });
});

app.post('/api/flags', requireAuth, (req, res) => {
  const { application_id, flag_type, severity, note } = req.body;
  db.prepare(`
    INSERT INTO review_flags(application_id, flag_type, severity, status,
      created_by, created_at, note)
    VALUES(?,?,?,?,?,?,?)
  `).run(application_id, flag_type, severity || 'normal', req.user.id,
    new Date().toISOString(), note);
  res.json({ ok: true });
});

app.post('/api/flags/:id/resolve', requireAuth, (req, res) => {
  db.prepare("UPDATE review_flags SET status = 'resolved' WHERE id = ?")
    .run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  const pending = db.prepare(
    "SELECT COUNT(*) AS c FROM subsidy_applications WHERE status IN ('submitted','scheduled')"
  ).get().c;
  const rejected = db.prepare(
    "SELECT COUNT(*) AS c FROM subsidy_applications WHERE status = 'rejected'"
  ).get().c;
  const reviewFlags = db.prepare(
    "SELECT COUNT(*) AS c FROM review_flags WHERE status = 'open'"
  ).get().c;
  const inProgress = db.prepare(
    "SELECT COUNT(*) AS c FROM subsidy_applications WHERE status = 'in_progress'"
  ).get().c;
  const completed = db.prepare(
    "SELECT COUNT(*) AS c FROM subsidy_applications WHERE status = 'completed'"
  ).get().c;

  const flags = db.prepare(`
    SELECT f.*, s.code AS app_code, s.farmer_name, s.field_name,
      u.name AS created_by_name
    FROM review_flags f JOIN subsidy_applications s ON s.id = f.application_id
    LEFT JOIN users u ON u.id = f.created_by
    WHERE f.status = 'open'
    ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, f.id DESC
    LIMIT 10
  `).all();

  const rejectedList = db.prepare(`
    SELECT id, code, farmer_name, field_name, note
    FROM subsidy_applications WHERE status = 'rejected' ORDER BY id DESC LIMIT 5
  `).all();

  const pendingList = db.prepare(`
    SELECT id, code, farmer_name, field_name, status, scheduled_for,
      crop_type, operation_type
    FROM subsidy_applications
    WHERE status IN ('submitted','scheduled')
    ORDER BY id DESC LIMIT 10
  `).all();

  res.json({
    counts: { pending, rejected, reviewFlags, inProgress, completed },
    flags, rejectedList, pendingList
  });
});

app.get('/api/review-board', requireAuth, (req, res) => {
  const applications = db.prepare(`
    SELECT s.*, u.name AS operator_name
    FROM subsidy_applications s
    LEFT JOIN users u ON u.id = s.scheduled_operator_id
    ORDER BY s.id DESC
  `).all();

  for (const a of applications) {
    a.reports = db.prepare('SELECT * FROM task_reports WHERE application_id = ? ORDER BY id DESC').all(a.id);
    a.fuels = db.prepare('SELECT * FROM fuel_logs WHERE application_id = ? ORDER BY id DESC').all(a.id);
    a.materials = db.prepare('SELECT * FROM subsidy_materials WHERE application_id = ?').all(a.id);
    a.flags = db.prepare('SELECT * FROM review_flags WHERE application_id = ? AND status = \'open\' ORDER BY id DESC').all(a.id);

    a.late_progress = a.status === 'in_progress' && a.reports.length > 0
      ? a.reports[0].progress_pct < 100
      : false;
    a.missing_docs = a.materials.some(m => !m.collected);
  }

  res.json(applications);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
