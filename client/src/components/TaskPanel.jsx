import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { taskApi } from '../services/api';

const TaskPanel = ({ onTaskClick, refreshKey }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all_active');

  useEffect(() => {
    loadTasks();
  }, [filter, refreshKey]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'all_active') params.active = 'true';
      if (filter === 'pending') params.status = 'pending';
      if (filter === 'in_progress') params.status = 'in_progress';
      const res = await taskApi.getMy(params);
      setTasks(res.data);
    } catch (err) {
      console.error('加载任务失败:', err);
    } finally {
      setLoading(false);
    }
  };

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
    rejected: '已退回',
    completed: '已完成'
  };

  const isOverdue = (task) => {
    return task.status !== 'completed' && 
           task.status !== 'approved' && 
           task.status !== 'rejected' &&
           dayjs(task.dueDate).isBefore(dayjs(), 'day');
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'background: #fef3c7; color: #92400e',
      in_progress: 'background: #dbeafe; color: #1d4ed8',
      approved: 'background: #dcfce7; color: #166534',
      rejected: 'background: #fee2e2; color: #b91c1c',
      completed: 'background: #e2e8f0; color: #475569'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="task-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="panel-title">📋 任务处理台</h3>
        <select 
          className="filter-select" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px' }}
        >
          <option value="all_active">全部活跃</option>
          <option value="pending">待处理</option>
          <option value="in_progress">处理中</option>
          <option value="all">全部历史</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px' }}>
          <div className="empty-state-icon">🎉</div>
          <div>暂无任务</div>
        </div>
      ) : (
        tasks.map(task => (
          <div
            key={task.id}
            className={`task-card ${task.priority}`}
            onClick={() => onTaskClick(task)}
          >
            <div className="task-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{task.title}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, ...getStatusBadge(task.status) }}>
                  {statusNames[task.status]}
                </span>
                {isOverdue(task) && (
                  <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>已超时</span>
                )}
              </div>
            </div>
            <div className="task-meta">
              <span>{taskTypeNames[task.type] || task.type}</span>
              <span>截止: {dayjs(task.dueDate).format('MM-DD HH:mm')}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TaskPanel;
