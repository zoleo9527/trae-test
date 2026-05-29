const API_BASE = '/api';

const RoleLabel = {
  STORE_OWNER: '门店老板',
  SALES: '配件销售',
  WAREHOUSE: '仓库管库',
};

const InquiryStatusLabel = {
  DRAFT: '草稿',
  PENDING: '待报价',
  QUOTED: '已报价',
  CONFIRMED: '已确认',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
};

const StockLockStatusLabel = {
  PENDING: '待确认',
  LOCKED: '已锁库',
  SOLD: '已出库',
  RELEASED: '已释放',
};

const ReturnStatusLabel = {
  PENDING_IDENTIFY: '待鉴定',
  IDENTIFYING: '鉴定中',
  REWORK: '需补录',
  APPROVED: '鉴定通过',
  REJECTED: '鉴定驳回',
  COMPLETED: '退货完成',
};

const RefundStatusLabel = {
  PENDING_REVIEW: '待复核',
  REVIEWING: '复核中',
  APPROVED: '复核通过',
  REJECTED: '复核驳回',
  PAID: '已打款',
  FAILED: '打款失败',
  COMPLETED: '退款完成',
};

const OperationTypeLabel = {
  CREATE: '创建',
  UPDATE: '编辑',
  UPDATE_STATUS: '状态变更',
  SUBMIT: '提交',
  APPROVE: '审批通过',
  REJECT: '审批驳回',
  REWORK: '退回补录',
  CANCEL: '取消',
  LOCK: '锁库',
  UNLOCK: '释放库存',
  INSPECT: '验货',
  PAY: '打款',
  ADD_REMARK: '添加备注',
  UPLOAD_EVIDENCE: '上传凭证',
  EXPORT: '导出',
};

const ExceptionTypeLabel = {
  WRONG_PART: '型号错误',
  NO_EVIDENCE: '退货无据',
  PAYMENT_DELAY: '回款拖欠',
  PRICE_DISPUTE: '价格争议',
  QUALITY_ISSUE: '质量问题',
  LOST_DAMAGE: '丢失损坏',
  OTHER: '其他异常',
};

const EvidenceTypeLabel = {
  PHOTO: '照片',
  RECEIPT: '收据',
  CHAT_RECORD: '聊天记录',
  INVOICE: '发票',
  INSPECTION_REPORT: '检测报告',
  OTHER: '其他',
};

function getEvidenceIcon(type) {
  const icons = {
    PHOTO: '📷',
    RECEIPT: '🧾',
    CHAT_RECORD: '💬',
    INVOICE: '📄',
    INSPECTION_REPORT: '🔬',
    OTHER: '📎',
  };
  return icons[type] || '📎';
}

function getStatusClass(status) {
  const s = String(status).toLowerCase();
  if (s.includes('pending') || s.includes('draft') || s.includes('reviewing') || s.includes('identifying') || s.includes('rework')) {
    return 'status-pending';
  }
  if (s.includes('approved') || s.includes('confirmed') || s.includes('locked') || s.includes('paid') || s.includes('sold')) {
    return 'status-approved';
  }
  if (s.includes('rejected') || s.includes('failed')) {
    return 'status-rejected';
  }
  if (s.includes('closed') || s.includes('completed') || s.includes('released')) {
    return 'status-completed';
  }
  return 'status-draft';
}

function getStatusLabel(status) {
  if (!status) return '-';
  return InquiryStatusLabel[status] || 
         StockLockStatusLabel[status] || 
         ReturnStatusLabel[status] || 
         RefundStatusLabel[status] || 
         status;
}

function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  localStorage.setItem('auth_token', token);
}

function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || '{}');
  } catch {
    return {};
  }
}

