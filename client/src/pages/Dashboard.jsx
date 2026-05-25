import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { performanceApi, orderApi, rehearsalApi, taskApi } from '../services/api';
import TaskPanel from '../components/TaskPanel';
import TaskModal from '../components/TaskModal';
import dayjs from 'dayjs';

const Dashboard = () => {
  const { user } = useAuth();
  const { refreshCounts } = useOutletContext();
  const [stats, setStats] = useState({});
  const [recentPerformances, setRecentPerformances] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [perfRes, tasksRes] = await Promise.all([
        performanceApi.getAll(),
        taskApi.getMy()
      ]);
      
      const pendingTasks = tasksRes.data.filter(t => t.status === 'pending' || t.status === 'in_progress');
      const upcoming = perfRes.data
        .filter(p => new Date(p.startTime) > new Date())
        .slice(0, 3);

      setStats({
        totalPerformances: perfRes.data.length,
        pendingTasks: pendingTasks.length,
        overdueTasks: pendingTasks.filter(t => new Date(t.dueDate) < new Date()).length,
        upcomingPerformances: upcoming.length
      });
      
      setRecentPerformances(upcoming);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  const handleTaskComplete = () => {
    setSelectedTask(null);
    setTaskRefreshKey(k => k + 1);
    refreshCounts();
    loadDashboard();
  };

  const roleGreeting = {
    theater_manager: '欢迎回来，经理',
    ticket_supervisor: '欢迎回来，票务主管',
    backend_coordinator: '欢迎回来，后台统筹'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{roleGreeting[user?.role] || '工作台'}</h2>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            {dayjs().format('YYYY年MM月DD日')} 今日共有 {stats.pendingTasks || 0} 项待处理任务
          </p>
        </div>
      </div>

      <div className="content-layout">
        <div style={{ flex: 1 }}>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalPerformances || 0}</div>
              <div className="stat-label">演出排期</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#f97316' }}>{stats.pendingTasks || 0}</div>
              <div className="stat-label">待处理任务</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#ef4444' }}>{stats.overdueTasks || 0}</div>
              <div className="stat-label">已超时任务</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#22c55e' }}>{stats.upcomingPerformances || 0}</div>
              <div className="stat-label">即将上演</div>
            </div>
          </div>

          <div className="main-panel">
            <h3 className="panel-title">📅 近期演出排期</h3>
            {recentPerformances.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎭</div>
                <div>暂无近期演出</div>
              </div>
            ) : (
              recentPerformances.map(perf => (
                <div key={perf.id} className="performance-card">
                  <div className="performance-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <h3 className="performance-title">{perf.title}</h3>
                      <span className={`status-badge status-${perf.status}`}>
                        {perf.status === 'scheduled' ? '已排期' : 
                         perf.status === 'ticketing' ? '售票中' :
                         perf.status === 'rehearsing' ? '联排中' : perf.status}
                      </span>
                    </div>
                    <div className="performance-meta">
                      <span>📍 {perf.venue}</span>
                      <span>🕐 {dayjs(perf.startTime).format('MM月DD日 HH:mm')}</span>
                      <span>🎫 {perf.soldSeats}/{perf.totalSeats} 张</span>
                      <span>🔗 {perf.chainId}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="side-panel">
          <TaskPanel 
            onTaskClick={setSelectedTask} 
            refreshKey={taskRefreshKey}
          />
          
          <div className="task-panel">
            <h3 className="panel-title">💡 快速操作</h3>
            <div className="quick-actions">
              {user?.role === 'theater_manager' && (
                <>
                  <button className="btn btn-primary btn-sm">+ 新增演出</button>
                </>
              )}
              {user?.role === 'ticket_supervisor' && (
                <>
                  <button className="btn btn-primary btn-sm">+ 新增团单</button>
                  <button className="btn btn-secondary btn-sm">批量导出</button>
                </>
              )}
              {user?.role === 'backend_coordinator' && (
                <>
                  <button className="btn btn-primary btn-sm">+ 安排联排</button>
                  <button className="btn btn-secondary btn-sm">场地查看</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)}
        onComplete={handleTaskComplete}
      />
    </div>
  );
};

export default Dashboard;
