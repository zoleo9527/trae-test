const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let db;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'study-abroad.db');
}

function initDatabase() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initTables();
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      target_country TEXT,
      target_major TEXT,
      gpa REAL,
      language_score TEXT,
      status TEXT DEFAULT 'active',
      consultant TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS school_programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      school_name TEXT NOT NULL,
      program_name TEXT NOT NULL,
      deadline DATE,
      application_status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 2,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      doc_name TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      file_path TEXT,
      submitted_at DATETIME,
      reviewed_by TEXT,
      review_notes TEXT,
      is_latest INTEGER DEFAULT 1,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS essays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      school_program_id INTEGER,
      essay_title TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft',
      content TEXT,
      feedback TEXT,
      deadline DATE,
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (school_program_id) REFERENCES school_programs(id)
    );

    CREATE TABLE IF NOT EXISTS visa_process (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      visa_type TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      appointment_date DATE,
      interview_date DATE,
      result_date DATE,
      result TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      requested_by TEXT,
      approved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id);
    CREATE INDEX IF NOT EXISTS idx_logs_student ON operation_logs(student_id);
  `);
}

function initDemoData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin123', 'manager', '王主管');
  insertUser.run('writer1', 'writer123', 'writer', '李文案');
  insertUser.run('visa1', 'visa123', 'visa', '张签证');

  const students = [
    { name: '张明', phone: '13800138001', email: 'zhangming@email.com', target_country: '美国', target_major: '计算机科学', gpa: 3.8, consultant: '王主管', status: 'active' },
    { name: '李华', phone: '13800138002', email: 'lihua@email.com', target_country: '英国', target_major: '金融学', gpa: 3.5, consultant: '王主管', status: 'active' },
    { name: '王芳', phone: '13800138003', email: 'wangfang@email.com', target_country: '澳大利亚', target_major: '教育学', gpa: 3.2, consultant: '王主管', status: 'warning' },
    { name: '赵伟', phone: '13800138004', email: 'zhaowei@email.com', target_country: '加拿大', target_major: '工程管理', gpa: 3.0, consultant: '王主管', status: 'refund_pending' },
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (name, phone, email, target_country, target_major, gpa, consultant, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  students.forEach((s, idx) => {
    const result = insertStudent.run(s.name, s.phone, s.email, s.target_country, s.target_major, s.gpa, s.consultant, s.status);
    const studentId = result.lastInsertRowid;

    if (idx === 0) {
      const insertProgram = db.prepare(`
        INSERT INTO school_programs (student_id, school_name, program_name, deadline, application_status, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertProgram.run(studentId, '斯坦福大学', '计算机科学硕士', '2025-01-15', 'submitted', 1, '冲刺校，需要补充科研经历');
      insertProgram.run(studentId, '加州大学伯克利分校', '计算机科学硕士', '2024-12-20', 'materials_missing', 2, '成绩单未官方认证');
      insertProgram.run(studentId, '南加州大学', '计算机科学硕士', '2025-02-01', 'pending', 3, '保底校');

      const insertDoc = db.prepare(`
        INSERT INTO documents (student_id, doc_type, doc_name, version, status, review_notes, is_latest)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertDoc.run(studentId, 'transcript', '大学成绩单', 1, 'approved', 'GPA 3.8，排名前5%', 1);
      insertDoc.run(studentId, 'recommendation', '推荐信1', 1, 'pending', NULL, 1);
      insertDoc.run(studentId, 'recommendation', '推荐信2', 1, 'rejected', '推荐人信息不完整', 1);
      insertDoc.run(studentId, 'personal_statement', '个人陈述', 2, 'reviewing', '需要修改职业规划部分', 1);

      const insertEssay = db.prepare(`
        INSERT INTO essays (student_id, essay_title, version, status, deadline, assigned_to, feedback)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertEssay.run(studentId, 'Why CS Essay', 2, 'reviewing', '2024-12-10', '李文案', '技术深度足够，但缺少个人故事');
      insertEssay.run(studentId, 'Leadership Statement', 1, 'draft', '2024-12-20', '李文案', NULL);
    }

    if (idx === 2) {
      const insertProgram = db.prepare(`
        INSERT INTO school_programs (student_id, school_name, program_name, deadline, application_status, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertProgram.run(studentId, '墨尔本大学', '教育学硕士', '2024-11-30', 'deadline_missed', 1, '已错过截止日期，学生沟通不畅');

      const insertDoc = db.prepare(`
        INSERT INTO documents (student_id, doc_type, doc_name, version, status, review_notes, is_latest)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertDoc.run(studentId, 'transcript', '大学成绩单', 1, 'approved', NULL, 1);
      insertDoc.run(studentId, 'language', '雅思成绩', 1, 'pending', NULL, 1);
    }

    if (idx === 3) {
      const insertRefund = db.prepare(`
        INSERT INTO refund_requests (student_id, amount, reason, status, requested_by)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertRefund.run(studentId, 15000, 'GPA不足，申请难度大，学生要求退款', 'pending', '王主管');

      const insertVisa = db.prepare(`
        INSERT INTO visa_process (student_id, visa_type, status, notes)
        VALUES (?, ?, ?, ?)
      `);
      insertVisa.run(studentId, '加拿大学签', 'not_started', '退款申请中，暂停签证流程');
    }
  });

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (student_id, operator, action, module, details)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertLog.run(1, '李文案', 'update_status', 'document', '推荐信2被标记为需要修改');
  insertLog.run(2, '王主管', 'create', 'student', '创建学生李华档案');
  insertLog.run(3, '系统', 'alert', 'deadline', '墨尔本大学申请已过截止日期');
  insertLog.run(4, '王主管', 'request', 'refund', '提交退款申请');
}

function createWindow() {
  const savedBounds = store.get('windowBounds');
  mainWindow = new BrowserWindow({
    width: savedBounds?.width || 1400,
    height: savedBounds?.height || 900,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '留学服务追踪系统'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  initDemoData();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('db:query', (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return { success: true, data: stmt.all(...params) };
    } else {
      const result = stmt.run(...params);
      return { success: true, data: { changes: result.changes, lastInsertRowid: result.lastInsertRowid } };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:get', (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    return { success: true, data: stmt.get(...params) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('student:timeline', async (event, studentId) => {
  try {
    const programs = db.prepare('SELECT * FROM school_programs WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
    const documents = db.prepare('SELECT * FROM documents WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
    const essays = db.prepare('SELECT * FROM essays WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
    const visas = db.prepare('SELECT * FROM visa_process WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
    const refunds = db.prepare('SELECT * FROM refund_requests WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
    const logs = db.prepare('SELECT * FROM operation_logs WHERE student_id = ? ORDER BY created_at DESC').all(studentId);

    const timeline = [];
    programs.forEach(p => timeline.push({ type: 'program', date: p.created_at, data: p, title: `申请: ${p.school_name}` }));
    documents.forEach(d => timeline.push({ type: 'document', date: d.created_at, data: d, title: `材料: ${d.doc_name}` }));
    essays.forEach(e => timeline.push({ type: 'essay', date: e.created_at, data: e, title: `文书: ${e.essay_title}` }));
    visas.forEach(v => timeline.push({ type: 'visa', date: v.created_at, data: v, title: `签证: ${v.visa_type}` }));
    refunds.forEach(r => timeline.push({ type: 'refund', date: r.created_at, data: r, title: `退款申请: ¥${r.amount}` }));
    logs.forEach(l => timeline.push({ type: 'log', date: l.created_at, data: l, title: `操作: ${l.action}` }));

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { success: true, data: timeline };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('document:newVersion', async (event, docId, reviewNotes) => {
  try {
    const oldDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    if (!oldDoc) throw new Error('Document not found');

    db.prepare('UPDATE documents SET is_latest = 0 WHERE id = ?').run(docId);

    const result = db.prepare(`
      INSERT INTO documents (student_id, doc_type, doc_name, version, status, parent_id, review_notes, is_latest)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, 1)
    `).run(oldDoc.student_id, oldDoc.doc_type, oldDoc.doc_name, oldDoc.version + 1, docId, reviewNotes);

    return { success: true, data: { newId: result.lastInsertRowid } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export:receipt', async (event, studentId) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    const programs = db.prepare('SELECT * FROM school_programs WHERE student_id = ?').all(studentId);
    const documents = db.prepare('SELECT * FROM documents WHERE student_id = ? AND is_latest = 1').all(studentId);

    const receipt = {
      student,
      programs,
      documents,
      exportTime: new Date().toISOString(),
      summary: {
        totalPrograms: programs.length,
        totalDocuments: documents.length,
        approvedDocs: documents.filter(d => d.status === 'approved').length
      }
    };

    return { success: true, data: receipt };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cache:save', async (event, key, data) => {
  store.set(key, data);
  return { success: true };
});

ipcMain.handle('cache:get', async (event, key) => {
  return { success: true, data: store.get(key) };
});

ipcMain.handle('print:html', async (event, html) => {
  const printWindow = new BrowserWindow({ show: false });
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await printWindow.webContents.print();
  printWindow.close();
  return { success: true };
});

ipcMain.handle('dialog:showMessageBox', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});