function setCurrentUser(user) {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      clearAuth();
      window.location.href = '/index.html';
      return null;
    }
    
    if (data.code !== 0) {
      showToast(data.message || '操作失败', 'error');
      throw new Error(data.message || '操作失败');
    }
    
    return data;
  } catch (error) {
    if (error.message !== '操作失败') {
      showToast('网络错误，请稍后重试', 'error');
    }
    throw error;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMoney(amount) {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toFixed(2)}`;
}

function initLoginPage() {
  const roleCards = document.querySelectorAll('.role-card');
  const loginForm = document.getElementById('loginForm');
  const roleSelector = document.querySelector('.role-selector');
  const usernameInput = document.getElementById('username');
  const loginBtn = document.getElementById('loginBtn');
  const backBtn = document.getElementById('backBtn');
  const passwordInput = document.getElementById('password');
  
  let selectedRole = null;
  let selectedUsername = null;
  
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      selectedRole = card.dataset.role;
      selectedUsername = card.dataset.username;
      usernameInput.value = selectedUsername;
      roleSelector.style.display = 'none';
      loginForm.style.display = 'block';
    });
  });
  
  backBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    roleSelector.style.display = 'grid';
    passwordInput.value = '123456';
  });
  
  loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
      showToast('请输入账号和密码', 'error');
      return;
    }
    
    try {
      const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      if (result) {
        setToken(result.data.token);
        setCurrentUser(result.data.user);
        showToast('登录成功，正在跳转...');
        setTimeout(() => {
          window.location.href = '/list.html';
        }, 800);
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
  });
}

const DOC_TYPE_CONFIG = {
  inquiry: {
    title: '询价单',
    desc: '管理所有询价单，支持筛选、搜索和导出',
    apiEndpoint: '/inquiries',
    detailEndpoint: '/inquiries',
    statusLabel: InquiryStatusLabel,
    statusEnum: ['DRAFT', 'PENDING', 'QUOTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    columns: [
      { key: 'inquiryNo', label: '询价单号', width: '140px' },
      { key: 'customerName', label: '客户名称', width: '120px' },
      { key: 'carModel', label: '车型', width: '100px' },
      { key: 'totalAmount', label: '总金额', width: '100px', format: formatMoney },
      { key: 'status', label: '状态', width: '100px', isStatus: true },
      { key: 'hasException', label: '异常', width: '80px', isException: true },
      { key: 'stockLock', label: '锁库单', width: '120px', format: v => v ? v.lockNo : '-' },
      { key: 'returnOrder', label: '退货单', width: '120px', format: v => v ? v.returnNo : '-' },
      { key: 'refundOrder', label: '退款单', width: '120px', format: v => v ? v.refundNo : '-' },
      { key: 'createdBy', label: '创建人', width: '100px', format: v => v?.realName || '-' },
      { key: 'createdAt', label: '创建时间', width: '160px', format: formatDate },
      { key: '_actions', label: '操作', width: '120px', isActions: true },
    ],
  },
  stockLock: {
    title: '锁库单',
    desc: '管理所有锁库单，库存锁定与释放',
    apiEndpoint: '/stock-locks',
    detailEndpoint: '/stock-locks',
    statusLabel: StockLockStatusLabel,
    statusEnum: ['PENDING', 'LOCKED', 'SOLD', 'RELEASED'],
    columns: [
      { key: 'lockNo', label: '锁库单号', width: '140px' },
      { key: 'inquiry', label: '询价单号', width: '140px', format: v => v?.inquiryNo || '-' },
      { key: 'inquiry', label: '客户名称', width: '120px', format: v => v?.customerName || '-' },
      { key: 'status', label: '状态', width: '100px', isStatus: true },
      { key: 'hasException', label: '异常', width: '80px', isException: true },
      { key: 'validUntil', label: '有效期至', width: '140px', format: formatDate },
      { key: 'warehouseNote', label: '仓库便签', width: '140px' },
      { key: 'createdBy', label: '创建人', width: '100px', format: v => v?.realName || '-' },
      { key: 'createdAt', label: '创建时间', width: '160px', format: formatDate },
      { key: '_actions', label: '操作', width: '120px', isActions: true },
    ],
  },
  returnOrder: {
    title: '退货单',
    desc: '退货鉴定管理，支持质量检测与证据留存',
    apiEndpoint: '/return-orders',
    detailEndpoint: '/return-orders',
    statusLabel: ReturnStatusLabel,
    statusEnum: ['PENDING_IDENTIFY', 'IDENTIFYING', 'REWORK', 'APPROVED', 'REJECTED', 'COMPLETED'],
    columns: [
      { key: 'returnNo', label: '退货单号', width: '140px' },
      { key: 'inquiry', label: '询价单号', width: '140px', format: v => v?.inquiryNo || '-' },
      { key: 'inquiry', label: '客户名称', width: '120px', format: v => v?.customerName || '-' },
      { key: 'returnReason', label: '退货原因', width: '150px' },
      { key: 'applyRefundAmount', label: '申请退款', width: '110px', format: formatMoney },
      { key: 'status', label: '状态', width: '110px', isStatus: true },
      { key: 'hasException', label: '异常', width: '80px', isException: true },
      { key: 'identifyBy', label: '鉴定人', width: '100px', format: v => v?.realName || '-' },
      { key: 'createdBy', label: '创建人', width: '100px', format: v => v?.realName || '-' },
      { key: 'createdAt', label: '创建时间', width: '160px', format: formatDate },
      { key: '_actions', label: '操作', width: '120px', isActions: true },
    ],
  },
  refundOrder: {
    title: '退款单',
    desc: '退款复核管理，财务审批与打款跟踪',
    apiEndpoint: '/refund-orders',
    detailEndpoint: '/refund-orders',
    statusLabel: RefundStatusLabel,
    statusEnum: ['PENDING_REVIEW', 'REVIEWING', 'APPROVED', 'REJECTED', 'PAID', 'FAILED', 'COMPLETED'],
    columns: [
      { key: 'refundNo', label: '退款单号', width: '140px' },
      { key: 'returnOrder', label: '退货单号', width: '140px', format: v => v?.returnNo || '-' },
      { key: 'inquiry', label: '客户名称', width: '120px', format: v => v?.customerName || '-' },
      { key: 'refundAmount', label: '申请金额', width: '110px', format: formatMoney },
      { key: 'actualRefundAmount', label: '实退金额', width: '110px', format: formatMoney },
      { key: 'status', label: '状态', width: '110px', isStatus: true },
      { key: 'hasException', label: '异常', width: '80px', isException: true },
      { key: 'isCreditCustomer', label: '账期客户', width: '100px', format: v => v ? '是' : '否' },
      { key: 'createdBy', label: '创建人', width: '100px', format: v => v?.realName || '-' },
      { key: 'createdAt', label: '创建时间', width: '160px', format: formatDate },
      { key: '_actions', label: '操作', width: '120px', isActions: true },
    ],
  },
  audit: {
    title: '操作日志',
    desc: '全链路操作审计，异常回溯追踪',
    apiEndpoint: '/audit-logs',
    detailEndpoint: null,
    statusLabel: {},
    statusEnum: [],
    columns: [
      { key: 'operationType', label: '操作类型', width: '120px', format: v => OperationTypeLabel[v] || v },
      { key: 'operatorName', label: '操作人', width: '100px' },
      { key: 'inquiry', label: '询价单', width: '140px', format: v => v?.inquiryNo || '-' },
      { key: 'oldStatus', label: '原状态', width: '100px', format: v => v ? getStatusLabel(v) : '-' },
      { key: 'newStatus', label: '新状态', width: '100px', format: v => v ? getStatusLabel(v) : '-' },
      { key: 'ipAddress', label: 'IP地址', width: '120px' },
      { key: 'userAgent', label: '客户端', width: '180px', format: v => (v || '').substring(0, 30) + ((v || '').length > 30 ? '...' : '') },
      { key: 'createdAt', label: '操作时间', width: '160px', format: formatDate },
    ],
  },
};

let currentDocType = 'inquiry';
let currentPage = 1;
let currentFilters = {};

function initListPage() {
  const user = getCurrentUser();
  if (!user.id) {
    window.location.href = '/index.html';
    return;
  }
  
  document.getElementById('userName').textContent = user.realName;
  document.getElementById('userRole').textContent = RoleLabel[user.role] || user.role;
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      if (type === currentDocType) return;
      
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      currentDocType = type;
      currentPage = 1;
      currentFilters = {};
      
      updatePageHeader();
      updateStatusFilter();
      loadData();
    });
  });
  
  document.getElementById('searchBtn').addEventListener('click', () => {
    currentPage = 1;
    collectFilters();
    loadData();
  });
  
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('keyword').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('exceptionFilter').value = '';
    currentPage = 1;
    currentFilters = {};
    loadData();
  });
  
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = '/index.html';
  });
  
  document.getElementById('exportBtn').addEventListener('click', async () => {
    const token = getToken();
    const config = DOC_TYPE_CONFIG[currentDocType];
    const params = new URLSearchParams({
      type: currentDocType === 'inquiry' ? 'inquiry' :
            currentDocType === 'stockLock' ? 'stockLock' :
            currentDocType === 'returnOrder' ? 'returnOrder' : 'refundOrder',
      format: 'xlsx',
      ...currentFilters,
    });
    
    try {
      const response = await fetch(`${API_BASE}/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.message || '导出失败', 'error');
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.label}列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('导出成功');
    } catch (e) {
      console.error('Export failed:', e);
      showToast('导出失败，请重试', 'error');
    }
  });
  
  document.querySelectorAll('[data-close="true"]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('detailModal').style.display = 'none';
    });
  });
  
  updatePageHeader();
  updateStatusFilter();
  loadData();
}

