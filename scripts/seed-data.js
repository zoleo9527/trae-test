import 'dotenv/config';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbPath = process.env.DB_PATH || './data/database.db';
const db = new Database(dbPath);

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function generateNo(prefix) {
  const date = new Date();
  return `${prefix}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

console.log('开始创建演示数据...\n');

const users = [
  { id: 'user-admin-001', username: 'admin', name: '系统管理员', role: 'admin', phone: '13800000000', email: 'admin@example.com' },
  { id: 'user-super-001', username: 'supervisor', name: '张监理', role: 'supervisor', phone: '13800000001', email: 'zhangjl@example.com' },
  { id: 'user-super-002', username: 'supervisor2', name: '李监理', role: 'supervisor', phone: '13800000002', email: 'lijl@example.com' },
  { id: 'user-mgr-001', username: 'manager', name: '王管家', role: 'manager', phone: '13800000003', email: 'wanggj@example.com' },
  { id: 'user-mgr-002', username: 'manager2', name: '赵管家', role: 'manager', phone: '13800000004', email: 'zhaogj@example.com' },
  { id: 'user-svc-001', username: 'service', name: '陈客服', role: 'service', phone: '13800000005', email: 'chenkf@example.com' },
];

console.log('1. 创建用户账号...');
const insertUser = db.prepare(`
  INSERT INTO users (id, username, password, name, role, phone, email)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const user of users) {
  insertUser.run(user.id, user.username, hashPassword('123456'), user.name, user.role, user.phone, user.email);
  console.log(`   ✓ ${user.name} (${user.role}) - ${user.username}/123456`);
}

const projects = [
  {
    id: 'proj-001',
    project_no: generateNo('XM'),
    name: '翡翠花园3栋201',
    address: '上海市浦东新区翡翠路88号翡翠花园3栋201室',
    owner_name: '刘先生',
    owner_phone: '13900001001',
    supervisor_id: 'user-super-001',
    manager_id: 'user-mgr-001',
    status: 'ongoing',
    start_date: '2024-01-15',
    expected_end_date: '2024-03-20'
  },
  {
    id: 'proj-002',
    project_no: generateNo('XM'),
    name: '锦绣华府5栋1502',
    address: '上海市徐汇区锦绣路100号锦绣华府5栋1502室',
    owner_name: '周女士',
    owner_phone: '13900001002',
    supervisor_id: 'user-super-001',
    manager_id: 'user-mgr-001',
    status: 'ongoing',
    start_date: '2024-02-01',
    expected_end_date: '2024-04-10'
  },
  {
    id: 'proj-003',
    project_no: generateNo('XM'),
    name: '湖畔佳苑1栋803',
    address: '上海市青浦区湖景路50号湖畔佳苑1栋803室',
    owner_name: '吴先生',
    owner_phone: '13900001003',
    supervisor_id: 'user-super-002',
    manager_id: 'user-mgr-002',
    status: 'ongoing',
    start_date: '2024-01-20',
    expected_end_date: '2024-03-30'
  },
  {
    id: 'proj-004',
    project_no: generateNo('XM'),
    name: '阳光城2栋301',
    address: '上海市闵行区阳光路120号阳光城2栋301室',
    owner_name: '郑女士',
    owner_phone: '13900001004',
    supervisor_id: 'user-super-002',
    manager_id: 'user-mgr-002',
    status: 'completed',
    start_date: '2023-10-01',
    expected_end_date: '2023-12-20'
  }
];

