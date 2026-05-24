let currentUser = null;
let currentStudentId = null;
let selectedDocIds = new Set();

const roleLabels = {
  manager: '顾问主管',
  writer: '文案老师',
  visa: '签证助理'
};

const statusLabels = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已退回',
  submitted: '已提交',
  materials_missing: '材料缺失',
  deadline_missed: '已截止',
  active: '进行中',
  warning: '警告',
  refund_pending: '退款中',
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  draft: '草稿'
};

const docTypeLabels = {
  transcript: '成绩单',
  recommendation: '推荐信',
  personal_statement: '个人陈述',
  language: '语言成绩',
  resume: '简历',
  other: '其他'
};

async function init() {
  const cachedUser = await api.cache.get('currentUser');
  if (cachedUser) {
    currentUser = cachedUser;
    showMainScreen();
  }

  bindEvents();
}

function bindEvents() {
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const requiredRole = item.dataset.role;
      if (requiredRole && currentUser.role !== requiredRole) {
        alert('您没有权限访问此功能');
        return;
      }
      switchView(item.dataset.view);
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });
  });

  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => switchDetailTab(tab.dataset.tab));
  });

  document.getElementById('add-student-btn').addEventListener('click', showAddStudentForm);
  document.getElementById('add-program-btn').addEventListener('click', showAddProgramForm);
  document.getElementById('add-document-btn').addEventListener('click', showAddDocumentForm);
  document.getElementById('add-essay-btn').addEventListener('click', showAddEssayForm);
  document.getElementById('add-visa-btn').addEventListener('click', showAddVisaForm);

  document.getElementById('student-search').addEventListener('input', filterStudents);
  document.getElementById('doc-filter-status').addEventListener('change', filterDocuments);

  document.getElementById('batch-approve-btn').addEventListener('click', batchApproveDocs);
  document.getElementById('export-receipt-btn').addEventListener('click', exportReceipt);
  document.getElementById('form-submit').addEventListener('click', handleFormSubmit);
}

async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('请输入用户名和密码');
    return;
  }

  const result = await api.db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]
  );

  if (result.success && result.data) {
    currentUser = result.data;
    await api.cache.save('currentUser', currentUser);
    showMainScreen();
  } else {
    alert('用户名或密码错误');
  }
}

async function handleLogout() {
  currentUser = null;
  await api.cache.save('currentUser', null);
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';

  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.style.display = 'block';
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');

  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById('view-dashboard').classList.add('active');
}

function showMainScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');

  document.getElementById('user-role').textContent = roleLabels[currentUser.role];
  document.getElementById('user-name').textContent = currentUser.name;

  updateNavigationByRole();
  updateDashboardByRole();

  const defaultView = getDefaultViewByRole(currentUser.role);
  switchView(defaultView);
}

function getDefaultViewByRole(role) {
  switch (role) {
    case 'writer':
      return 'documents';
    case 'visa':
      return 'visa';
    case 'manager':
    default:
      return 'dashboard';
  }
}

function updateNavigationByRole() {
  document.querySelectorAll('.nav-item').forEach(item => {
    const requiredRole = item.dataset.role;
    const viewName = item.dataset.view;

    if (currentUser.role === 'manager') {
      item.style.display = 'flex';
    } else if (currentUser.role === 'writer') {
      const allowedViews = ['dashboard', 'students', 'documents', 'essays'];
      item.style.display = allowedViews.includes(viewName) ? 'flex' : 'none';
    } else if (currentUser.role === 'visa') {
      const allowedViews = ['dashboard', 'students', 'visa'];
      item.style.display = allowedViews.includes(viewName) ? 'flex' : 'none';
    }
  });
}

function updateDashboardByRole() {
  const statCards = document.querySelectorAll('.stat-card');
  const sections = document.querySelectorAll('.dashboard-section');

  if (currentUser.role === 'manager') {
    statCards.forEach(card => card.style.display = 'block');
    sections.forEach(section => section.style.display = 'block');
    updateManagerDashboard();
  } else if (currentUser.role === 'writer') {
    updateWriterDashboard();
  } else if (currentUser.role === 'visa') {
    updateVisaDashboard();
  }
}

function updateManagerDashboard() {
  const statTitles = document.querySelectorAll('.stat-title');
  const statValues = document.querySelectorAll('.stat-value');
  if (statTitles[0]) statTitles[0].textContent = '总学生数';
  if (statTitles[1]) statTitles[1].textContent = '待处理材料';
  if (statTitles[2]) statTitles[2].textContent = '7天内截止';
  if (statTitles[3]) statTitles[3].textContent = '异常状态';

  const sectionTitles = document.querySelectorAll('.dashboard-section h3');
  if (sectionTitles[0]) sectionTitles[0].textContent = '截止日提醒';
  if (sectionTitles[1]) sectionTitles[1].textContent = '待审核材料';
  if (sectionTitles[2]) sectionTitles[2].textContent = '异常提醒';

  const statsGrid = document.querySelector('.stats-grid');
  statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
}

function updateWriterDashboard() {
  const statTitles = document.querySelectorAll('.stat-title');
  const statValues = document.querySelectorAll('.stat-value');
  if (statTitles[0]) statTitles[0].textContent = '待审核材料';
  if (statTitles[1]) statTitles[1].textContent = '进行中文书';
  if (statTitles[2]) statTitles[2].textContent = '文书7天截止';
  if (statTitles[3]) statTitles[3].textContent = '被退回材料';

  const sectionTitles = document.querySelectorAll('.dashboard-section h3');
  if (sectionTitles[0]) sectionTitles[0].textContent = '待审核材料清单';
  if (sectionTitles[1]) sectionTitles[1].textContent = '进行中文书进度';
  if (sectionTitles[2]) sectionTitles[2].style.display = 'none';

  const statsGrid = document.querySelector('.stats-grid');
  statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
}

