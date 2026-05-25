import { useState } from 'react';
import dayjs from 'dayjs';
import { taskApi, orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TaskModal = ({ task, onClose, onComplete }) => {
  const { user } = useAuth();
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);

  if (!task) return null;

  const taskTypeNames = {
    schedule_approval: '排期审批',
    ticket_group: '团单处理',
    refund_request: '退票申请',
    rehearsal_arrangement: '排练安排',
    schedule_change: '排期变更',
    settlement: '费用结算'
  };

  const statusNames = {
    pending: '待处理',
    in_progress: '处理中',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成'
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (task.type === 'refund_request') {
        await orderApi.processRefund(task.id, true, remark);
      } else {
        await taskApi.approve(task.id, remark);
      }
      setRefundResult('approved');
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remark.trim()) {
      alert('请填写拒绝原因');
      return;
    }
    setLoading(true);
    try {
      if (task.type === 'refund_request') {
        await orderApi.processRefund(task.id, false, remark);
      } else {
        await taskApi.reject(task.id, remark);
      }
      setRefundResult('rejected');
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await taskApi.complete(task.id, remark);
      onComplete();
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getActionButtons = () => {
    if (task.status === 'approved' || task.status === 'rejected' || task.status === 'completed') {
      return null;
    }

    if (task.type === 'schedule_approval' || task.type === 'refund_request' || task.type === 'schedule_change') {
      return (
        <>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? '处理中...' : '拒绝'}
          </button>
          <button 
            className="btn btn-success btn-sm" 
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? '处理中...' : '通过'}
          </button>
        </>
      );
    }

    return (
      <button 
        className="btn btn-success btn-sm" 
        onClick={handleComplete}
        disabled={loading}
      >
        {loading ? '处理中...' : '标记完成'}
      </button>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>任务详情</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {refundResult && (
            <div style={{
              padding: 12,
              background: refundResult === 'approved' ? '#dcfce7' : '#fee2e2',
              color: refundResult === 'approved' ? '#166534' : '#b91c1c',
              borderRadius: 8,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {refundResult === 'approved' ? '✅ 已通过' : '❌ 已拒绝'}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>{task.title}</h4>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748b' }}>
              <span>类型: {taskTypeNames[task.type] || task.type}</span>
              <span>状态: <span className={`status-badge status-${task.status}`}>{statusNames[task.status]}</span></span>
              <span>优先级: {task.priority === 'urgent' ? '紧急' : task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <h5 style={{ marginBottom: 8 }}>任务描述</h5>
            <p style={{ fontSize: 14, color: '#475569' }}>{task.description}</p>
          </div>

          {task.refundAmount && (
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ marginBottom: 8 }}>退票信息</h5>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>退票金额</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>¥{task.refundAmount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>退票原因</div>
                  <div style={{ fontSize: 14 }}>{task.refundReason}</div>
                </div>
              </div>
            </div>
          )}

          {task.proposedSchedule && (
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ marginBottom: 8 }}>拟议排期</h5>
              <div style={{ padding: 12, background: '#dbeafe', borderRadius: 6, fontSize: 14 }}>
                {task.proposedSchedule.date} {task.proposedSchedule.time} @ {task.proposedSchedule.venue}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
              处理备注
            </label>
            <textarea
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                minHeight: 80,
                fontSize: 14,
                resize: 'vertical'
              }}
              placeholder="请输入处理备注..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          {task.history && task.history.length > 0 && (
            <div className="task-history">
              <h5>处理记录</h5>
              {task.history.map((h, i) => (
                <div key={i} className="history-item">
                  <div className="history-time">{dayjs(h.timestamp).format('MM-DD HH:mm')}</div>
                  <div className="history-action">
                    <div>{h.action === 'created' ? '创建任务' : h.action}</div>
                    {h.remark && <div className="history-remark">{h.remark}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>关闭</button>
          {getActionButtons()}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