console.log('\n2. 创建项目...');
const insertProject = db.prepare(`
  INSERT INTO projects (id, project_no, name, address, owner_name, owner_phone, supervisor_id, manager_id, status, start_date, expected_end_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const proj of projects) {
  insertProject.run(proj.id, proj.project_no, proj.name, proj.address, proj.owner_name, proj.owner_phone, proj.supervisor_id, proj.manager_id, proj.status, proj.start_date, proj.expected_end_date);
  console.log(`   ✓ ${proj.name} - ${proj.project_no}`);
}

const milestoneTemplates = [
  { name: '开工交底', days: 0 },
  { name: '水电验收', days: 15 },
  { name: '泥木验收', days: 30 },
  { name: '油漆验收', days: 45 },
  { name: '竣工验收', days: 60 }
];

console.log('\n3. 创建节点...');
const insertMilestone = db.prepare(`
  INSERT INTO milestones (id, project_id, name, planned_date, actual_date, status, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const proj of projects) {
  const baseDate = new Date(proj.start_date);
  for (let i = 0; i < milestoneTemplates.length; i++) {
    const tmpl = milestoneTemplates[i];
    const plannedDate = new Date(baseDate);
    plannedDate.setDate(plannedDate.getDate() + tmpl.days);
    
    let status = 'pending';
    let actualDate = null;
    
    if (proj.status === 'completed') {
      status = 'completed';
      actualDate = plannedDate.toISOString().split('T')[0];
    } else if (proj.project_no === projects[0].project_no) {
      if (i === 0) { status = 'completed'; actualDate = plannedDate.toISOString().split('T')[0]; }
      else if (i === 1) { status = 'completed'; actualDate = plannedDate.toISOString().split('T')[0]; }
      else if (i === 2) { status = 'in_progress'; }
    } else if (proj.project_no === projects[1].project_no) {
      if (i === 0) { status = 'completed'; actualDate = plannedDate.toISOString().split('T')[0]; }
      else if (i === 1) { status = 'delayed'; }
    }
    
    insertMilestone.run(
      uuidv4(), proj.id, tmpl.name,
      plannedDate.toISOString().split('T')[0],
      actualDate,
      status,
      proj.supervisor_id
    );
  }
}
console.log('   ✓ 已为每个项目创建标准施工节点');

const complaints = [
  {
    id: 'comp-001',
    complaint_no: generateNo('KS'),
    project_id: 'proj-001',
    title: '墙面瓷砖空鼓问题',
    description: '客厅墙面瓷砖铺贴后发现约5处空鼓，需要整改。主要集中在电视背景墙区域。',
    category: 'quality',
    priority: 'high',
    status: 'processing',
    reporter_id: 'user-super-001',
    handler_id: 'user-mgr-001',
    due_date: '2024-02-10'
  },
  {
    id: 'comp-002',
    complaint_no: generateNo('KS'),
    project_id: 'proj-001',
    title: '水电材料与合同不符',
    description: '业主反映现场使用的电线品牌与合同约定不符，合同约定是品牌A，现场是品牌B。',
    category: 'cost',
    priority: 'urgent',
    status: 'verified',
    reporter_id: 'user-svc-001',
    handler_id: 'user-mgr-001',
    due_date: '2024-02-08'
  },
  {
    id: 'comp-003',
    complaint_no: generateNo('KS'),
    project_id: 'proj-002',
    title: '工期延误问题',
    description: '原计划2月5日完成水电验收，目前已延误一周，希望能加快进度。',
    category: 'schedule',
    priority: 'normal',
    status: 'assigned',
    reporter_id: 'user-svc-001',
    handler_id: 'user-mgr-001',
    due_date: '2024-02-15'
  },
  {
    id: 'comp-004',
    complaint_no: generateNo('KS'),
    project_id: 'proj-003',
    title: '服务态度问题',
    description: '施工人员现场沟通态度不好，业主比较有意见，需要协调。',
    category: 'service',
    priority: 'normal',
    status: 'completed',
    reporter_id: 'user-svc-001',
    handler_id: 'user-mgr-002',
    due_date: '2024-02-05'
  },
  {
    id: 'comp-005',
    complaint_no: generateNo('KS'),
    project_id: 'proj-001',
    title: '地面找平厚度不够',
    description: '客厅地面找平厚度只有2cm，合同约定是3cm，可能影响后期地板铺设。',
    category: 'quality',
    priority: 'high',
    status: 'pending',
    reporter_id: 'user-super-001',
    handler_id: null,
    due_date: '2024-02-12'
  }
];

console.log('\n4. 创建客诉记录...');
const insertComplaint = db.prepare(`
  INSERT INTO complaints (id, complaint_no, project_id, title, description, category, priority, status, reporter_id, handler_id, due_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const comp of complaints) {
  insertComplaint.run(comp.id, comp.complaint_no, comp.project_id, comp.title, comp.description, comp.category, comp.priority, comp.status, comp.reporter_id, comp.handler_id, comp.due_date);
  console.log(`   ✓ ${comp.title} [${comp.priority}] - ${comp.status}`);
}

console.log('\n5. 创建客诉版本历史...');
const insertVersion = db.prepare(`
  INSERT INTO complaint_versions (complaint_id, version, field_name, old_value, new_value, changed_by, change_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertVersion.run('comp-001', 1, 'status', null, 'pending', 'user-super-001', '新建客诉');
insertVersion.run('comp-001', 2, 'handler_id', null, 'user-mgr-001', 'user-super-001', '分配给王管家处理');
insertVersion.run('comp-001', 3, 'status', 'pending', 'assigned', 'user-super-001', '分配处理人');
insertVersion.run('comp-001', 4, 'status', 'assigned', 'processing', 'user-mgr-001', '已安排施工队整改');
insertVersion.run('comp-002', 1, 'status', null, 'pending', 'user-svc-001', '新建客诉');
insertVersion.run('comp-002', 2, 'handler_id', null, 'user-mgr-001', 'user-super-001', '分配给王管家核实');
insertVersion.run('comp-002', 3, 'status', 'pending', 'assigned', 'user-super-001', '分配处理人');
insertVersion.run('comp-002', 4, 'priority', 'high', 'urgent', 'user-super-001', '升级优先级，材料问题必须马上解决');
insertVersion.run('comp-002', 5, 'status', 'assigned', 'processing', 'user-mgr-001', '正在与材料供应商沟通');
insertVersion.run('comp-002', 6, 'status', 'processing', 'verified', 'user-super-001', '已确认材料品牌错误，待协商解决方案');
console.log('   ✓ 已创建客诉状态流转历史');

console.log('\n6. 创建客诉评论跟进记录...');
const insertComment = db.prepare(`
  INSERT INTO complaint_comments (complaint_id, user_id, content, attachments)
  VALUES (?, ?, ?, ?)
`);

insertComment.run('comp-001', 'user-super-001', '今天巡检发现5处空鼓，已拍照留存，施工队明天过来整改。', JSON.stringify(['photo1.jpg', 'photo2.jpg']));
insertComment.run('comp-001', 'user-mgr-001', '已联系瓦工班组，明天上午9点到现场整改，预计1天完成。', null);
insertComment.run('comp-001', 'user-super-001', '整改完成后请通知我到场复验。', null);
insertComment.run('comp-002', 'user-svc-001', '业主今天上午来电投诉，情绪比较激动，希望尽快处理。', null);
insertComment.run('comp-002', 'user-mgr-001', '已核实情况，确实是材料部发错货了。正在协调换货，争取后天全部更换完成。', null);
insertComment.run('comp-002', 'user-super-001', '换货时我会到场监督，确保更换正确的品牌。同时需要向业主道歉并给出补偿方案。', null);
insertComment.run('comp-002', 'user-mgr-001', '已与业主沟通，同意更换材料+延长保修期6个月作为补偿。', null);
insertComment.run('comp-003', 'user-svc-001', '业主微信反映进度慢，担心影响入住时间。', null);
insertComment.run('comp-004', 'user-mgr-002', '已找施工队长谈话，要求现场人员注意沟通方式，已向业主道歉，业主表示接受。', null);
insertComment.run('comp-004', 'user-super-002', '后续我会多关注现场服务情况。', null);
console.log('   ✓ 已创建跟进评论记录');

console.log('\n7. 创建提醒...');
const insertReminder = db.prepare(`
  INSERT INTO reminders (id, milestone_id, complaint_id, type, title, content, remind_at, recipient_id, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

insertReminder.run(uuidv4(), null, 'comp-001', 'deadline', '客诉到期提醒：墙面瓷砖空鼓问题', '客诉将于2月10日到期，请跟进整改进度。', tomorrow.toISOString(), 'user-mgr-001', 'user-super-001');
insertReminder.run(uuidv4(), null, 'comp-002', 'deadline', '客诉到期提醒：水电材料与合同不符', '客诉将于2月8日到期，请抓紧协商。', tomorrow.toISOString(), 'user-mgr-001', 'user-super-001');
insertReminder.run(uuidv4(), null, 'comp-003', 'custom', '进度协调会提醒', '下午3点与业主召开进度协调会。', today.toISOString(), 'user-mgr-001', 'user-super-001');
console.log('   ✓ 已创建提醒');

console.log('\n8. 创建签认单...');
const insertConfirmation = db.prepare(`
  INSERT INTO confirmations (id, type, ref_id, title, content, status, version, confirmer_id, confirmed_at, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const conf1Id = uuidv4();
insertConfirmation.run(conf1Id, 'complaint', 'comp-004', '服务问题整改确认单', '1. 已对施工班组进行服务态度培训\n2. 已向业主当面道歉\n3. 业主表示接受', 'confirmed', 1, 'user-super-002', new Date().toISOString(), 'user-mgr-002');

const conf2Id = uuidv4();
insertConfirmation.run(conf2Id, 'complaint', 'comp-002', '水电材料更换方案确认', '1. 全部电线更换为合同约定品牌A\n2. 工期预计延误2天\n3. 补偿业主6个月保修期', 'pending', 1, null, null, 'user-mgr-001');

const conf3Id = uuidv4();
insertConfirmation.run(conf3Id, 'change', 'proj-001', '电视背景墙设计变更单', '原设计：石膏板造型\n变更为：大理石饰面\n增加费用：¥5,000', 'confirmed', 1, 'user-super-001', new Date().toISOString(), 'user-mgr-001');

console.log('   ✓ 已创建签认单（含版本追踪）');

console.log('\n9. 创建审计日志...');
const insertAudit = db.prepare(`
  INSERT INTO audit_logs (action, module, ref_id, user_id, old_value, new_value)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertAudit.run('create', 'complaint', 'comp-001', 'user-super-001', null, JSON.stringify({ title: '墙面瓷砖空鼓问题', priority: 'high' }));
insertAudit.run('assign', 'complaint', 'comp-001', 'user-super-001', JSON.stringify({ handler_id: null }), JSON.stringify({ handler_id: 'user-mgr-001' }));
insertAudit.run('status_change', 'complaint', 'comp-002', 'user-super-001', JSON.stringify({ priority: 'high' }), JSON.stringify({ priority: 'urgent', reason: '材料问题必须马上解决' }));
insertAudit.run('confirm', 'confirmation', conf1Id, 'user-super-002', JSON.stringify({ status: 'pending' }), JSON.stringify({ status: 'confirmed' }));
insertAudit.run('create', 'milestone', 'proj-001', 'user-super-001', null, JSON.stringify({ name: '泥木验收', date: '2024-02-14' }));
insertAudit.run('login', 'auth', 'user-mgr-001', 'user-mgr-001', null, JSON.stringify({ loginAt: new Date().toISOString() }));
insertAudit.run('login', 'auth', 'user-svc-001', 'user-svc-001', null, JSON.stringify({ loginAt: new Date().toISOString() }));
console.log('   ✓ 已创建审计日志');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('✅ 演示数据创建完成！');
console.log('');
console.log('📊 数据概览：');
console.log(`   用户账号: ${users.length} 个`);
console.log(`   项目: ${projects.length} 个`);
console.log(`   节点: ${projects.length * 5} 个`);
console.log(`   客诉: ${complaints.length} 条`);
console.log(`   版本历史: 10+ 条`);
console.log(`   跟进评论: 10 条`);
console.log(`   提醒: 3 条`);
console.log(`   签认单: 3 张`);
console.log('');
console.log('🔑 测试账号：');
console.log('   监理负责人: supervisor / 123456  (张监理)');
console.log('   项目管家:   manager / 123456     (王管家)');
console.log('   业主客服:   service / 123456     (陈客服)');
console.log('   管理员:     admin / 123456       (系统管理员)');
console.log('');
console.log('═══════════════════════════════════════════════════════════');

db.close();
