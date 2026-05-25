import React, { useState, useEffect } from 'react';
import { reconciliationApi, commonApi } from '../api';

const STATUS_LABELS = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  disputed: '有争议',
  finalized: '已最终确认'
};

const Reconciliations = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [channels, setChannels] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({ channelId: '', period: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reconRes, channelRes] = await Promise.all([
        reconciliationApi.list(),
        commonApi.channels()
      ]);
      setReconciliations(reconRes.data.data || []);
      setChannels(channelRes.data.data || []);
    } catch (error) {
      console.error('Load reconciliations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await reconciliationApi.generate(generateForm);
      setShowGenerateModal(false);
      loadData();
      alert('对账单生成成功');
    } catch (error) {
      alert('生成失败');
    }
  };

  const handleSubmit = async (id) => {
    if (confirm('确定提交审批？')) {
      try {
        await reconciliationApi.submit(id);
        loadData();
      } catch (error) {
        alert('提交失败');
      }
    }
  };

  const handleApprove = async (id) => {
    if (confirm('确定批准？')) {
      try {
        await reconciliationApi.approve(id);
        loadData();
      } catch (error) {
        alert('审批失败');
      }
    }
  };

  const handleFinalize = async (id) => {
    if (confirm('确定最终确认？此操作不可撤销。')) {
      try {
        await reconciliationApi.finalize(id);
        loadData();
      } catch (error) {
        alert('操作失败');
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
          <h3>对账管理</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowGenerateModal(true)}>
            + 生成对账单
          </button>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>对账单号</th>
                <th>期间</th>
                <th>渠道</th>
                <th>寄送</th>
                <th>确认</th>
                <th>退货</th>
                <th>回执丢失</th>
                <th>口径差异</th>
                <th>结余</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.map(recon => (
                <tr key={recon.id}>
                  <td><code>{recon.reconNo}</code></td>
                  <td>{recon.period}</td>
                  <td>{recon.Channel?.name}</td>
                  <td>{recon.totalShipped}</td>
                  <td>{recon.totalConfirmed}</td>
                  <td>{recon.totalReturned}</td>
                  <td style={{ color: recon.totalReceiptLost > 0 ? '#dc2626' : '' }}>
                    {recon.totalReceiptLost || 0}
                  </td>
                  <td style={{ color: recon.totalCaliberDiscrepancy > 0 ? '#f59e0b' : '' }}>
                    {recon.totalCaliberDiscrepancy || 0}
                  </td>
                  <td style={{ color: recon.balanceQuantity < 0 ? '#dc2626' : '#065f46', fontWeight: '600' }}>
                    {recon.balanceQuantity}
                  </td>
                  <td>
                    <span className={`status-badge status-${recon.status}`}>
                      {STATUS_LABELS[recon.status]}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {recon.status === 'draft' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(recon.id)}>
                          提交
                        </button>
                      )}
                      {recon.status === 'pending_approval' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(recon.id)}>
                          批准
                        </button>
                      )}
                      {recon.status === 'approved' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleFinalize(recon.id)}>
                          最终确认
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>生成对账单</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>选择渠道</label>
                  <select
                    value={generateForm.channelId}
                    onChange={(e) => setGenerateForm({ ...generateForm, channelId: e.target.value })}
                    required
                  >
                    <option value="">请选择渠道</option>
                    {channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>对账期间</label>
                  <input
                    type="month"
                    value={generateForm.period}
                    onChange={(e) => setGenerateForm({ ...generateForm, period: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">生成</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reconciliations;
