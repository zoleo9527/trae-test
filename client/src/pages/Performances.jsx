import { useState, useEffect } from 'react';
import { performanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const Performances = () => {
  const { user } = useAuth();
  const [performances, setPerformances] = useState([]);
  const [filter, setFilter] = useState({ status: '', venue: '' });
  const [loading, setLoading] = useState(true);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedPerf, setSelectedPerf] = useState(null);
  const [changeForm, setChangeForm] = useState({ startTime: '', venue: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

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

  const canEdit = user?.role === 'theater_manager';

  const openChangeModal = (perf) => {
    setSelectedPerf(perf);
    setChangeForm({
      startTime: dayjs(perf.startTime).format('YYYY-MM-DDTHH:mm'),
      venue: perf.venue,
      reason: ''
    });
    setShowChangeModal(true);
  };

  const handleSubmitChange = async (e) => {
    e.preventDefault();
    if (!selectedPerf) return;
    
    try {
      setSubmitting(true);
      await performanceApi.update(selectedPerf.id, {
        startTime: new Date(changeForm.startTime).toISOString(),
        venue: changeForm.venue,
        changeReason: changeForm.reason || '排期调整'
      });
      setShowChangeModal(false);
      loadPerformances();
      alert('排期变更已提交，相关任务已通知票务和后台人员');
    } catch (err) {
      alert('变更失败: ' + err.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🎭 演出排期</h2>
        {canEdit && (
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
                      {canEdit && perf.status !== 'completed' && perf.status !== 'cancelled' && (
                        <button 
                          className="btn btn-warning btn-sm" 
                          onClick={() => openChangeModal(perf)}
                        >变更</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showChangeModal && selectedPerf && (
        <div className="modal-overlay" onClick={() => setShowChangeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>变更排期 - {selectedPerf.title}</h3>
              <button className="close-btn" onClick={() => setShowChangeModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitChange}>
              <div className="modal-body">
                <div className="form-group">
                  <label>演出时间</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={changeForm.startTime}
                    onChange={e => setChangeForm({...changeForm, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>演出场地</label>
                  <select 
                    className="form-control"
                    value={changeForm.venue}
                    onChange={e => setChangeForm({...changeForm, venue: e.target.value})}
                    required
                  >
                    <option value="主剧场">主剧场</option>
                    <option value="实验剧场">实验剧场</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>变更原因</label>
                  <textarea 
                    className="form-control"
                    value={changeForm.reason}
                    onChange={e => setChangeForm({...changeForm, reason: e.target.value})}
                    rows="3"
                    placeholder="请说明变更原因（可选，将记录在任务历史中）"
                  />
                </div>
                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  <strong>⚠️ 系统提示：</strong>
                  <div>变更后将自动通知：</div>
                  <div>• 票务主管 - 确认并通知相关团单</div>
                  <div>• 后台统筹 - 调整联排时间和场地</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowChangeModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认变更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performances;
