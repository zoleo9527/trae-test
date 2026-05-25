import { useState, useEffect } from 'react';
import { performanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const ChainView = () => {
  const { user } = useAuth();
  const [performances, setPerformances] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [chainDetail, setChainDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformances();
  }, []);

  const loadPerformances = async () => {
    try {
      setLoading(true);
      const res = await performanceApi.getAll();
      setPerformances(res.data);
      if (res.data.length > 0) {
        selectChain(res.data[0].chainId);
      }
    } catch (err) {
      console.error('加载演出失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectChain = async (chainId) => {
    setSelectedChain(chainId);
    try {
      const res = await performanceApi.getChain(chainId);
      setChainDetail(res.data);
    } catch (err) {
      console.error('加载链条详情失败:', err);
    }
  };

  const statusNames = {
    draft: '草稿',
    scheduled: '已排期',
    ticketing: '售票中',
    rehearsing: '联排中',
    completed: '已完成'
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>🔗 链条追踪</h2>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          演出排期 → 票务团单 → 后台联排 全链路追踪
        </p>
      </div>

      <div className="content-layout">
        <div style={{ flex: 1 }}>
          <div className="main-panel" style={{ padding: 0, marginBottom: 20 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>演出名称</th>
                  <th>状态</th>
                  <th>链条ID</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {performances.map(perf => (
                  <tr 
                    key={perf.chainId} 
                    onClick={() => selectChain(perf.chainId)}
                    style={{ 
                      cursor: 'pointer',
                      background: selectedChain === perf.chainId ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <td style={{ fontWeight: 500 }}>{perf.title}</td>
                    <td>
                      <span className={`status-badge status-${perf.status}`}>
                        {statusNames[perf.status]}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{perf.chainId}</td>
                    <td style={{ fontSize: 13 }}>{dayjs(perf.startTime).format('MM-DD HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chainDetail && (
            <div className="main-panel">
              <h3 className="panel-title">📊 链路详情 - {chainDetail.performance?.title}</h3>
              {user?.role !== 'theater_manager' && (
                <div style={{ 
                  background: '#f0f9ff', 
                  padding: 10, 
                  borderRadius: 6, 
                  marginBottom: 16, 
                  fontSize: 13,
                  color: '#0369a1'
                }}>
                  ⚠️ 仅显示与您职责相关的数据，全局查看权限仅限剧院经理
                </div>
              )}
              
              <div className="chain-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot active"></div>
                  <div className="timeline-content">
                    <h4>🎭 演出排期</h4>
                    <div style={{ fontSize: 14, color: '#475569' }}>
                      <p><strong>{chainDetail.performance?.title}</strong></p>
                      <p>📍 {chainDetail.performance?.venue}</p>
                      <p>🕐 {dayjs(chainDetail.performance?.startTime).format('YYYY-MM-DD HH:mm')}</p>
                      <p>🎫 售票: {chainDetail.performance?.soldSeats}/{chainDetail.performance?.totalSeats} 张</p>
                      <p>📝 备注: {chainDetail.performance?.remarks || '-'}</p>
                    </div>
                  </div>
                </div>

                {(user?.role === 'theater_manager' || user?.role === 'ticket_supervisor') && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: chainDetail.orders?.length > 0 ? '#3b82f6' : '#e2e8f0' }}></div>
                    <div className="timeline-content">
                      <h4>🎫 票务团单 ({chainDetail.orders?.length || 0})</h4>
                      {chainDetail.orders?.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>暂无团单</p>
                      ) : (
                        <div style={{ fontSize: 14, color: '#475569' }}>
                          {chainDetail.orders.map(order => (
                            <div key={order.id} style={{ 
                              padding: 12, 
                              background: 'white', 
                              borderRadius: 6, 
                              marginBottom: 8,
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{order.groupName}</strong>
                                <span className={`status-badge status-${order.status}`}>{order.status}</span>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                {order.ticketCount}张 · ¥{order.totalAmount.toLocaleString()} · {order.contactPerson}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(user?.role === 'theater_manager' || user?.role === 'backend_coordinator') && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: chainDetail.rehearsals?.length > 0 ? '#3b82f6' : '#e2e8f0' }}></div>
                    <div className="timeline-content">
                      <h4>🎬 后台联排 ({chainDetail.rehearsals?.length || 0})</h4>
                      {chainDetail.rehearsals?.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>暂无联排安排</p>
                      ) : (
                        <div style={{ fontSize: 14, color: '#475569' }}>
                          {chainDetail.rehearsals.map(rehearsal => (
                            <div key={rehearsal.id} style={{ 
                              padding: 12, 
                              background: 'white', 
                              borderRadius: 6, 
                              marginBottom: 8,
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{rehearsal.title}</strong>
                                <span className={`status-badge status-${rehearsal.status === 'in_progress' ? 'rehearsing' : rehearsal.status}`}>
                                  {rehearsal.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                {dayjs(rehearsal.startTime).format('MM-DD HH:mm')} · {rehearsal.venue}
                              </div>
                              {rehearsal.issuesReported?.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  {rehearsal.issuesReported.map(issue => (
                                    <div key={issue.id} className={`issue-item ${issue.status}`} style={{ fontSize: 12, padding: 8 }}>
                                      <div className="issue-header">
                                        <span>{issue.content}</span>
                                        <span className={`issue-status ${issue.status}`}>
                                          {issue.status === 'pending' ? '待处理' : '已解决'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: chainDetail.tasks?.length > 0 ? '#3b82f6' : '#e2e8f0' }}></div>
                  <div className="timeline-content">
                    <h4>📋 相关任务 ({chainDetail.tasks?.length || 0})</h4>
                    {chainDetail.tasks?.length === 0 ? (
                      <p style={{ color: '#94a3b8' }}>暂无相关任务</p>
                    ) : (
                      <div style={{ fontSize: 14, color: '#475569' }}>
                        {chainDetail.tasks.map(task => (
                          <div key={task.id} style={{ 
                            padding: 12, 
                            background: 'white', 
                            borderRadius: 6, 
                            marginBottom: 8,
                            borderLeft: `4px solid ${
                              task.priority === 'urgent' ? '#ef4444' :
                              task.priority === 'high' ? '#f97316' :
                              task.priority === 'medium' ? '#eab308' : '#22c55e'
                            }`,
                            paddingLeft: 12
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{task.title}</strong>
                              <span className={`status-badge status-${task.status}`}>{task.status}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                              {task.type} · 截止: {dayjs(task.dueDate).format('MM-DD HH:mm')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChainView;
