import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import Modal from '../components/Modal';

const statusMap = {
  'draft': '草稿',
  'pending_approval': '待审批',
  'approved': '已通过',
  'proofing': '打样中',
  'production': '量产中',
  'partial_shipped': '部分发货',
  'shipped': '已发货',
  'completed': '已完成',
  'rejected': '已拒绝'
};

const currentUser = { id: 1, name: '张三', role: 'business' };

export default function Home() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({
    total_quotes: 0, draft_count: 0, pending_approval_count: 0,
    proofing_count: 0, production_count: 0, partial_shipped_count: 0,
    shipped_count: 0, completed_count: 0
  });
  const [filters, setFilters] = useState({
    status: '', customer_name: '', product_type: '', start_date: '', end_date: ''
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    customer_name: '', customer_contact: '', project_name: '',
    product_type: '', quantity: '', unit_price: '', delivery_date: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchQuotes = () => {
    const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    axios.get('/api/quotes', { params }).then(res => {
      setQuotes(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    });
  };

  const fetchStats = () => {
    axios.get('/api/stats').then(res => setStats(res.data.data));
  };

  useEffect(() => {
    fetchQuotes();
    fetchStats();
  }, [pagination.page]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(fetchQuotes, 0);
  };

  const handleReset = () => {
    setFilters({ status: '', customer_name: '', product_type: '', start_date: '', end_date: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(fetchQuotes, 0);
  };

  const handleAddQuote = async () => {
    if (!addForm.customer_name || !addForm.project_name || !addForm.quantity || !addForm.unit_price) {
      alert('请填写必填项');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/quotes', {
        ...addForm,
        quantity: parseInt(addForm.quantity),
        unit_price: parseFloat(addForm.unit_price),
        created_by: currentUser.id
      });
      setAddModalVisible(false);
      setAddForm({ customer_name: '', customer_contact: '', project_name: '', product_type: '', quantity: '', unit_price: '', delivery_date: '' });
      fetchQuotes();
      fetchStats();
    } catch (err) {
      alert('创建失败：' + err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="stats-card">
        <div className="stat-item">
          <div className="stat-value">{stats.total_quotes || 0}</div>
          <div className="stat-label">全部报价</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#595959' }}>{stats.draft_count || 0}</div>
          <div className="stat-label">草稿</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#1890ff' }}>{stats.pending_approval_count || 0}</div>
          <div className="stat-label">待审批</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#fa8c16' }}>{stats.proofing_count || 0}</div>
          <div className="stat-label">打样中</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#13c2c2' }}>{stats.production_count || 0}</div>
          <div className="stat-label">量产中</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#722ed1' }}>{stats.partial_shipped_count || 0}</div>
          <div className="stat-label">部分发货</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#52c41a' }}>{stats.completed_count || 0}</div>
          <div className="stat-label">已完成</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">全部</option>
              {Object.entries(statusMap).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>客户名称</label>
            <input placeholder="输入客户名称" value={filters.customer_name} 
              onChange={e => setFilters(f => ({ ...f, customer_name: e.target.value }))} />
          </div>
          <div className="filter-item">
            <label>产品类型</label>
            <input placeholder="输入产品类型" value={filters.product_type} 
              onChange={e => setFilters(f => ({ ...f, product_type: e.target.value }))} />
          </div>
          <div className="filter-item">
            <label>创建日期-开始</label>
            <input type="date" value={filters.start_date} 
              onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="filter-item">
            <label>创建日期-结束</label>
            <input type="date" value={filters.end_date} 
              onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleSearch}>查询</button>
            <button className="btn btn-default" onClick={handleReset}>重置</button>
            <button className="btn btn-success" onClick={() => setAddModalVisible(true)}>+ 新增报价</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>报价单号</th>
              <th>客户名称</th>
              <th>项目名称</th>
              <th>数量</th>
              <th>总金额</th>
              <th>版本</th>
              <th>状态</th>
              <th>创建人</th>
              <th>当前处理人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(quote => (
              <tr key={quote.id}>
                <td className="link" onClick={() => navigate(`/quote/${quote.id}`)}>{quote.quote_no}</td>
                <td>{quote.customer_name}</td>
                <td>{quote.project_name}</td>
                <td>{quote.quantity?.toLocaleString()}</td>
                <td style={{ color: '#f5222d', fontWeight: 500 }}>¥{quote.total_price?.toLocaleString()}</td>
                <td><span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>v{quote.version}</span></td>
                <td><span className={`status-badge status-${quote.status}`}>{statusMap[quote.status]}</span></td>
                <td>{quote.creator_name}</td>
                <td>{quote.handler_name}</td>
                <td>{dayjs(quote.created_at).format('MM-DD HH:mm')}</td>
                <td>
                  <button className="btn btn-link" onClick={() => navigate(`/quote/${quote.id}`)}>查看详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <span>共 {pagination.total} 条</span>
          <button className="btn btn-default" disabled={pagination.page <= 1} 
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>上一页</button>
          <span>第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize) || 1} 页</span>
          <button className="btn btn-default" disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>下一页</button>
        </div>
      </div>

      <Modal title="新建报价单" visible={addModalVisible} onClose={() => setAddModalVisible(false)} 
        onOk={handleAddQuote} okText={loading ? '创建中...' : '创建'}>
        <div className="form-item">
          <label>客户名称 <span style={{ color: 'red' }}>*</span></label>
          <input value={addForm.customer_name} placeholder="如：腾讯科技" 
            onChange={e => setAddForm(f => ({ ...f, customer_name: e.target.value }))} />
        </div>
        <div className="form-item">
          <label>联系人</label>
          <input value={addForm.customer_contact} placeholder="如：王经理 13800138001" 
            onChange={e => setAddForm(f => ({ ...f, customer_contact: e.target.value }))} />
        </div>
        <div className="form-item">
          <label>项目名称 <span style={{ color: 'red' }}>*</span></label>
          <input value={addForm.project_name} placeholder="如：2024员工端午福利礼盒" 
            onChange={e => setAddForm(f => ({ ...f, project_name: e.target.value }))} />
        </div>
        <div className="form-item">
          <label>产品类型</label>
          <input value={addForm.product_type} placeholder="如：端午礼盒" 
            onChange={e => setAddForm(f => ({ ...f, product_type: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-item">
            <label>数量 <span style={{ color: 'red' }}>*</span></label>
            <input type="number" value={addForm.quantity} placeholder="500" 
              onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div className="form-item">
            <label>单价(元) <span style={{ color: 'red' }}>*</span></label>
            <input type="number" step="0.01" value={addForm.unit_price} placeholder="128.00" 
              onChange={e => setAddForm(f => ({ ...f, unit_price: e.target.value }))} />
          </div>
        </div>
        <div className="form-item">
          <label>交货日期</label>
          <input type="date" value={addForm.delivery_date} 
            onChange={e => setAddForm(f => ({ ...f, delivery_date: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
