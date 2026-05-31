const db = require('../config/db');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const createTables = (callback) => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      address TEXT,
      contract_start_date DATE,
      contract_end_date DATE,
      contract_amount REAL,
      status TEXT DEFAULT 'active',
      manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      cleaner_id INTEGER,
      schedule_date DATE NOT NULL,
      shift_type TEXT DEFAULT 'day',
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      checkin_time DATETIME,
      checkout_time DATETIME,
      status TEXT DEFAULT 'pending',
      image_url TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS quality_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      schedule_id INTEGER,
      inspector_id INTEGER,
      inspection_date DATE,
      score INTEGER,
      status TEXT DEFAULT 'pending',
      issues TEXT,
      rectification_deadline DATE,
      rectification_status TEXT DEFAULT 'none',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      unit TEXT,
      min_threshold INTEGER DEFAULT 10,
      last_restock_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS supply_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      supply_id INTEGER,
      requested_quantity INTEGER,
      status TEXT DEFAULT 'pending',
      requested_by INTEGER,
      approved_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      visit_date DATE,
      visitor_id INTEGER,
      client_contact TEXT,
      satisfaction_score INTEGER,
      feedback TEXT,
      renewal_intention TEXT,
      next_followup_date DATE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT,
      remark TEXT,
      changed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_type TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  let completed = 0;
  tables.forEach(sql => {
    db.run(sql, () => {
      completed++;
      if (completed === tables.length) {
        callback();
      }
    });
  });
};

