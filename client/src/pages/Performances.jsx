import { useState, useEffect } from 'react';
import { performanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const Performances = () => {
  const { user } = useAuth();
  const [performances, setPerformances] = useState([]);
  const [filter, setFilter] = useState({ status: '', venue: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformances();
  }, [filter]);

  const loadPerformances = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.venue) params.venue = filter.venue;
      const res = await performanceApi.getAll(params);
      setPerformances(res.data);
    } catch (err) {
      console.error('加载演出失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusNames = {
    draft: '草稿',
    scheduled: '已排期',
    ticketing: '售票中',
    rehearsing: '联排中',
    performing: '演出中',
    completed: '已完成',
    cancelled: '已取消'
  };

  return (
    <div>
      <div className="page-header">
        <h2>🎭 演出排期</h2>
        {user?.role === 'theater_manager' && (
          <button className="btn btn-primary btn-sm">+ 新增演出</button>
        )}
      </div>

      <div className="filter-bar">
        <select 
          className="filter-select" 
          value={filter.status} 
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="scheduled">已排期</option>
          <option value="ticketing">售票中</option>
          <option value="rehearsing">联排中</option>
          <option value="completed">已完成</option>
        </select>
        <select 
          className="filter-select" 
          value={filter.venue} 
          onChange={(e) => setFilter({ ...filter, venue: e.target.value })}
        >
          <option value="">全部场地</option>
          <option value="主剧场">主剧场</option>
          <option value="实验剧场">实验剧场</option>
        </select>
      </div>

      <div className="main-panel" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>演出名称</th>
              <th>类型</th>
              <th>场地</th>
              <th>时间</th>
              <th>售票</th>
              <th>状态</th>
              <th>链条ID</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>加载中...</td></tr>
            ) : performances.length === 0 ? (
              <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon">🎭</div><div>暂无演出数据</div></div></td></tr>
            ) : (
              performances.map(perf => (
                <tr key={perf.id}>
                  <td style={{ fontWeight: 500 }}>{perf.title}</td>
                  <td>{perf.type}</td>
                  <td>{perf.venue}</td>
                  <td>
                    <div>{dayjs(perf.startTime).format('MM-DD HH:mm')}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{perf.duration}分钟</div>
                  </td>
                  <td>
                    <div>{perf.soldSeats}/{perf.totalSeats}</div>
                    <div style={{ width: 80, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${(perf.soldSeats/perf.totalSeats)*100}%`, 
                        height: '100%', 
                        background: '#3b82f6' 
                      }}/>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${perf.status}`}>
                      {statusNames[perf.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{perf.chainId}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm">查看</button>
                      <button className="btn btn-secondary btn-sm">链条</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Performances;