function updateVisaDashboard() {
  const statTitles = document.querySelectorAll('.stat-title');
  const statValues = document.querySelectorAll('.stat-value');
  if (statTitles[0]) statTitles[0].textContent = '待处理签证';
  if (statTitles[1]) statTitles[1].textContent = '本周预约';
  if (statTitles[2]) statTitles[2].textContent = '待面试';
  if (statTitles[3]) statTitles[3].textContent = '7天内结果';

  const sectionTitles = document.querySelectorAll('.dashboard-section h3');
  if (sectionTitles[0]) sectionTitles[0].textContent = '签证待办清单';
  if (sectionTitles[1]) sectionTitles[1].style.display = 'none';
  if (sectionTitles[2]) sectionTitles[2].style.display = 'none';

  const statsGrid = document.querySelector('.stats-grid');
  statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
}

function switchView(viewName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  switch (viewName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'students':
      loadStudents();
      break;
    case 'documents':
      loadDocuments();
      break;
    case 'essays':
      loadEssays();
      break;
    case 'visa':
      loadVisa();
      break;
    case 'refunds':
      loadRefunds();
      break;
    case 'logs':
      loadLogs();
      break;
  }
}

async function loadDashboard() {
  const statValues = document.querySelectorAll('.stat-value');

  if (currentUser.role === 'manager') {
    await loadManagerDashboardStats(statValues);
    loadDeadlineList();
    loadPendingDocsList();
    loadAlertsList();
  } else if (currentUser.role === 'writer') {
    await loadWriterDashboardStats(statValues);
    loadWriterDocsList();
    loadWriterEssaysList();
  } else if (currentUser.role === 'visa') {
    await loadVisaDashboardStats(statValues);
    loadVisaTodoList();
  }
}

async function loadManagerDashboardStats(statValues) {
  const [studentsResult, pendingDocsResult, deadlinesResult, warningsResult] = await Promise.all([
    api.db.query('SELECT COUNT(*) as count FROM students'),
    api.db.query("SELECT COUNT(*) as count FROM documents WHERE status = 'pending' AND is_latest = 1"),
    api.db.query(`
      SELECT COUNT(*) as count FROM school_programs 
      WHERE deadline >= date('now') 
      AND deadline <= date('now', '+7 days')
    `),
    api.db.query("SELECT COUNT(*) as count FROM students WHERE status IN ('warning', 'refund_pending')")
  ]);

  if (statValues[0] && studentsResult.success) statValues[0].textContent = studentsResult.data[0].count;
  if (statValues[1] && pendingDocsResult.success) statValues[1].textContent = pendingDocsResult.data[0].count;
  if (statValues[2] && deadlinesResult.success) statValues[2].textContent = deadlinesResult.data[0].count;
  if (statValues[3] && warningsResult.success) statValues[3].textContent = warningsResult.data[0].count;
}

async function loadWriterDashboardStats(statValues) {
  const [pendingDocsResult, activeEssaysResult, essayDeadlinesResult, rejectedDocsResult] = await Promise.all([
    api.db.query("SELECT COUNT(*) as count FROM documents WHERE status = 'pending' AND is_latest = 1"),
    api.db.query("SELECT COUNT(*) as count FROM essays WHERE status IN ('draft', 'reviewing')"),
    api.db.query(`
      SELECT COUNT(*) as count FROM essays 
      WHERE deadline >= date('now') 
      AND deadline <= date('now', '+7 days')
    `),
    api.db.query("SELECT COUNT(*) as count FROM documents WHERE status = 'rejected' AND is_latest = 1")
  ]);

  if (statValues[0] && pendingDocsResult.success) statValues[0].textContent = pendingDocsResult.data[0].count;
  if (statValues[1] && activeEssaysResult.success) statValues[1].textContent = activeEssaysResult.data[0].count;
  if (statValues[2] && essayDeadlinesResult.success) statValues[2].textContent = essayDeadlinesResult.data[0].count;
  if (statValues[3] && rejectedDocsResult.success) statValues[3].textContent = rejectedDocsResult.data[0].count;
}

async function loadVisaDashboardStats(statValues) {
  const [pendingVisaResult, weekAppointmentsResult, pendingInterviewResult, weekResultResult] = await Promise.all([
    api.db.query("SELECT COUNT(*) as count FROM visa_process WHERE status IN ('not_started', 'in_progress')"),
    api.db.query(`
      SELECT COUNT(*) as count FROM visa_process 
      WHERE appointment_date >= date('now') 
      AND appointment_date <= date('now', '+7 days')
    `),
    api.db.query("SELECT COUNT(*) as count FROM visa_process WHERE status = 'interview_scheduled'"),
    api.db.query(`
      SELECT COUNT(*) as count FROM visa_process 
      WHERE result_date >= date('now') 
      AND result_date <= date('now', '+7 days')
    `)
  ]);

  if (statValues[0] && pendingVisaResult.success) statValues[0].textContent = pendingVisaResult.data[0].count;
  if (statValues[1] && weekAppointmentsResult.success) statValues[1].textContent = weekAppointmentsResult.data[0].count;
  if (statValues[2] && pendingInterviewResult.success) statValues[2].textContent = pendingInterviewResult.data[0].count;
  if (statValues[3] && weekResultResult.success) statValues[3].textContent = weekResultResult.data[0].count;
}

async function loadWriterDocsList() {
  const container = document.getElementById('deadline-list');
  const result = await api.db.query(`
    SELECT d.*, s.name as student_name 
    FROM documents d 
    JOIN students s ON d.student_id = s.id
    WHERE d.status = 'pending' AND d.is_latest = 1
    ORDER BY d.created_at DESC
    LIMIT 5
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无待审核材料</div>';
    return;
  }

  container.innerHTML = result.data.map(item => `
    <div class="list-item info">
      <div>
        <strong>${item.student_name}</strong> - ${docTypeLabels[item.doc_type] || item.doc_type}
      </div>
      <div style="color: #666;">
        v${item.version}
      </div>
    </div>
  `).join('');
}

async function loadWriterEssaysList() {
  const container = document.getElementById('pending-docs-list');
  const result = await api.db.query(`
    SELECT e.*, s.name as student_name 
    FROM essays e 
    JOIN students s ON e.student_id = s.id
    WHERE e.status IN ('draft', 'reviewing')
    ORDER BY e.created_at DESC
    LIMIT 5
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无进行中文书</div>';
    return;
  }

  container.innerHTML = result.data.map(item => `
    <div class="list-item info">
      <div>
        <strong>${item.student_name}</strong> - ${item.essay_title}
      </div>
      <div>
        <span class="status-badge status-${item.status}">${statusLabels[item.status] || item.status}</span>
      </div>
    </div>
  `).join('');
}