function updatePageHeader() {
  const config = DOC_TYPE_CONFIG[currentDocType];
  document.getElementById('pageTitle').textContent = config.title + '列表';
  document.getElementById('pageDesc').textContent = config.desc;
  
  const createBtn = document.getElementById('createBtn');
  if (currentDocType === 'audit') {
    createBtn.style.display = 'none';
  } else if (currentDocType === 'inquiry' && getCurrentUser().role !== 'WAREHOUSE') {
    createBtn.style.display = 'inline-flex';
  } else if (currentDocType === 'returnOrder' && getCurrentUser().role !== 'WAREHOUSE') {
    createBtn.style.display = 'inline-flex';
  } else {
    createBtn.style.display = 'none';
  }
}

function updateStatusFilter() {
  const config = DOC_TYPE_CONFIG[currentDocType];
  const select = document.getElementById('statusFilter');
  select.innerHTML = '<option value="">全部状态</option>';
  
  config.statusEnum.forEach(status => {
    const label = config.statusLabel[status] || status;
    select.innerHTML += `<option value="${status}">${label}</option>`;
  });
  
  if (currentDocType === 'audit') {
    select.parentElement.style.display = 'none';
    document.getElementById('exceptionFilter').parentElement.style.display = 'none';
  } else {
    select.parentElement.style.display = 'flex';
    document.getElementById('exceptionFilter').parentElement.style.display = 'flex';
  }
}

