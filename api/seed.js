const { openDB, migrate, DB_PATH } = require('./db');
const fs = require('fs');
const path = require('path');

function seed() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  migrate();
  const db = openDB();

  const users = [
    { id: 1, username: 'director', name: '王理事', role: 'director' },
    { id: 2, username: 'dispatcher', name: '李调度', role: 'dispatcher' },
    { id: 3, username: 'op1', name: '张机手', role: 'operator' },
    { id: 4, username: 'op2', name: '刘机手', role: 'operator' },
    { id: 5, username: 'op3', name: '赵机手', role: 'operator' }
  ];
  const insUser = db.prepare(
    'INSERT INTO users(id, username, name, role) VALUES(?,?,?,?)'
  );
  for (const u of users) insUser.run(u.id, u.username, u.name, u.role);

  const apps = [
    {
      code: 'BT-20260501', farmer_name: '陈大户', field_name: '东河地',
      field_area: 120, crop_type: '水稻', operation_type: '机耕',
      status: 'submitted', submitted_by: 2, submitted_at: '2026-05-01 08:30'
    },
    {
      code: 'BT-20260502', farmer_name: '周家湾', field_name: '西坡地',
      field_area: 86, crop_type: '小麦', operation_type: '播种',
      status: 'scheduled', submitted_by: 2, submitted_at: '2026-05-02 09:15',
      scheduled_for: '2026-05-05', scheduled_operator_id: 3,
      note: '村民要求 5 日前完成'
    },
    {
      code: 'BT-20260503', farmer_name: '李家庄', field_name: '南塘地',
      field_area: 220, crop_type: '玉米', operation_type: '机耕',
      status: 'in_progress', submitted_by: 2, submitted_at: '2026-05-03 07:50',
      scheduled_for: '2026-05-04', scheduled_operator_id: 4
    },
    {
      code: 'BT-20260504', farmer_name: '王老五', field_name: '北岭地',
      field_area: 45, crop_type: '花生', operation_type: '播种',
      status: 'rejected', submitted_by: 2, submitted_at: '2026-05-03 10:10',
      note: '材料缺失：未提供土地流转合同，需补充后重新申报'
    },
    {
      code: 'BT-20260505', farmer_name: '赵家庄', field_name: '东岭地',
      field_area: 150, crop_type: '水稻', operation_type: '机耕',
      status: 'completed', submitted_by: 2, submitted_at: '2026-04-28 09:00',
      scheduled_for: '2026-05-01', scheduled_operator_id: 5
    }
  ];
  const insApp = db.prepare(`
    INSERT INTO subsidy_applications(code, farmer_name, field_name, field_area,
      crop_type, operation_type, status, submitted_by, submitted_at,
      scheduled_for, scheduled_operator_id, note)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const appIds = [];
  for (const a of apps) {
    const info = insApp.run(
      a.code, a.farmer_name, a.field_name, a.field_area,
      a.crop_type, a.operation_type, a.status, a.submitted_by,
      a.submitted_at, a.scheduled_for, a.scheduled_operator_id, a.note
    );
    appIds.push(Number(info.lastInsertRowid));
  }

  const insReport = db.prepare(`
    INSERT INTO task_reports(application_id, operator_id, reported_at,
      progress_pct, area_done, issue_type, issue_note)
    VALUES(?,?,?,?,?,?,?)
  `);
  insReport.run(appIds[2], 4, '2026-05-04 18:00', 60, 132, null, null);

  const insFuel = db.prepare(`
    INSERT INTO fuel_logs(application_id, operator_id, vehicle_no,
      liters, cost, recorded_at, note)
    VALUES(?,?,?,?,?,?,?)
  `);
  insFuel.run(appIds[2], 4, '鲁H-88231', 120, 900, '2026-05-04 17:30', '上午加油');
  insFuel.run(appIds[4], 5, '鲁H-77128', 80, 600, '2026-05-02 16:00', '作业完毕回库');

  const insFlag = db.prepare(`
    INSERT INTO review_flags(application_id, flag_type, severity, status,
      created_by, created_at, note)
    VALUES(?,?,?,?,?,?,?)
  `);
  insFlag.run(appIds[1], 'missing_doc', 'high', 'open', 2, '2026-05-03 09:30',
    '身份证复印件未收回');
  insFlag.run(appIds[2], 'late_progress', 'normal', 'open', 2, '2026-05-05 09:00',
    '原计划 5 日前完工，当前 60% 需跟进');
  insFlag.run(appIds[2], 'maintenance', 'low', 'open', 4, '2026-05-04 18:10',
    '作业中出现轻微渗漏，建议检修');

  const insMat = db.prepare(`
    INSERT INTO subsidy_materials(application_id, material_type, collected,
      collected_at, note)
    VALUES(?,?,?,?,?)
  `);
  const materials = ['土地流转合同', '身份证复印件', '作业确认单', '农机作业小票'];
  for (let i = 0; i < apps.length; i++) {
    const a = apps[i];
    const appId = appIds[i];
    for (const m of materials) {
      let collected = 0;
      if (a.status === 'completed') collected = 1;
      if (i === 1 && m === '身份证复印件') collected = 0;
      insMat.run(appId, m, collected, collected ? '2026-05-04 10:00' : null, null);
    }
  }

  const insSession = db.prepare(
    'INSERT INTO sessions(token, user_id, created_at) VALUES(?,?,?)'
  );
  insSession.run('dir-token', 1, '2026-05-26 09:00');
  insSession.run('dis-token', 2, '2026-05-26 09:00');
  insSession.run('op1-token', 3, '2026-05-26 09:00');
  insSession.run('op2-token', 4, '2026-05-26 09:00');

  db.close();
  console.log('seeded:', DB_PATH);
}

if (require.main === module) seed();
module.exports = seed;
