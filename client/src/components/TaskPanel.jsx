import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { taskApi } from '../services/api';

const TaskPanel = ({ onTaskClick, refreshKey }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [filter, refreshKey]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
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

  const isOverdue = (dueDate) => {
    return dayjs(dueDate).isBefore(dayjs(), 'day');
  };

  return (
    <div className="task-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="panel-title">📋 待处理任务</h3>
        <select 
          className="filter-select" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px' }}
        >
          <option value="all">全部</option>
          <option value="pending">待处理</option>
          <option value="in_progress">处理中</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px' }}>
          <div className="empty-state-icon">🎉</div>
          <div>暂无待处理任务</div>
        </div>
      ) : (
        tasks.map(task => (
          <div
            key={task.id}
            className={`task-card ${task.priority}`}
            onClick={() => onTaskClick(task)}
          >
            <div className="task-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{task.title}</span>
              {isOverdue(task.dueDate) && (
                <span style={{ color: '#ef4444', fontSize: 11 }}>已超时</span>
              )}
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