function collectFilters() {
  currentFilters = {
    keyword: document.getElementById('keyword').value.trim(),
    status: document.getElementById('statusFilter').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    hasException: document.getElementById('exceptionFilter').value,
  };
}

function renderTableHeader() {
  const config = DOC_TYPE_CONFIG[currentDocType];
  const headerRow = document.getElementById('tableHeader');
  headerRow.innerHTML = '';
  
  config.columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    if (col.width) th.style.width = col.width;
    headerRow.appendChild(th);
  });
}

function renderTableRows(data) {
  const config = DOC_TYPE_CONFIG[currentDocType];
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  
  if (!data || data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = config.columns.length;
    td.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无数据</div>
      </div>
    `;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  
  data.forEach(item => {
    const tr = document.createElement('tr');
    
    config.columns.forEach(col => {
      const td = document.createElement('td');
      
      if (col.isStatus) {
        const status = item[col.key];
        const label = config.statusLabel[status] || status;
        td.innerHTML = `<span class="status-badge ${getStatusClass(status)}">${label}</span>`;
      } else if (col.isException) {
        const hasException = item[col.key];
        td.innerHTML = hasException 
          ? '<span class="exception-badge">有异常</span>'
          : '<span class="exception-badge normal">正常</span>';
      } else if (col.isActions) {
        if (currentDocType !== 'audit') {
          td.innerHTML = `<a class="action-link" data-id="${item.id}">查看详情</a>`;
          td.querySelector('.action-link').addEventListener('click', () => {
            showDetail(item.id);
          });
        } else {
          td.textContent = '-';
        }
      } else if (col.format) {
        td.textContent = col.format(item[col.key], item);
      } else {
        const value = item[col.key];
        td.textContent = value !== null && value !== undefined ? value : '-';
      }
      
      tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
  });
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  const { page, pageSize, total, totalPages } = pagination;
  
  container.innerHTML = `
    <div class="pagination-info">
      共 ${total} 条记录，当前第 ${page} / ${totalPages} 页
    </div>
    <div class="pagination-controls">
      <button class="page-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>
      ${generatePageButtons(page, totalPages)}
      <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>
    </div>
  `;
  
  container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageNum = parseInt(btn.dataset.page);
      if (pageNum && pageNum !== currentPage) {
        currentPage = pageNum;
        loadData();
      }
    });
  });
}

function generatePageButtons(current, total) {
  let html = '';
  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  if (start > 1) {
    html += '<button class="page-btn" data-page="1">1</button>';
    if (start > 2) {
      html += '<span class="page-btn" style="cursor:default">...</span>';
    }
  }
  
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  
  if (end < total) {
    if (end < total - 1) {
      html += '<span class="page-btn" style="cursor:default">...</span>';
    }
    html += `<button class="page-btn" data-page="${total}">${total}</button>`;
  }
  
  return html;
}

async function loadData() {
  const config = DOC_TYPE_CONFIG[currentDocType];
  
  renderTableHeader();
  document.getElementById('tableBody').innerHTML = '<tr><td colspan="100"><div class="loading">加载中...</div></td></tr>';
  
  const params = new URLSearchParams({
    page: currentPage,
    pageSize: 10,
    ...currentFilters,
  });
  
  try {
    const result = await apiCall(`${config.apiEndpoint}?${params.toString()}`);
    
    if (result) {
      renderTableRows(result.data);
      renderPagination(result.pagination);
    }
  } catch (e) {
    console.error('Load data failed:', e);
    document.getElementById('tableBody').innerHTML = '<tr><td colspan="100"><div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败，请刷新重试</div></div></td></tr>';
  }
}

async function showDetail(id) {
  const config = DOC_TYPE_CONFIG[currentDocType];
  if (!config.detailEndpoint) return;
  
  document.getElementById('detailModal').style.display = 'flex';
  document.getElementById('modalTitle').textContent = config.title + '详情';
  document.getElementById('modalBody').innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const result = await apiCall(`${config.detailEndpoint}/${id}`);
    if (result) {
      renderDetail(result.data);
    }
  } catch (e) {
    console.error('Load detail failed:', e);
    document.getElementById('modalBody').innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载详情失败</div></div>';
  }
}

function renderDetail(data) {
  const config = DOC_TYPE_CONFIG[currentDocType];
  const user = getCurrentUser();
  
  let html = '';
  
  html += `<div class="related-docs">
    ${data.inquiry ? `<div class="related-doc ${currentDocType === 'inquiry' ? 'related-doc-active' : ''}" onclick="switchDetail('inquiry', '${data.inquiry.id}')">📋 ${data.inquiry.inquiryNo || '询价单'}</div>` : ''}
    ${data.stockLock ? `<div class="related-doc ${currentDocType === 'stockLock' ? 'related-doc-active' : ''}" onclick="switchDetail('stockLock', '${data.stockLock.id}')">🔒 ${data.stockLock.lockNo || '锁库单'}</div>` : ''}
    ${data.returnOrder ? `<div class="related-doc ${currentDocType === 'returnOrder' ? 'related-doc-active' : ''}" onclick="switchDetail('returnOrder', '${data.returnOrder.id}')">↩️ ${data.returnOrder.returnNo || '退货单'}</div>` : ''}
    ${data.refundOrder ? `<div class="related-doc ${currentDocType === 'refundOrder' ? 'related-doc-active' : ''}" onclick="switchDetail('refundOrder', '${data.refundOrder.id}')">💰 ${data.refundOrder.refundNo || '退款单'}</div>` : ''}
  </div>`;
  
  html += `<div class="detail-section">
    <h4>📝 基本信息</h4>
    <div class="detail-grid">
      ${renderDetailItem('单据编号', data.inquiryNo || data.lockNo || data.returnNo || data.refundNo)}
      ${renderDetailItem('状态', `<span class="status-badge ${getStatusClass(data.status)}">${config.statusLabel[data.status] || data.status}</span>`)}
      ${renderDetailItem('客户名称', data.inquiry?.customerName || data.customerName || '-')}
      ${data.inquiry?.carModel ? renderDetailItem('车型', data.inquiry.carModel) : ''}
      ${data.inquiry?.vinNo ? renderDetailItem('车架号', data.inquiry.vinNo) : ''}
      ${data.totalAmount !== undefined ? renderDetailItem('总金额', formatMoney(data.totalAmount)) : ''}
      ${data.refundAmount !== undefined ? renderDetailItem('申请退款金额', formatMoney(data.refundAmount)) : ''}
      ${data.actualRefundAmount !== undefined ? renderDetailItem('实际退款金额', formatMoney(data.actualRefundAmount)) : ''}
      ${data.applyRefundAmount !== undefined ? renderDetailItem('申请退款金额', formatMoney(data.applyRefundAmount)) : ''}
      ${data.returnReason ? renderDetailItem('退货原因', data.returnReason) : ''}
      ${data.identifyResult ? renderDetailItem('鉴定结论', data.identifyResult) : ''}
      ${data.rejectReason ? renderDetailItem('驳回原因', `<span style="color:#e53e3e">${data.rejectReason}</span>`) : ''}
      ${data.supplementNote ? renderDetailItem('补录说明', data.supplementNote) : ''}
      ${data.reworkNote ? renderDetailItem('补录要求', data.reworkNote) : ''}
      ${data.exceptionNote ? renderDetailItem('异常说明', `<span style="color:#e53e3e">${data.exceptionNote}</span>`) : ''}
      ${data.paymentMethod ? renderDetailItem('付款方式', data.paymentMethod) : ''}
      ${data.paymentTraceNo ? renderDetailItem('付款流水号', data.paymentTraceNo) : ''}
      ${data.dueDate ? renderDetailItem('账期到期日', formatDate(data.dueDate)) : ''}
      ${data.hasDelay !== undefined ? renderDetailItem('是否逾期', data.hasDelay ? `<span style="color:#e53e3e">是（逾期${data.delayDays || 0}天）</span>` : '否') : ''}
      ${data.hasException !== undefined ? renderDetailItem('异常标记', data.hasException 
        ? `<span class="exception-badge">${ExceptionTypeLabel[data.exceptionType] || '异常'}</span>`
        : '<span class="exception-badge normal">正常</span>') : ''}
      ${data.createdBy ? renderDetailItem('创建人', data.createdBy.realName) : ''}
      ${data.handledBy ? renderDetailItem('处理人', data.handledBy.realName) : ''}
      ${data.identifyBy ? renderDetailItem('鉴定人', data.identifyBy.realName) : ''}
      ${data.reviewBy ? renderDetailItem('复核人', data.reviewBy.realName) : ''}
      ${renderDetailItem('创建时间', formatDate(data.createdAt))}
    </div>
  </div>`;
  
  if (data.items && data.items.length > 0) {
    html += `<div class="detail-section">
      <h4>📦 配件明细</h4>
      <table class="items-table">
        <thead>
          <tr>
            <th>配件名称</th>
            <th>配件编号</th>
            <th>数量</th>
            <th>单价</th>
            <th>小计</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.partName}</td>
              <td>${item.partCode || '-'}</td>
              <td>${item.quantity || item.returnQuantity || item.originalQuantity || '-'}</td>
              <td>${formatMoney(item.quotedPrice || item.unitPrice)}</td>
              <td>${formatMoney((item.quotedPrice || item.unitPrice || 0) * (item.quantity || item.returnQuantity || 0))}</td>
              <td>${item.remark || item.inspectionResult || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  }
  
  if (data.operationLogs && data.operationLogs.length > 0) {
    html += `<div class="detail-section">
      <h4>📜 操作日志（最近${data.operationLogs.length}条）</h4>
      <div class="timeline">
        ${data.operationLogs.map(log => `
          <div class="timeline-item">
            <div class="timeline-content">
              <div class="timeline-title">
                ${OperationTypeLabel[log.operationType] || log.operationType}
                ${log.oldStatus && log.newStatus ? `：${getStatusLabel(log.oldStatus)} → ${getStatusLabel(log.newStatus)}` : ''}
              </div>
              <div class="timeline-meta">
                ${log.operatorName || '系统'} · ${formatDate(log.createdAt)} · IP: ${log.ipAddress || '-'}
              </div>
              ${log.detail ? `<div class="timeline-detail">${renderLogDetail(log.detail)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }
  
  if (data.remarks && data.remarks.length > 0) {
    html += `<div class="detail-section">
      <h4>💬 备注信息（${data.remarks.length}条）</h4>
      ${data.remarks.map(remark => `
        <div class="remark-item ${remark.isImportant ? 'important' : ''}">
          <div class="remark-header">
            <span class="remark-author">${remark.createdBy?.realName || '未知'} ${remark.isImportant ? '⚠️ 重要' : ''}</span>
            <span class="remark-time">${formatDate(remark.createdAt)}</span>
          </div>
          <div class="remark-content">${remark.content}</div>
        </div>
      `).join('')}
    </div>`;
  }
  
  if (data.evidences && data.evidences.length > 0) {
    html += `<div class="detail-section">
      <h4>📎 证据链（${data.evidences.length}份）</h4>
      <div class="evidence-list">
        ${data.evidences.map(ev => `
          <div class="evidence-item">
            <div class="evidence-icon">${getEvidenceIcon(ev.evidenceType)}</div>
            <div>
              <div>${ev.fileName || EvidenceTypeLabel[ev.evidenceType] || ev.evidenceType}</div>
              ${ev.description ? `<div class="evidence-remark">${ev.description}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }
  
  html += renderActionPanel(data, user);
  
  document.getElementById('modalBody').innerHTML = html;
}

function renderDetailItem(label, value) {
  return `<div class="detail-item">
    <div class="detail-label">${label}</div>
    <div class="detail-value">${value !== null && value !== undefined ? value : '-'}</div>
  </div>`;
}

function renderLogDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') {
    return Object.entries(detail)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' | ');
  }
  return '';
}

