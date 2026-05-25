import { useState, useEffect } from 'react';
import { rehearsalApi, performanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const Rehearsals = () => {
  const { user } = useAuth();
  const [rehearsals, setRehearsals] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [filter, setFilter] = useState({ status: '' });
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState(null);
  const [issueForm, setIssueForm] = useState({ content: '' });
  const [arrangementForm, setArrangementForm] = useState({ performanceId: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRehearsals();
    loadPerformances();
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

  const loadPerformances = async () => {
    try {
      const res = await performanceApi.getAll();
      setPerformances(res.data);
    } catch (err) {
      console.error('加载演出失败:', err);
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

  const canReportIssue = user?.role === 'theater_manager' || user?.role === 'backend_coordinator';
  const canRequestArrangement = user?.role === 'theater_manager' || user?.role === 'ticket_supervisor';
  const isBackendCoordinator = user?.role === 'backend_coordinator';

  const openIssueModal = (rehearsal) => {
    setSelectedRehearsal(rehearsal);
    setIssueForm({ content: '' });
    setShowIssueModal(true);
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!selectedRehearsal) return;
    
    if (!issueForm.content.trim()) {
      alert('请填写问题描述');
      return;
    }
    
    try {
      setSubmitting(true);
      await rehearsalApi.reportIssue(selectedRehearsal.id, issueForm.content);
      setShowIssueModal(false);
      loadRehearsals();
      alert('问题已上报，后台统筹将尽快处理');
    } catch (err) {
      alert('提交失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const openArrangementModal = () => {
    setArrangementForm({ performanceId: performances[0]?.id || '', description: '' });
    setShowArrangementModal(true);
  };

  const handleSubmitArrangement = async (e) => {
    e.preventDefault();
    
    if (!arrangementForm.performanceId) {
      alert('请选择演出');
      return;
    }
    if (!arrangementForm.description.trim()) {
      alert('请填写联排安排说明');
      return;
    }
    
    try {
      setSubmitting(true);
      await rehearsalApi.requestArrangement(
        arrangementForm.performanceId, 
        arrangementForm.description
      );
      setShowArrangementModal(false);
      alert('联排安排申请已提交，后台统筹将尽快安排');
    } catch (err) {
      alert('提交失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🎬 联排管理</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {canRequestArrangement && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={openArrangementModal}
            >申请联排</button>
          )}
          {isBackendCoordinator && (
            <button className="btn btn-primary btn-sm">+ 安排联排</button>
          )}
        </div>
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
                      {canReportIssue && rehearsal.status !== 'completed' && rehearsal.status !== 'cancelled' && (
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => openIssueModal(rehearsal)}
                        >上报问题</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showIssueModal && selectedRehearsal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上报问题 - {selectedRehearsal.title}</h3>
              <button className="close-btn" onClick={() => setShowIssueModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitIssue}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>联排时间:</span>
                    <span>{dayjs(selectedRehearsal.startTime).format('MM-DD HH:mm')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>联排场地:</span>
                    <span>{selectedRehearsal.venue}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>问题描述</label>
                  <textarea 
                    className="form-control"
                    value={issueForm.content}
                    onChange={e => setIssueForm({...issueForm, content: e.target.value})}
                    rows="4"
                    placeholder="请详细描述遇到的问题，例如：灯光故障、音响问题、演员缺席等"
                    required
                  />
                </div>

                <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  <strong>⚠️ 注意：</strong>
                  <div>• 问题将同步给后台统筹处理</div>
                  <div>• 处理结果将通过系统通知告知</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>取消</button>
                <button type="submit" className="btn btn-warning" disabled={submitting}>
                  {submitting ? '提交中...' : '提交问题'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showArrangementModal && (
        <div className="modal-overlay" onClick={() => setShowArrangementModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请联排安排</h3>
              <button className="close-btn" onClick={() => setShowArrangementModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitArrangement}>
              <div className="modal-body">
                <div className="form-group">
                  <label>关联演出</label>
                  <select 
                    className="form-control"
                    value={arrangementForm.performanceId}
                    onChange={e => setArrangementForm({...arrangementForm, performanceId: e.target.value})}
                    required
                  >
                    <option value="">请选择演出</option>
                    {performances.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>安排说明</label>
                  <textarea 
                    className="form-control"
                    value={arrangementForm.description}
                    onChange={e => setArrangementForm({...arrangementForm, description: e.target.value})}
                    rows="4"
                    placeholder="请说明联排需求，例如：需要技术联排、预计2小时、需要灯光音响支持等"
                    required
                  />
                </div>

                <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  <strong>ℹ️ 说明：</strong>
                  <div>• 申请将由后台统筹审核并安排具体时间</div>
                  <div>• 安排结果将通过系统通知告知</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowArrangementModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rehearsals;
