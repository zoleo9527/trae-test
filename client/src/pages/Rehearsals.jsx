import { useState, useEffect } from 'react';
import { rehearsalApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const Rehearsals = () => {
  const { user } = useAuth();
  const [rehearsals, setRehearsals] = useState([]);
  const [filter, setFilter] = useState({ status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRehearsals();
  }, [filter]);

  const loadRehearsals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      const res = await rehearsalApi.getAll(params);
      setRehearsals(res.data);
    } catch (err) {
      console.error('加载排练失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusNames = {
    scheduled: '已排期',
    in_progress: '进行中',
    completed: '已完成',
    delayed: '已延迟',
    cancelled: '已取消'
  };

  const typeNames = {
    technical: '技术联排',
    full: '带妆彩排',
    walkthrough: '走台'
  };

  return (
    <div>
      <div className="page-header">
        <h2>🎬 联排管理</h2>
        {user?.role === 'backend_coordinator' && (
          <button className="btn btn-primary btn-sm">+ 安排联排</button>
        )}
      </div>

      <div className="filter-bar">
        <select 
          className="filter-select" 
          value={filter.status} 
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="scheduled">已排期</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="main-panel" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>排练名称</th>
              <th>类型</th>
              <th>场地</th>
              <th>时间</th>
              <th>参与人员</th>
              <th>问题</th>
              <th>状态</th>
              <th>链条ID</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>加载中...</td></tr>
            ) : rehearsals.length === 0 ? (
              <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">🎬</div><div>暂无联排数据</div></div></td></tr>
            ) : (
              rehearsals.map(rehearsal => (
                <tr key={rehearsal.id}>
                  <td style={{ fontWeight: 500 }}>{rehearsal.title}</td>
                  <td>{typeNames[rehearsal.type] || rehearsal.type}</td>
                  <td>{rehearsal.venue}</td>
                  <td>
                    <div>{dayjs(rehearsal.startTime).format('MM-DD HH:mm')}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {dayjs(rehearsal.endTime).diff(dayjs(rehearsal.startTime), 'hour')}小时
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {rehearsal.participants?.slice(0, 2).join('、')}
                    {rehearsal.participants?.length > 2 && ` +${rehearsal.participants.length - 2}`}
                  </td>
                  <td>
                    {rehearsal.issuesReported?.length > 0 ? (
                      <span style={{ 
                        color: rehearsal.issuesReported.some(i => i.status === 'pending') ? '#ef4444' : '#22c55e' 
                      }}>
                        {rehearsal.issuesReported.filter(i => i.status === 'pending').length} 待处理
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${rehearsal.status === 'in_progress' ? 'rehearsing' : rehearsal.status}`}>
                      {statusNames[rehearsal.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{rehearsal.chainId}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm">查看</button>
                      {user?.role === 'backend_coordinator' && (
                        <button className="btn btn-secondary btn-sm">编辑</button>
                      )}
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

export default Rehearsals;