const seedData = (callback) => {
  db.serialize(() => {
    const users = [
      { username: 'admin', password: '123456', name: '系统管理员', role: 'admin' },
      { username: 'manager1', password: '123456', name: '张主管', role: 'manager' },
      { username: 'manager2', password: '123456', name: '李主管', role: 'manager' },
      { username: 'scheduler1', password: '123456', name: '王排班', role: 'scheduler' },
      { username: 'inspector1', password: '123456', name: '刘质检', role: 'inspector' },
      { username: 'inspector2', password: '123456', name: '陈质检', role: 'inspector' },
      { username: 'cleaner1', password: '123456', name: '赵清洁', role: 'cleaner' },
      { username: 'cleaner2', password: '123456', name: '孙清洁', role: 'cleaner' },
      { username: 'cleaner3', password: '123456', name: '周清洁', role: 'cleaner' }
    ];

    const userStmt = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    users.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      userStmt.run(user.username, hashedPassword, user.name, user.role);
    });
    userStmt.finalize();

    const projects = [
      { name: '国贸大厦A座清洁', client_name: '国贸物业', manager_id: 2, contract_start_date: '2025-01-01', contract_end_date: '2026-01-01', contract_amount: 120000, status: 'active' },
      { name: '科技园办公楼', client_name: '科技园区管委会', manager_id: 2, contract_start_date: '2025-03-15', contract_end_date: '2026-03-15', contract_amount: 80000, status: 'active' },
      { name: '购物中心日常保洁', client_name: '万达商业', manager_id: 3, contract_start_date: '2025-02-01', contract_end_date: '2025-12-31', contract_amount: 150000, status: 'expiring' },
      { name: '医院住院部清洁', client_name: '市第一医院', manager_id: 3, contract_start_date: '2025-04-01', contract_end_date: '2026-04-01', contract_amount: 200000, status: 'active' },
      { name: '地铁站保洁服务', client_name: '地铁运营公司', manager_id: 2, contract_start_date: '2024-12-01', contract_end_date: '2025-11-30', contract_amount: 180000, status: 'renewal' }
    ];

    const projStmt = db.prepare('INSERT INTO projects (name, client_name, address, manager_id, contract_start_date, contract_end_date, contract_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    projects.forEach(project => {
      projStmt.run(project.name, project.client_name, '测试地址' + project.name, project.manager_id, project.contract_start_date, project.contract_end_date, project.contract_amount, project.status);
    });
    projStmt.finalize();

    const schedStmt = db.prepare('INSERT INTO schedules (project_id, cleaner_id, schedule_date, shift_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)');
    const today = dayjs();
    for (let i = 0; i < 30; i++) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      schedStmt.run(1, 7, date, 'day', i > 2 ? 'completed' : 'pending', 4);
      schedStmt.run(2, 8, date, 'day', i > 2 ? 'completed' : 'pending', 4);
      schedStmt.run(3, 9, date, 'night', i > 2 ? 'completed' : 'pending', 4);
      schedStmt.run(4, 7, date, 'day', i > 2 ? 'completed' : 'pending', 4);
    }
    schedStmt.finalize();

    const checkinStmt = db.prepare('INSERT INTO checkins (schedule_id, checkin_time, checkout_time, status, remark) VALUES (?, ?, ?, ?, ?)');
    for (let i = 3; i < 30; i++) {
      const baseId = (i * 4) + 1;
      checkinStmt.run(baseId, today.subtract(i, 'day').hour(8).minute(0).format('YYYY-MM-DD HH:mm:ss'), today.subtract(i, 'day').hour(17).minute(0).format('YYYY-MM-DD HH:mm:ss'), 'normal', null);
      checkinStmt.run(baseId + 1, today.subtract(i, 'day').hour(8).minute(15).format('YYYY-MM-DD HH:mm:ss'), today.subtract(i, 'day').hour(17).minute(0).format('YYYY-MM-DD HH:mm:ss'), 'late', null);
      checkinStmt.run(baseId + 2, today.subtract(i, 'day').hour(20).minute(0).format('YYYY-MM-DD HH:mm:ss'), today.subtract(i, 'day').add(1, 'day').hour(6).minute(0).format('YYYY-MM-DD HH:mm:ss'), 'normal', null);
      
      if (i % 5 === 0) {
        checkinStmt.run(baseId + 3, null, null, 'missed', '未打卡');
      } else {
        checkinStmt.run(baseId + 3, today.subtract(i, 'day').hour(8).minute(0).format('YYYY-MM-DD HH:mm:ss'), today.subtract(i, 'day').hour(17).minute(0).format('YYYY-MM-DD HH:mm:ss'), 'normal', null);
      }
    }
    checkinStmt.finalize();

    const inspStmt = db.prepare('INSERT INTO quality_inspections (project_id, inspector_id, inspection_date, score, status, issues, rectification_status, rectification_deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j < 4; j++) {
        const score = 80 + Math.floor(Math.random() * 20);
        const hasIssue = score < 90;
        inspStmt.run(
          i,
          j % 2 === 0 ? 5 : 6,
          today.subtract(j * 7, 'day').format('YYYY-MM-DD'),
          score,
          hasIssue ? 'rectification' : 'passed',
          hasIssue ? '地面有污渍,卫生间异味' : null,
          hasIssue ? (j === 0 ? 'pending' : 'completed') : 'none',
          hasIssue ? today.subtract(j * 7 - 2, 'day').format('YYYY-MM-DD') : null
        );
      }
    }
    inspStmt.finalize();

    const supplyStmt = db.prepare('INSERT INTO supplies (project_id, name, quantity, unit, min_threshold) VALUES (?, ?, ?, ?, ?)');
    const supplies = [
      [1, '清洁剂', 5, '瓶', 10],
      [1, '垃圾袋', 50, '个', 100],
      [1, '拖布', 2, '把', 5],
      [2, '清洁剂', 15, '瓶', 10],
      [2, '垃圾袋', 200, '个', 100],
      [3, '清洁剂', 3, '瓶', 10],
      [3, '玻璃水', 8, '瓶', 10],
      [4, '消毒液', 2, '桶', 5],
      [4, '手套', 20, '双', 30],
      [5, '清洁剂', 12, '瓶', 10]
    ];
    supplies.forEach(s => supplyStmt.run(...s));
    supplyStmt.finalize();

    const reqStmt = db.prepare('INSERT INTO supply_requests (project_id, supply_id, requested_quantity, status, requested_by, approved_by, remark) VALUES (?, ?, ?, ?, ?, ?, ?)');
    reqStmt.run(1, 1, 20, 'pending', 4, null, '库存不足，急需补充');
    reqStmt.run(1, 2, 300, 'approved', 4, 2, null);
    reqStmt.run(3, 6, 15, 'pending', 4, null, '月底前需要');
    reqStmt.run(4, 8, 10, 'rejected', 4, 3, '请核实实际用量');
    reqStmt.finalize();

    const renewStmt = db.prepare('INSERT INTO renewals (project_id, visit_date, visitor_id, client_contact, satisfaction_score, feedback, renewal_intention, next_followup_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    renewStmt.run(3, today.subtract(5, 'day').format('YYYY-MM-DD'), 2, '王经理', 4, '整体服务不错，希望加强节假日清洁', 'high', today.add(5, 'day').format('YYYY-MM-DD'), 'followup');
    renewStmt.run(5, today.subtract(10, 'day').format('YYYY-MM-DD'), 3, '李总', 3, '部分区域清洁不到位，需要改进', 'medium', today.add(3, 'day').format('YYYY-MM-DD'), 'followup');
    renewStmt.run(1, today.subtract(30, 'day').format('YYYY-MM-DD'), 2, '张主任', 5, '服务非常满意', 'high', null, 'completed');
    renewStmt.run(4, today.subtract(15, 'day').format('YYYY-MM-DD'), 3, '刘主任', 4, '服务质量稳定，继续保持', 'high', today.add(10, 'day').format('YYYY-MM-DD'), 'followup');
    renewStmt.finalize();

    const commentStmt = db.prepare('INSERT INTO comments (related_type, related_id, content, created_by, created_at) VALUES (?, ?, ?, ?, ?)');
    const now = dayjs();
    
    commentStmt.run('checkin', 16, '当天该清洁员请假未及时报备，请补走请假流程', 4, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('checkin', 16, '已收到请假申请，确认补卡通过', 2, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('checkin', 36, '连续两天漏打卡，需要约谈了解情况', 5, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    commentStmt.run('inspection', 1, '已安排整改，清洁班组加班处理，请尽快复查', 2, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('inspection', 1, '复查通过，整改质量合格', 5, now.format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('inspection', 5, '卫生间异味问题比较严重，建议增加清洁频次', 3, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    commentStmt.run('renewal', 1, '客户对我们的服务整体还是认可的，已发送续约报价', 2, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('renewal', 1, '报价已确认，等待客户走内部审批流程', 2, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('renewal', 2, '客户对夜间清洁质量有异议，需重点关注并改进', 3, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('renewal', 4, '医院领导对消毒工作很满意，续约希望很大', 3, now.subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    commentStmt.run('supply', 3, '拖布损耗较大，建议增加备用库存', 5, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('supply', 6, '清洁剂用量异常，请核实实际使用情况', 2, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    commentStmt.run('supply_request', 1, '库存确实紧张，建议尽快采购', 4, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.run('supply_request', 4, '上月刚采购过，确认是否有浪费情况', 3, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    commentStmt.finalize();

    const historyStmt = db.prepare('INSERT INTO status_history (related_type, related_id, old_status, new_status, remark, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    historyStmt.run('project', 3, 'active', 'expiring', '合同即将到期，启动续约跟进', 2, now.subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('project', 5, 'active', 'renewal', '续约谈判中', 2, now.subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    historyStmt.run('checkin', 16, 'missed', 'verified', '补卡申请通过', 2, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('checkin', 36, 'missed', 'rejected', '无故旷工，按规定处理', 2, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    historyStmt.run('inspection', 1, 'pending', 'rectification', '发现问题需要整改', 5, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('inspection', 1, 'rectification', 'passed', '整改完成，复查通过', 5, now.format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('inspection', 5, 'pending', 'rectification', '清洁质量不达标', 6, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    historyStmt.run('supply_request', 2, 'pending', 'approved', '同意领用', 2, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('supply_request', 4, 'pending', 'rejected', '用量异常，需核实', 3, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('supply_request', 1, null, 'pending', '新建补货申请', 4, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('supply_request', 3, null, 'pending', '新建补货申请', 4, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    historyStmt.run('renewal', 1, null, 'followup', '首次回访，待跟进', 2, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('renewal', 2, null, 'followup', '回访完成，待进一步沟通', 3, now.subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.run('renewal', 3, 'followup', 'completed', '续约成功', 2, now.subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss'));
    historyStmt.finalize();

    const notifStmt = db.prepare('INSERT INTO notifications (user_id, type, title, content, related_type, related_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    
    notifStmt.run(2, 'checkin', '漏打卡提醒', '国贸大厦A座有1人次未打卡', 'checkin', 16, 0, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(2, 'checkin', '漏打卡提醒', '医院住院部有1人次未打卡', 'checkin', 36, 1, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(2, 'checkin', '迟到提醒', '科技园办公楼清洁员迟到', 'checkin', 2, 1, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    notifStmt.run(2, 'inspection', '待整改提醒', '科技园办公楼质检发现问题待整改', 'inspection', 5, 0, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(3, 'inspection', '待整改提醒', '购物中心日常保洁质检需整改', 'inspection', 9, 0, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(2, 'inspection', '整改完成通知', '国贸大厦A座整改已复查通过', 'inspection', 1, 1, now.format('YYYY-MM-DD HH:mm:ss'));
    
    notifStmt.run(2, 'supply', '库存预警', '购物中心清洁剂库存不足', 'supply', 6, 0, now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(3, 'supply', '库存预警', '医院消毒液库存不足', 'supply', 8, 0, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(2, 'supply', '补货申请提醒', '有2笔补货申请待审批', 'supply_request', 1, 0, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    notifStmt.run(2, 'renewal', '续约回访提醒', '购物中心合同即将到期，请安排回访', 'renewal', 1, 0, now.subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(3, 'renewal', '续约跟进提醒', '地铁站续约需再次跟进', 'renewal', 2, 0, now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(2, 'renewal', '回访提醒', '医院项目下次跟进日期已到', 'renewal', 4, 0, now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'));
    
    notifStmt.run(4, 'checkin', '排班通知', '下月排班已发布，请查看', 'schedule', 1, 1, now.subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.run(5, 'inspection', '质检任务', '本周有3个质检任务待完成', 'inspection', 0, 1, now.subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'));
    notifStmt.finalize();

    console.log('演示数据生成完成');
    callback();
  });
};

createTables(() => {
  console.log('数据表创建完成');
  seedData(() => {
    db.close(() => {
      console.log('数据库初始化完成');
    });
  });
});
