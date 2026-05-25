import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feedbackApi } from '../api';

const STATUS_LABELS = {
  draft: '草稿',
  submitted: '已提交',
  reviewed: '已审核',
  escalated: '已升级'
};

const Feedbacks = () => {
  const { hasRole } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const res = await feedbackApi.list(filters);
      setFeedbacks(res.data.data || []);
    } catch (error) {
      console.error('Load feedbacks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    if (confirm('确定提交该反馈？')) {
      try {
        await feedbackApi.submit(id);
        loadData();
      } catch (error) {
        alert('提交失败');
      }
    }
  };

  const handleReview = async (id) => {
    const notes = prompt('请输入审核意见:');
    if (notes !== null) {
      try {
        await feedbackApi.review(id, { reviewNotes: notes });
        loadData();
      } catch (error) {
        alert('审核失败');
      }
    }
  };

  const handleEscalate = async (id) => {
    if (confirm('确定升级该反馈？')) {
      try {
        await feedbackApi.escalate(id);
        loadData();
      } catch (error) {
        alert('升级失败');
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>渠道反馈列表</h3>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>反馈单号</th>
                <th>图书</th>
                <th>渠道</th>
                <th>实收数量</th>
                <th>销售预期</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(fb => (
                <tr key={fb.id}>
                  <td><code>{fb.feedbackNo}</code></td>
                  <td>{fb.SampleShipment?.Book?.title}</td>
                  <td>{fb.SampleShipment?.Channel?.name}</td>
                  <td>{fb.receivedQuantity}本</td>
                  <td>{fb.salesExpectation || '-'}</td>
                  <td>
                    <span className={`status-badge status-${fb.status}`}>
                      {STATUS_LABELS[fb.status]}
                    </span>
                  </td>
                  <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {hasRole('channel_manager') && fb.status === 'draft' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(fb.id)}>
                          提交
                        </button>
                      )}
                      {hasRole('distribution_specialist') && fb.status === 'submitted' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleReview(fb.id)}>
                            审核
                          </button>
                          <button className="btn btn-warning btn-sm" onClick={() => handleEscalate(fb.id)}>
                            升级
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Feedbacks;
