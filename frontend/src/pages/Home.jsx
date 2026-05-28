import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

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

export default function Home() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({
    total_quotes: 0,
    draft_count: 0,
    pending_approval_count: 0,
    proofing_count: 0,
    production_count: 0,
    partial_shipped_count: 0,
    shipped_count: 0,
    completed_count: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    customer_name: '',
    product_type: '',
    start_date: '',
    end_date: ''
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchQuotes = () => {
    const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    
    axios.get('/api/quotes', { params }).then(res => {
      setQuotes(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total, totalPages: res.data.pagination.totalPages }));
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
    fetchQuotes();
  };

  const handleReset = () => {
    setFilters({ status: '', customer_name: '', product_type: '', start_date: '', end_date: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(fetchQuotes, 0);
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
                  <button className="btn btn-link" onClick={() => navigate(`/quote/${quote.id}`)}>查看</button>
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
    </div>
  );
}