function renderActionPanel(data, user) {
  const userRole = user.role;
  const currentStatus = data.status;
  
  const actions = getAvailableActions(currentDocType, currentStatus, userRole);
  
  if (actions.length === 0) return '';
  
  return `<div class="action-panel">
    <h5>⚡ 可用操作</h5>
    <div class="action-buttons">
      ${actions.map(action => `
        <button class="btn ${action.style}" onclick="executeAction('${action.key}', '${data.id}')">${action.label}</button>
      `).join('')}
    </div>
    
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #c3d4ff;">
      <div class="form-group">
        <label>添加备注（可选）</label>
        <textarea id="actionRemark" placeholder="填写操作说明或备注信息..."></textarea>
        <label style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-weight: normal;">
          <input type="checkbox" id="remarkImportant"> 标记为重要备注
        </label>
      </div>
    </div>
  </div>`;
}

function getAvailableActions(docType, status, role) {
  const actions = [];
  
  if (docType === 'inquiry') {
    if (role === 'SALES') {
      if (status === 'DRAFT') {
        actions.push({ key: 'submit', label: '提交报价', style: 'btn-primary' });
      }
      if (status === 'PENDING') {
        actions.push({ key: 'quote', label: '完成报价', style: 'btn-primary' });
      }
    }
    if (role === 'STORE_OWNER') {
      if (status === 'QUOTED') {
        actions.push({ key: 'confirm', label: '确认报价', style: 'btn-success' });
        actions.push({ key: 'reject', label: '拒绝报价', style: 'btn-danger' });
      }
    }
  }
  
  if (docType === 'stockLock') {
    if (role === 'WAREHOUSE') {
      if (status === 'PENDING') {
        actions.push({ key: 'lock', label: '确认锁库', style: 'btn-success' });
        actions.push({ key: 'reject', label: '库存不足', style: 'btn-danger' });
      }
      if (status === 'LOCKED') {
        actions.push({ key: 'release', label: '释放库存', style: 'btn-warning' });
      }
    }
  }
  
  if (docType === 'returnOrder') {
    if (role === 'SALES') {
      if (status === 'PENDING_IDENTIFY') {
        actions.push({ key: 'startIdentify', label: '开始鉴定', style: 'btn-primary' });
        actions.push({ key: 'reject', label: '直接驳回', style: 'btn-danger' });
      }
      if (status === 'IDENTIFYING') {
        actions.push({ key: 'approve', label: '鉴定通过', style: 'btn-success' });
        actions.push({ key: 'rework', label: '需补资料', style: 'btn-warning' });
        actions.push({ key: 'reject', label: '鉴定驳回', style: 'btn-danger' });
      }
      if (status === 'REWORK') {
        actions.push({ key: 'resubmit', label: '补录重提', style: 'btn-primary' });
        actions.push({ key: 'reject', label: '鉴定驳回', style: 'btn-danger' });
      }
      if (status === 'APPROVED') {
        actions.push({ key: 'complete', label: '完成退货', style: 'btn-success' });
      }
    }
    if (role === 'STORE_OWNER' && status === 'REWORK') {
      actions.push({ key: 'resubmit', label: '补录重提', style: 'btn-primary' });
    }
  }
  
  if (docType === 'refundOrder') {
    if (role === 'SALES') {
      if (status === 'PENDING_REVIEW') {
        actions.push({ key: 'review', label: '开始复核', style: 'btn-primary' });
        actions.push({ key: 'reject', label: '直接驳回', style: 'btn-danger' });
      }
      if (status === 'REVIEWING') {
        actions.push({ key: 'reject', label: '复核驳回', style: 'btn-danger' });
      }
      if (status === 'APPROVED') {
        actions.push({ key: 'pay', label: '确认打款', style: 'btn-success' });
        actions.push({ key: 'fail', label: '打款失败', style: 'btn-danger' });
      }
      if (status === 'PAID') {
        actions.push({ key: 'complete', label: '完成退款', style: 'btn-success' });
      }
      if (status === 'FAILED') {
        actions.push({ key: 'retry', label: '重新打款', style: 'btn-primary' });
        actions.push({ key: 'reject', label: '终止退款', style: 'btn-danger' });
      }
    }
    if (role === 'STORE_OWNER') {
      if (status === 'REVIEWING') {
        actions.push({ key: 'approve', label: '审批通过', style: 'btn-success' });
      }
      if (status === 'FAILED') {
        actions.push({ key: 'reject', label: '终止退款', style: 'btn-danger' });
      }
    }
  }
  
  actions.push({ key: 'addRemark', label: '添加备注', style: 'btn-secondary' });
  
  return actions;
}