async function loadVisaTodoList() {
  const container = document.getElementById('deadline-list');
  const result = await api.db.query(`
    SELECT v.*, s.name as student_name 
    FROM visa_process v 
    JOIN students s ON v.student_id = s.id
    WHERE v.status IN ('not_started', 'in_progress', 'interview_scheduled')
    ORDER BY v.created_at DESC
    LIMIT 10
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无签证待办</div>';
    return;
  }

  const today = new Date();
  container.innerHTML = result.data.map(item => {
    const hasAppointment = item.appointment_date && new Date(item.appointment_date) >= today;
    return `
      <div class="list-item ${hasAppointment ? 'warning' : 'info'}">
        <div>
          <strong>${item.student_name}</strong> - ${item.visa_type}
          ${item.appointment_date ? `<br><small>预约: ${item.appointment_date}</small>` : ''}
        </div>
        <div>
          <span class="status-badge status-${item.status === 'not_started' ? 'pending' : item.status}">${statusLabels[item.status] || item.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function loadDeadlineList() {
  const container = document.getElementById('deadline-list');
  const result = await api.db.query(`
    SELECT sp.*, s.name as student_name 
    FROM school_programs sp 
    JOIN students s ON sp.student_id = s.id
    WHERE sp.deadline >= date('now') 
    AND sp.deadline <= date('now', '+14 days')
    ORDER BY sp.deadline ASC
    LIMIT 5
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无即将截止的申请</div>';
    return;
  }

  const today = new Date();
  container.innerHTML = result.data.map(item => {
    const deadlineDate = new Date(item.deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    const isUrgent = daysLeft <= 3;
    return `
      <div class="list-item ${isUrgent ? 'danger' : 'warning'}">
        <div>
          <strong>${item.student_name}</strong> - ${item.school_name} ${item.program_name}
        </div>
        <div style="font-weight: 600; ${isUrgent ? 'color: #d32f2f;' : ''}">
          ${item.deadline} (${daysLeft}天后)
        </div>
      </div>
    `;
  }).join('');
}

async function loadPendingDocsList() {
  const container = document.getElementById('pending-docs-list');
  const result = await api.db.query(`
    SELECT d.*, s.name as student_name 
    FROM documents d 
    JOIN students s ON d.student_id = s.id
    WHERE d.status = 'pending' AND d.is_latest = 1
    ORDER BY d.created_at DESC
    LIMIT 5
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无待审核材料</div>';
    return;
  }

  container.innerHTML = result.data.map(item => `
    <div class="list-item info">
      <div>
        <strong>${item.student_name}</strong> - ${docTypeLabels[item.doc_type] || item.doc_type}
      </div>
      <div style="color: #666;">
        v${item.version}
      </div>
    </div>
  `).join('');
}

async function loadAlertsList() {
  const container = document.getElementById('alert-list');
  const html = [];

  const missedResult = await api.db.query(`
    SELECT sp.*, s.name as student_name 
    FROM school_programs sp 
    JOIN students s ON sp.student_id = s.id
    WHERE sp.application_status = 'deadline_missed'
    LIMIT 3
  `);
  if (missedResult.success && missedResult.data.length > 0) {
    missedResult.data.forEach(item => {
      html.push(`
        <div class="list-item danger">
          <div><strong>⚠️ 已错过截止日</strong> - ${item.student_name}: ${item.school_name}</div>
        </div>
      `);
    });
  }

  const refundResult = await api.db.query(`
    SELECT r.*, s.name as student_name 
    FROM refund_requests r 
    JOIN students s ON r.student_id = s.id
    WHERE r.status = 'pending'
    LIMIT 3
  `);
  if (refundResult.success && refundResult.data.length > 0) {
    refundResult.data.forEach(item => {
      html.push(`
        <div class="list-item warning">
          <div><strong>💰 退款申请待处理</strong> - ${item.student_name}: ¥${item.amount}</div>
        </div>
      `);
    });
  }

  const rejectedResult = await api.db.query(`
    SELECT d.*, s.name as student_name 
    FROM documents d 
    JOIN students s ON d.student_id = s.id
    WHERE d.status = 'rejected' AND d.is_latest = 1
    LIMIT 3
  `);
  if (rejectedResult.success && rejectedResult.data.length > 0) {
    rejectedResult.data.forEach(item => {
      html.push(`
        <div class="list-item danger">
          <div><strong>❌ 材料被退回</strong> - ${item.student_name}: ${docTypeLabels[item.doc_type]}</div>
        </div>
      `);
    });
  }

  container.innerHTML = html.length > 0 ? html.join('') : '<div class="empty-state">暂无异常提醒</div>';
}

async function loadStudents() {
  const container = document.getElementById('students-list');
  const result = await api.db.query('SELECT * FROM students ORDER BY created_at DESC');

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div>暂无学生数据</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;">
      <div>学生姓名</div>
      <div>目标国家</div>
      <div>目标专业</div>
      <div>GPA</div>
      <div>状态</div>
      <div>创建时间</div>
    </div>
    ${result.data.map(student => `
      <div class="table-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;" 
           onclick="showStudentDetail(${student.id})">
        <div><strong>${student.name}</strong></div>
        <div>${student.target_country || '-'}</div>
        <div>${student.target_major || '-'}</div>
        <div>${student.gpa || '-'}</div>
        <div><span class="status-badge status-${student.status}">${statusLabels[student.status] || student.status}</span></div>
        <div style="color: #666; font-size: 12px;">${student.created_at?.slice(0, 10) || '-'}</div>
      </div>
    `).join('')}
  `;

  window.studentsData = result.data;
}

async function filterStudents() {
  const keyword = document.getElementById('student-search').value.toLowerCase();
  const container = document.getElementById('students-list');
  
  if (!window.studentsData) return;

  const filtered = window.studentsData.filter(s => 
    s.name.toLowerCase().includes(keyword) ||
    (s.target_country && s.target_country.toLowerCase().includes(keyword)) ||
    (s.target_major && s.target_major.toLowerCase().includes(keyword))
  );

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;">
      <div>学生姓名</div>
      <div>目标国家</div>
      <div>目标专业</div>
      <div>GPA</div>
      <div>状态</div>
      <div>创建时间</div>
    </div>
    ${filtered.map(student => `
      <div class="table-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;" 
           onclick="showStudentDetail(${student.id})">
        <div><strong>${student.name}</strong></div>
        <div>${student.target_country || '-'}</div>
        <div>${student.target_major || '-'}</div>
        <div>${student.gpa || '-'}</div>
        <div><span class="status-badge status-${student.status}">${statusLabels[student.status] || student.status}</span></div>
        <div style="color: #666; font-size: 12px;">${student.created_at?.slice(0, 10) || '-'}</div>
      </div>
    `).join('')}
  `;
}

async function showStudentDetail(studentId) {
  currentStudentId = studentId;
  const result = await api.db.get('SELECT * FROM students WHERE id = ?', [studentId]);
  if (!result.success || !result.data) return;

  const student = result.data;
  document.getElementById('detail-student-name').textContent = student.name + ' - 详情';
  document.getElementById('detail-name').value = student.name;
  document.getElementById('detail-phone').value = student.phone || '-';
  document.getElementById('detail-email').value = student.email || '-';
  document.getElementById('detail-country').value = student.target_country || '-';
  document.getElementById('detail-major').value = student.target_major || '-';
  document.getElementById('detail-gpa').value = student.gpa || '-';
  document.getElementById('detail-consultant').value = student.consultant || '-';
  document.getElementById('detail-status').value = statusLabels[student.status] || student.status;

  const refundBtn = document.getElementById('add-refund-btn');
  if (refundBtn) {
    refundBtn.style.display = currentUser.role === 'manager' ? 'inline-block' : 'none';
    refundBtn.onclick = showAddRefundForm;
  }

  switchDetailTab('info');
  loadStudentPrograms(studentId);
  loadStudentDocuments(studentId);
  loadStudentRefunds(studentId);
  loadStudentTimeline(studentId);

  document.getElementById('student-detail-modal').classList.remove('hidden');
}

async function loadStudentRefunds(studentId) {
  const container = document.getElementById('detail-refunds');
  const result = await api.db.query('SELECT * FROM refund_requests WHERE student_id = ? ORDER BY created_at DESC', [studentId]);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无退款记录</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 1fr 1fr 2fr 1fr 1fr 1fr;">
      <div>金额</div>
      <div>申请人</div>
      <div>原因</div>
      <div>审批人</div>
      <div>状态</div>
      <div>申请时间</div>
    </div>
    ${result.data.map(refund => `
      <div class="table-row" style="grid-template-columns: 1fr 1fr 2fr 1fr 1fr 1fr;">
        <div><strong style="color: #e91e63;">¥${refund.amount}</strong></div>
        <div>${refund.requested_by || '-'}</div>
        <div style="font-size: 12px;">${refund.reason || '-'}</div>
        <div>${refund.approved_by || '-'}</div>
        <div><span class="status-badge status-${refund.status === 'pending' ? 'pending' : refund.status}">${statusLabels[refund.status] || refund.status}</span></div>
        <div style="font-size: 12px; color: #666;">${refund.created_at?.slice(0, 10) || '-'}</div>
      </div>
    `).join('')}
  `;
}

function showAddRefundForm() {
  document.getElementById('form-title').textContent = '申请退款';
  document.getElementById('form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>退款金额 *</label>
        <input type="number" id="form-refund-amount" required placeholder="请输入金额">
      </div>
      <div class="form-group">
        <label>申请人</label>
        <input type="text" id="form-refund-requester" value="${currentUser.name}" readonly>
      </div>
      <div class="form-group" style="grid-column: span 2;">
        <label>退款原因</label>
        <textarea id="form-refund-reason" rows="4" placeholder="请详细说明退款原因..."></textarea>
      </div>
    </div>
  `;
  window.currentFormType = 'refund';
  document.getElementById('form-modal').classList.remove('hidden');
}

function switchDetailTab(tabName) {
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

async function loadStudentPrograms(studentId) {
  const container = document.getElementById('detail-programs');
  const result = await api.db.query('SELECT * FROM school_programs WHERE student_id = ? ORDER BY created_at DESC', [studentId]);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无选校方案</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 2fr 2fr 1fr 1fr 1fr;">
      <div>学校名称</div>
      <div>专业</div>
      <div>截止日期</div>
      <div>优先级</div>
      <div>状态</div>
    </div>
    ${result.data.map(program => `
      <div class="table-row" style="grid-template-columns: 2fr 2fr 1fr 1fr 1fr;">
        <div><strong>${program.school_name}</strong></div>
        <div>${program.program_name}</div>
        <div style="color: ${new Date(program.deadline) < new Date() ? '#d32f2f' : ''}">${program.deadline || '-'}</div>
        <div>${program.priority === 1 ? '冲刺' : program.priority === 2 ? '主申' : '保底'}</div>
        <div><span class="status-badge status-${program.application_status}">${statusLabels[program.application_status] || program.application_status}</span></div>
      </div>
    `).join('')}
  `;
}

async function loadStudentDocuments(studentId) {
  const container = document.getElementById('detail-documents');
  const result = await api.db.query('SELECT * FROM documents WHERE student_id = ? AND is_latest = 1 ORDER BY created_at DESC', [studentId]);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无材料</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 2fr 1fr 1fr 2fr 1fr;">
      <div>材料名称</div>
      <div>类型</div>
      <div>版本</div>
      <div>审核意见</div>
      <div>状态</div>
    </div>
    ${result.data.map(doc => `
      <div class="table-row" style="grid-template-columns: 2fr 1fr 1fr 2fr 1fr;">
        <div><strong>${doc.doc_name}</strong></div>
        <div>${docTypeLabels[doc.doc_type] || doc.doc_type}</div>
        <div>v${doc.version}</div>
        <div style="font-size: 12px; color: #666;">${doc.review_notes || '-'}</div>
        <div>
          <span class="status-badge status-${doc.status}">${statusLabels[doc.status] || doc.status}</span>
          ${doc.status === 'rejected' ? `<button class="btn btn-small btn-info" onclick="createNewDocVersion(${doc.id}, event)">新建版本</button>` : ''}
        </div>
      </div>
    `).join('')}
  `;
}

async function createNewDocVersion(docId, event) {
  event.stopPropagation();
  const reviewNotes = prompt('请输入修改意见：');
  if (reviewNotes === null) return;

  const result = await api.document.newVersion(docId, reviewNotes);
  if (result.success) {
    logOperation(currentStudentId, 'new_version', 'document', `材料v${docId}创建新版本`);
    loadStudentDocuments(currentStudentId);
    alert('新版本已创建');
  } else {
    alert('创建失败: ' + result.error);
  }
}

async function loadStudentTimeline(studentId) {
  const container = document.getElementById('detail-timeline');
  const result = await api.student.timeline(studentId);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无时间线记录</div>';
    return;
  }

  container.innerHTML = result.data.map(item => `
    <div class="timeline-item ${item.type}">
      <div class="timeline-title">${item.title}</div>
      <div class="timeline-date">${item.date}</div>
      <div class="timeline-content">
        ${item.type === 'program' ? `状态: ${statusLabels[item.data.application_status] || item.data.application_status}${item.data.notes ? ` | 备注: ${item.data.notes}` : ''}` : ''}
        ${item.type === 'document' ? `版本: v${item.data.version} | 状态: ${statusLabels[item.data.status] || item.data.status}${item.data.review_notes ? ` | 审核意见: ${item.data.review_notes}` : ''}` : ''}
        ${item.type === 'essay' ? `版本: v${item.data.version} | 状态: ${statusLabels[item.data.status] || item.data.status}` : ''}
        ${item.type === 'visa' ? `状态: ${statusLabels[item.data.status] || item.data.status}${item.data.notes ? ` | 备注: ${item.data.notes}` : ''}` : ''}
        ${item.type === 'refund' ? `金额: ¥${item.data.amount} | 状态: ${statusLabels[item.data.status] || item.data.status}${item.data.reason ? ` | 原因: ${item.data.reason}` : ''} | 申请人: ${item.data.requested_by || '-'}` : ''}
        ${item.type === 'log' ? `操作人: ${item.data.operator} | ${item.data.details || ''}` : ''}
      </div>
    </div>
  `).join('');
}

async function loadDocuments() {
  selectedDocIds.clear();
  const container = document.getElementById('documents-list');
  const result = await api.db.query(`
    SELECT d.*, s.name as student_name 
    FROM documents d 
    JOIN students s ON d.student_id = s.id
    WHERE d.is_latest = 1
    ORDER BY d.created_at DESC
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div>暂无材料数据</div>';
    return;
  }

  window.documentsData = result.data;
  renderDocuments(result.data);
}

function renderDocuments(data) {
  const container = document.getElementById('documents-list');
  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 40px 2fr 1.5fr 1fr 1fr 2fr 1fr;">
      <div class="checkbox-cell"><input type="checkbox" id="select-all-docs" onchange="toggleSelectAll(this)"></div>
      <div>材料名称</div>
      <div>学生</div>
      <div>类型</div>
      <div>版本</div>
      <div>审核意见</div>
      <div>操作</div>
    </div>
    ${data.map(doc => `
      <div class="table-row" style="grid-template-columns: 40px 2fr 1.5fr 1fr 1fr 2fr 1fr;">
        <div class="checkbox-cell">
          <input type="checkbox" class="doc-checkbox" data-id="${doc.id}" 
                 ${selectedDocIds.has(doc.id) ? 'checked' : ''}
                 onchange="toggleDocSelect(${doc.id}, this.checked)">
        </div>
        <div><strong>${doc.doc_name}</strong></div>
        <div>${doc.student_name}</div>
        <div>${docTypeLabels[doc.doc_type] || doc.doc_type}</div>
        <div>v${doc.version}</div>
        <div style="font-size: 12px; color: #666;">${doc.review_notes || '-'}</div>
        <div class="row-actions">
          <button class="btn btn-small btn-success" onclick="approveDocument(${doc.id})">通过</button>
          <button class="btn btn-small btn-danger" onclick="rejectDocument(${doc.id})">退回</button>
        </div>
      </div>
    `).join('')}
  `;
}

function toggleSelectAll(checkbox) {
  const checkboxes = document.querySelectorAll('.doc-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    const id = parseInt(cb.dataset.id);
    if (checkbox.checked) {
      selectedDocIds.add(id);
    } else {
      selectedDocIds.delete(id);
    }
  });
}

function toggleDocSelect(docId, checked) {
  if (checked) {
    selectedDocIds.add(docId);
  } else {
    selectedDocIds.delete(docId);
  }
}

async function filterDocuments() {
  const status = document.getElementById('doc-filter-status').value;
  if (!window.documentsData) return;

  const filtered = status ? window.documentsData.filter(d => d.status === status) : window.documentsData;
  renderDocuments(filtered);
}

async function approveDocument(docId) {
  const result = await api.db.query(
    "UPDATE documents SET status = 'approved', reviewed_by = ? WHERE id = ?",
    [currentUser.name, docId]
  );
  if (result.success) {
    logOperation(null, 'approve', 'document', `通过材料ID: ${docId}`);
    loadDocuments();
  }
}

async function rejectDocument(docId) {
  const reason = prompt('请输入退回原因：');
  if (reason === null) return;

  const result = await api.db.query(
    "UPDATE documents SET status = 'rejected', review_notes = ?, reviewed_by = ? WHERE id = ?",
    [reason, currentUser.name, docId]
  );
  if (result.success) {
    logOperation(null, 'reject', 'document', `退回材料ID: ${docId}`);
    loadDocuments();
  }
}

async function batchApproveDocs() {
  if (selectedDocIds.size === 0) {
    alert('请先选择要通过的材料');
    return;
  }

  const confirm = await api.dialog.showMessageBox({
    type: 'question',
    buttons: ['取消', '确认'],
    title: '批量通过',
    message: `确定要通过选中的 ${selectedDocIds.size} 份材料吗？`
  });

  if (confirm.response !== 1) return;

  for (const docId of selectedDocIds) {
    await api.db.query(
      "UPDATE documents SET status = 'approved', reviewed_by = ? WHERE id = ?",
      [currentUser.name, docId]
    );
  }

  logOperation(null, 'batch_approve', 'document', `批量通过 ${selectedDocIds.size} 份材料`);
  selectedDocIds.clear();
  loadDocuments();
}

async function loadEssays() {
  const container = document.getElementById('essays-list');
  const result = await api.db.query(`
    SELECT e.*, s.name as student_name 
    FROM essays e 
    JOIN students s ON e.student_id = s.id
    ORDER BY e.created_at DESC
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✍️</div>暂无文书数据</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1.5fr;">
      <div>文书标题</div>
      <div>学生</div>
      <div>版本</div>
      <div>状态</div>
      <div>截止日期</div>
      <div>负责人</div>
    </div>
    ${result.data.map(essay => `
      <div class="table-row" style="grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1.5fr;">
        <div><strong>${essay.essay_title}</strong></div>
        <div>${essay.student_name}</div>
        <div>v${essay.version}</div>
        <div><span class="status-badge status-${essay.status}">${statusLabels[essay.status] || essay.status}</span></div>
        <div>${essay.deadline || '-'}</div>
        <div>${essay.assigned_to || '-'}</div>
      </div>
    `).join('')}
  `;
}

async function loadVisa() {
  const container = document.getElementById('visa-list');
  const result = await api.db.query(`
    SELECT v.*, s.name as student_name 
    FROM visa_process v 
    JOIN students s ON v.student_id = s.id
    ORDER BY v.created_at DESC
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛂</div>暂无签证记录</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1.5fr;">
      <div>学生</div>
      <div>签证类型</div>
      <div>预约日期</div>
      <div>面试日期</div>
      <div>状态</div>
      <div>备注</div>
    </div>
    ${result.data.map(visa => `
      <div class="table-row" style="grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1.5fr;">
        <div><strong>${visa.student_name}</strong></div>
        <div>${visa.visa_type}</div>
        <div>${visa.appointment_date || '-'}</div>
        <div>${visa.interview_date || '-'}</div>
        <div><span class="status-badge status-${visa.status === 'not_started' ? 'pending' : visa.status}">${statusLabels[visa.status] || visa.status}</span></div>
        <div style="font-size: 12px; color: #666;">${visa.notes || '-'}</div>
      </div>
    `).join('')}
  `;
}

async function loadRefunds() {
  const container = document.getElementById('refunds-list');
  const result = await api.db.query(`
    SELECT r.*, s.name as student_name 
    FROM refund_requests r 
    JOIN students s ON r.student_id = s.id
    ORDER BY r.created_at DESC
  `);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div>暂无退款申请</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 1.5fr 1fr 2fr 1fr 1fr 1.5fr;">
      <div>学生</div>
      <div>金额</div>
      <div>原因</div>
      <div>申请人</div>
      <div>状态</div>
      <div>操作</div>
    </div>
    ${result.data.map(refund => `
      <div class="table-row" style="grid-template-columns: 1.5fr 1fr 2fr 1fr 1fr 1.5fr;">
        <div><strong>${refund.student_name}</strong></div>
        <div>¥${refund.amount}</div>
        <div style="font-size: 12px;">${refund.reason || '-'}</div>
        <div>${refund.requested_by || '-'}</div>
        <div><span class="status-badge status-${refund.status === 'pending' ? 'pending' : refund.status}">${statusLabels[refund.status] || refund.status}</span></div>
        <div class="row-actions">
          ${refund.status === 'pending' ? `
            <button class="btn btn-small btn-success" onclick="approveRefund(${refund.id})">批准</button>
            <button class="btn btn-small btn-danger" onclick="rejectRefund(${refund.id})">拒绝</button>
          ` : '-'}
        </div>
      </div>
    `).join('')}
  `;
}

async function approveRefund(refundId) {
  const result = await api.db.query(
    "UPDATE refund_requests SET status = 'approved', approved_by = ? WHERE id = ?",
    [currentUser.name, refundId]
  );
  if (result.success) {
    logOperation(null, 'approve', 'refund', `批准退款ID: ${refundId}`);
    loadRefunds();
  }
}

async function rejectRefund(refundId) {
  const reason = prompt('请输入拒绝原因：');
  if (reason === null) return;

  const result = await api.db.query(
    "UPDATE refund_requests SET status = 'rejected', approved_by = ? WHERE id = ?",
    [currentUser.name, refundId]
  );
  if (result.success) {
    logOperation(null, 'reject', 'refund', `拒绝退款ID: ${refundId}`);
    loadRefunds();
  }
}

async function loadLogs() {
  const container = document.getElementById('logs-list');
  const result = await api.db.query('SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT 100');

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>暂无操作日志</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-header" style="grid-template-columns: 1.5fr 1fr 1fr 2fr 1.5fr;">
      <div>操作时间</div>
      <div>操作人</div>
      <div>模块</div>
      <div>详情</div>
      <div>IP地址</div>
    </div>
    ${result.data.map(log => `
      <div class="table-row" style="grid-template-columns: 1.5fr 1fr 1fr 2fr 1.5fr;">
        <div style="font-size: 12px;">${log.created_at}</div>
        <div>${log.operator}</div>
        <div>${log.module}</div>
        <div style="font-size: 12px;">${log.details || '-'}</div>
        <div style="font-size: 12px; color: #666;">${log.ip_address || '-'}</div>
      </div>
    `).join('')}
  `;
}

async function logOperation(studentId, action, module, details) {
  await api.db.query(
    'INSERT INTO operation_logs (student_id, operator, action, module, details) VALUES (?, ?, ?, ?, ?)',
    [studentId, currentUser?.name || 'system', action, module, details]
  );
}

function showAddStudentForm() {
  document.getElementById('form-title').textContent = '新增学生';
  document.getElementById('form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>姓名 *</label>
        <input type="text" id="form-name" required>
      </div>
      <div class="form-group">
        <label>电话</label>
        <input type="text" id="form-phone">
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input type="email" id="form-email">
      </div>
      <div class="form-group">
        <label>目标国家</label>
        <input type="text" id="form-country">
      </div>
      <div class="form-group">
        <label>目标专业</label>
        <input type="text" id="form-major">
      </div>
      <div class="form-group">
        <label>GPA</label>
        <input type="number" step="0.01" id="form-gpa">
      </div>
      <div class="form-group">
        <label>顾问 *</label>
        <input type="text" id="form-consultant" value="${currentUser.name}" required>
      </div>
    </div>
  `;
  window.currentFormType = 'student';
  document.getElementById('form-modal').classList.remove('hidden');
}

function showAddProgramForm() {
  document.getElementById('form-title').textContent = '添加选校方案';
  document.getElementById('form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>学校名称 *</label>
        <input type="text" id="form-school" required>
      </div>
      <div class="form-group">
        <label>专业 *</label>
        <input type="text" id="form-program" required>
      </div>
      <div class="form-group">
        <label>截止日期</label>
        <input type="date" id="form-deadline">
      </div>
      <div class="form-group">
        <label>优先级</label>
        <select id="form-priority">
          <option value="1">冲刺</option>
          <option value="2" selected>主申</option>
          <option value="3">保底</option>
        </select>
      </div>
      <div class="form-group" style="grid-column: span 2;">
        <label>备注</label>
        <textarea id="form-notes" rows="3"></textarea>
      </div>
    </div>
  `;
  window.currentFormType = 'program';
  document.getElementById('form-modal').classList.remove('hidden');
}

function showAddDocumentForm() {
  document.getElementById('form-title').textContent = '添加材料';
  document.getElementById('form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>材料名称 *</label>
        <input type="text" id="form-doc-name" required>
      </div>
      <div class="form-group">
        <label>材料类型 *</label>
        <select id="form-doc-type" required>
          <option value="transcript">成绩单</option>
          <option value="recommendation">推荐信</option>
          <option value="personal_statement">个人陈述</option>
          <option value="language">语言成绩</option>
          <option value="resume">简历</option>
          <option value="other">其他</option>
        </select>
      </div>
    </div>
  `;
  window.currentFormType = 'document';
  document.getElementById('form-modal').classList.remove('hidden');
}

function showAddEssayForm() {
  document.getElementById('form-title').textContent = '新增文书';
  document.getElementById('form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>关联学生 *</label>
        <select id="form-essay-student" required>
          <option value="">请选择学生</option>
        </select>
      </div>
      <div class="form-group">
        <label>文书标题 *</label>
        <input type="text" id="form-essay-title" required>
      </div>
      <div class="form-group">
        <label>截止日期</label>
        <input type="date" id="form-essay-deadline">
      </div>
      <div class="form-group">
        <label>负责人</label>
        <input type="text" id="form-essay-assignee">
      </div>
    </div>
  `;
  loadStudentSelectOptions('form-essay-student');
  window.currentFormType = 'essay';
  document.getElementById('form-modal').classList.remove('hidden');
}

function showAddVisaForm() {
  document.getElementById('form-title').textContent = '新增签证流程';
  document.getElementById('form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>关联学生 *</label>
        <select id="form-visa-student" required>
          <option value="">请选择学生</option>
        </select>
      </div>
      <div class="form-group">
        <label>签证类型 *</label>
        <input type="text" id="form-visa-type" required placeholder="如: 美国F1">
      </div>
    </div>
  `;
  loadStudentSelectOptions('form-visa-student');
  window.currentFormType = 'visa';
  document.getElementById('form-modal').classList.remove('hidden');
}

async function loadStudentSelectOptions(selectId) {
  const result = await api.db.query('SELECT id, name FROM students ORDER BY name');
  if (result.success) {
    const select = document.getElementById(selectId);
    result.data.forEach(s => {
      const option = document.createElement('option');
      option.value = s.id;
      option.textContent = s.name;
      select.appendChild(option);
    });
  }
}

async function handleFormSubmit() {
  let result;

  try {
    switch (window.currentFormType) {
      case 'student':
        const name = document.getElementById('form-name').value;
        const consultant = document.getElementById('form-consultant').value;
        if (!name || !consultant) {
          alert('请填写必填项：姓名、顾问');
          return;
        }
        result = await api.db.query(`
          INSERT INTO students (name, phone, email, target_country, target_major, gpa, consultant, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
          name,
          document.getElementById('form-phone').value || null,
          document.getElementById('form-email').value || null,
          document.getElementById('form-country').value || null,
          document.getElementById('form-major').value || null,
          parseFloat(document.getElementById('form-gpa').value) || null,
          consultant
        ]);
        if (result.success) {
          logOperation(result.data.lastInsertRowid, 'create', 'student', '创建学生档案');
          loadStudents();
          document.getElementById('form-modal').classList.add('hidden');
        } else {
          alert('保存失败：' + (result.error || '未知错误'));
        }
        break;

      case 'program':
        result = await api.db.query(`
          INSERT INTO school_programs (student_id, school_name, program_name, deadline, priority, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          currentStudentId,
          document.getElementById('form-school').value,
          document.getElementById('form-program').value,
          document.getElementById('form-deadline').value || null,
          parseInt(document.getElementById('form-priority').value),
          document.getElementById('form-notes').value
        ]);
        if (result.success) {
          logOperation(currentStudentId, 'add', 'program', `添加选校: ${document.getElementById('form-school').value}`);
          loadStudentPrograms(currentStudentId);
          document.getElementById('form-modal').classList.add('hidden');
        } else {
          alert('保存失败：' + (result.error || '未知错误'));
        }
        break;

      case 'document':
        result = await api.db.query(`
          INSERT INTO documents (student_id, doc_type, doc_name, status, is_latest)
          VALUES (?, ?, ?, 'pending', 1)
        `, [
          currentStudentId,
          document.getElementById('form-doc-type').value,
          document.getElementById('form-doc-name').value
        ]);
        if (result.success) {
          logOperation(currentStudentId, 'add', 'document', `添加材料: ${document.getElementById('form-doc-name').value}`);
          loadStudentDocuments(currentStudentId);
          document.getElementById('form-modal').classList.add('hidden');
        } else {
          alert('保存失败：' + (result.error || '未知错误'));
        }
        break;

      case 'essay':
        result = await api.db.query(`
          INSERT INTO essays (student_id, essay_title, deadline, assigned_to, status)
          VALUES (?, ?, ?, ?, 'draft')
        `, [
          parseInt(document.getElementById('form-essay-student').value),
          document.getElementById('form-essay-title').value,
          document.getElementById('form-essay-deadline').value || null,
          document.getElementById('form-essay-assignee').value
        ]);
        if (result.success) {
          logOperation(parseInt(document.getElementById('form-essay-student').value), 'create', 'essay', `创建文书: ${document.getElementById('form-essay-title').value}`);
          loadEssays();
          document.getElementById('form-modal').classList.add('hidden');
        } else {
          alert('保存失败：' + (result.error || '未知错误'));
        }
        break;

      case 'visa':
        result = await api.db.query(`
          INSERT INTO visa_process (student_id, visa_type, status)
          VALUES (?, ?, 'not_started')
        `, [
          parseInt(document.getElementById('form-visa-student').value),
          document.getElementById('form-visa-type').value
        ]);
        if (result.success) {
          logOperation(parseInt(document.getElementById('form-visa-student').value), 'create', 'visa', `创建签证流程: ${document.getElementById('form-visa-type').value}`);
          loadVisa();
          document.getElementById('form-modal').classList.add('hidden');
        } else {
          alert('保存失败：' + (result.error || '未知错误'));
        }
        break;

      case 'refund':
        const refundAmount = parseFloat(document.getElementById('form-refund-amount').value);
        if (!refundAmount || refundAmount <= 0) {
          alert('请输入有效的退款金额');
          return;
        }
        result = await api.db.query(`
          INSERT INTO refund_requests (student_id, amount, reason, status, requested_by)
          VALUES (?, ?, ?, 'pending', ?)
        `, [
          currentStudentId,
          refundAmount,
          document.getElementById('form-refund-reason').value || null,
          document.getElementById('form-refund-requester').value
        ]);
        if (result.success) {
          await api.db.query("UPDATE students SET status = 'refund_pending' WHERE id = ?", [currentStudentId]);
          logOperation(currentStudentId, 'request', 'refund', `申请退款: ¥${refundAmount}`);
          loadStudentRefunds(currentStudentId);
          loadStudentTimeline(currentStudentId);
          document.getElementById('detail-status').value = '退款中';
          loadStudents();
          document.getElementById('form-modal').classList.add('hidden');
        } else {
          alert('保存失败：' + (result.error || '未知错误'));
        }
        break;

      default:
        document.getElementById('form-modal').classList.add('hidden');
    }
  } catch (error) {
    alert('操作失败：' + error.message);
  }
}

async function exportReceipt() {
  const result = await api.export.receipt(currentStudentId);
  if (!result.success) {
    alert('导出失败');
    return;
  }

  const data = result.data;
  const html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>申请回执 - ${data.student.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; font-size: 14px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { margin-bottom: 10px; }
        .label { font-weight: bold; color: #666; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .footer { margin-top: 50px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">留学服务申请回执</div>
      </div>

      <div class="section">
        <div class="section-title">学生信息</div>
        <div class="info-grid">
          <div class="info-item"><span class="label">姓名：</span>${data.student.name}</div>
          <div class="info-item"><span class="label">电话：</span>${data.student.phone || '-'}</div>
          <div class="info-item"><span class="label">邮箱：</span>${data.student.email || '-'}</div>
          <div class="info-item"><span class="label">目标国家：</span>${data.student.target_country || '-'}</div>
          <div class="info-item"><span class="label">目标专业：</span>${data.student.target_major || '-'}</div>
          <div class="info-item"><span class="label">GPA：</span>${data.student.gpa || '-'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">选校方案 (共${data.summary.totalPrograms}所)</div>
        <table>
          <thead>
            <tr>
              <th>学校名称</th>
              <th>专业</th>
              <th>截止日期</th>
              <th>申请状态</th>
            </tr>
          </thead>
          <tbody>
            ${data.programs.map(p => `
              <tr>
                <td>${p.school_name}</td>
                <td>${p.program_name}</td>
                <td>${p.deadline || '-'}</td>
                <td>${statusLabels[p.application_status] || p.application_status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">材料清单 (共${data.summary.totalDocuments}份, 已通过${data.summary.approvedDocs}份)</div>
        <table>
          <thead>
            <tr>
              <th>材料名称</th>
              <th>类型</th>
              <th>版本</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${data.documents.map(d => `
              <tr>
                <td>${d.doc_name}</td>
                <td>${docTypeLabels[d.doc_type] || d.doc_type}</td>
                <td>v${d.version}</td>
                <td>${statusLabels[d.status] || d.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>

        <div class="footer">
            <div>打印时间：${new Date().toLocaleString('zh-CN')}</div>
          </div>
        </body>
        </html>
        `;

        await api.print.html(html);
        logOperation(currentStudentId, 'export', 'receipt', '打印申请回执');
}

init();
