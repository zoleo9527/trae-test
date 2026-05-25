import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, shipmentApi } from '../api';
import Timeline from '../components/Timeline';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [channelStats, setChannelStats] = useState([]);
  const [bookStats, setBookStats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, channelRes, bookRes, timelineRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.channelStats(),
        dashboardApi.bookStats(),
        dashboardApi.timeline({ limit: 20 })
      ]);

      setStats(statsRes.data);
      setChannelStats(channelRes.data);
      setBookStats(bookRes.data);
      setTimeline(timelineRes.data);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  const getRoleSpecificMessage = () => {
    switch (user?.role) {
      case 'channel_manager':
        return '您负责的渠道反馈处理进度实时追踪，及时处理待确认的回执和待提交的反馈。';
      case 'distribution_specialist':
        return '统筹全渠道样书寄送进度，处理回执丢失、退货审批等异常情况。';
      case 'finance':
        return '监控对账进度，确保样书寄送与财务数据一致，及时处理口径差异。';
      default:
        return '';
    }
  };

  const getPendingTasks = () => {
    if (!stats) return [];
    const tasks = [];
    
    if (stats.pendingApprovals?.returns > 0) {
      tasks.push({ type: '退货审批', count: stats.pendingApprovals.returns, link: '/returns' });
    }
    if (stats.pendingApprovals?.feedbacks > 0) {
      tasks.push({ type: '反馈审核', count: stats.pendingApprovals.feedbacks, link: '/feedbacks' });
    }
    if (stats.issues?.receiptLost > 0) {
      tasks.push({ type: '回执丢失处理', count: stats.issues.receiptLost, link: '/issues' });
    }
    if (stats.pendingApprovals?.reconciliations > 0) {
      tasks.push({ type: '对账审批', count: stats.pendingApprovals.reconciliations, link: '/reconciliations' });
    }
    
    return tasks;
  };

  const pendingTasks = getPendingTasks();
  const maxQuantity = channelStats.length > 0 ? Math.max(...channelStats.map(s => s.totalQuantity), 1) : 1;

  return (
    <div>
      <div className="role-reminder">
        <strong>👋 欢迎，{user?.name}！</strong> {getRoleSpecificMessage()}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">本月寄送单数</div>
          <div className="value">{stats?.shipments?.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">寄送总数量</div>
          <div className="value">{stats?.shipments?.totalQuantity || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">寄送总金额</div>
          <div className="value">¥{(stats?.shipments?.totalAmount || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">渠道反馈数</div>
          <div className="value">{stats?.feedbacks?.total || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">退货数量</div>
          <div className="value">{stats?.returns?.totalQuantity || 0}</div>
        </div>
        <div className="stat-card" style={{ background: stats?.issues?.receiptLost > 0 ? '#fef2f2' : '' }}>
          <div className="label">回执丢失</div>
          <div className="value" style={{ color: stats?.issues?.receiptLost > 0 ? '#dc2626' : '' }}>
            {stats?.issues?.receiptLost || 0}
          </div>
        </div>
      </div>

      {pendingTasks.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>待处理事项</h3>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              {pendingTasks.map((task, index) => (
                <button 
                  key={index} 
                  className="btn btn-warning btn-sm"
                  onClick={() => navigate(task.link)}
                >
                  {task.type} ({task.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>渠道寄送分布</h3>
          </div>
          <div className="card-body">
            {channelStats.map((stat, index) => (
              <div key={index} className="chart-bar">
                <div className="label">{stat.Channel?.name?.slice(0, 4)}</div>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ width: `${(stat.totalQuantity / maxQuantity * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="value">{stat.totalQuantity}本</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>热门图书TOP5</h3>
          </div>
          <div className="card-body">
            {bookStats.slice(0, 5).map((stat, index) => (
              <div key={index} className="chart-bar">
                <div className="label">{stat.Book?.title?.slice(0, 6)}</div>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ width: `${(stat.totalQuantity / (bookStats[0]?.totalQuantity || 1) * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="value">{stat.totalQuantity}本</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>最近操作时间线</h3>
        </div>
        <div className="card-body">
          <Timeline data={timeline} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