async function executeAction(actionKey, id) {
  const remark = document.getElementById('actionRemark')?.value || '';
  const isImportant = document.getElementById('remarkImportant')?.checked || false;
  
  const statusMap = {
    'inquiry-submit': 'PENDING',
    'inquiry-quote': 'QUOTED',
    'inquiry-confirm': 'CONFIRMED',
    'inquiry-reject': 'CANCELLED',
    'stockLock-lock': 'LOCKED',
    'stockLock-reject': 'RELEASED',
    'stockLock-release': 'RELEASED',
    'returnOrder-startIdentify': 'IDENTIFYING',
    'returnOrder-approve': 'APPROVED',
    'returnOrder-rework': 'REWORK',
    'returnOrder-reject': 'REJECTED',
    'returnOrder-resubmit': 'IDENTIFYING',
    'returnOrder-complete': 'COMPLETED',
    'refundOrder-review': 'REVIEWING',
    'refundOrder-approve': 'APPROVED',
    'refundOrder-reject': 'REJECTED',
    'refundOrder-pay': 'PAID',
    'refundOrder-fail': 'FAILED',
    'refundOrder-retry': 'PAID',
    'refundOrder-complete': 'COMPLETED',
  };
  
  if (actionKey === 'addRemark') {
    if (!remark.trim()) {
      showToast('请输入备注内容', 'error');
      return;
    }
    
    const endpointMap = {
      inquiry: `/inquiries/${id}/remarks`,
      stockLock: `/stock-locks/${id}/remarks`,
      returnOrder: `/return-orders/${id}/remarks`,
      refundOrder: `/refund-orders/${id}/remarks`,
    };
    
    try {
      await apiCall(endpointMap[currentDocType], {
        method: 'POST',
        body: JSON.stringify({ content: remark, isImportant }),
      });
      showToast('备注添加成功');
      showDetail(id);
      loadData();
    } catch (e) {
      console.error('Add remark failed:', e);
    }
    return;
  }
  
  const targetStatus = statusMap[`${currentDocType}-${actionKey}`];
  if (!targetStatus) {
    showToast('未知操作', 'error');
    return;
  }
  
  const confirmMsg = {
    'reject': '确定要驳回吗？请在备注中说明驳回原因。',
    'rework': '确定要求补录资料吗？请在备注中说明补录要求。',
  };
  
  if (confirmMsg[actionKey] && !remark.trim()) {
    showToast(confirmMsg[actionKey], 'error');
    return;
  }
  
  if (!confirm(`确定执行此操作吗？`)) return;
  
  try {
    const endpointMap = {
      inquiry: `/inquiries/${id}/status`,
      stockLock: `/stock-locks/${id}/status`,
      returnOrder: `/return-orders/${id}/status`,
      refundOrder: `/refund-orders/${id}/status`,
    };
    
    const body = { status: targetStatus, remark };
    if (actionKey === 'reject' || actionKey === 'rework') {
      body.rejectReason = remark;
    }
    
    await apiCall(endpointMap[currentDocType], {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    
    showToast('操作成功');
    showDetail(id);
    loadData();
  } catch (e) {
    console.error('Execute action failed:', e);
  }
}

async function switchDetail(type, id) {
  currentDocType = type;
  
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.type === type);
  });
  
  updatePageHeader();
  updateStatusFilter();
  
  await showDetail(id);
}

window.switchDetail = switchDetail;
window.executeAction = executeAction;
window.initLoginPage = initLoginPage;
window.initListPage = initListPage;

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html' || path === '') {
    initLoginPage();
  } else if (path === '/list.html') {
    initListPage();
  }
});
