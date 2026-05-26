import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  LOSS_STATUS,
  LOSS_TYPES,
  RESPONSIBILITY_TYPES,
  formatRelativeTime
} from '../utils/format';

export default function LossReportDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.lossReports.get(id);
      setData(result);
    } catch (err) {
      console.error('加载损耗报告失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const canReview = user.role === 'manager' || user.role === 'warehouse';
  const canApprove = user.role === 'manager';

  async function handleReview() {
    if (!confirm('确定要审核通过吗？')) return;
    try {
      await api.lossReports.review(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApprove() {
    if (!confirm('确定要审批通过吗？审批后将自动扣减库存。')) return;
    try {
      await api.lossReports.approve(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400">
        损耗报告不存在
      </div>
    );
  }

  const { report, items, logs } = data;
  const status = LOSS_STATUS[report.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/loss-reports')}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{report.title}</h1>
            <span className={`badge ${status.class}`}>{status.label}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">报告编号: {report.report_no}</p>
        </div>
        <div className="flex gap-2">
          {canReview && report.status === 'pending' && (
            <button onClick={handleReview} className="btn btn-primary">
              审核通过
            </button>
          )}
          {canApprove && report.status === 'reviewed' && (
            <button onClick={handleApprove} className="btn btn-success">
              审批通过
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">损耗类型</p>
          <p className="text-lg font-semibold text-gray-800">{LOSS_TYPES[report.loss_type]}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">仓库</p>
          <p className="text-lg font-semibold text-gray-800">{report.warehouse_name}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">损耗数量</p>
          <p className="text-lg font-semibold text-red-600">{formatNumber(report.total_quantity)} 件</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">损耗金额</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(report.total_amount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">上报人</p>
          <p className="text-base font-semibold text-gray-800">{report.reporter_name}</p>
          <p className="text-xs text-gray-400">{formatDateTime(report.reported_at)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">审核人</p>
          <p className="text-base font-semibold text-gray-800">{report.reviewer_name || '-'}</p>
          <p className="text-xs text-gray-400">{report.reviewed_at ? formatDateTime(report.reviewed_at) : '-'}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-1">审批人</p>
          <p className="text-base font-semibold text-gray-800">{report.approver_name || '-'}</p>
          <p className="text-xs text-gray-400">{report.approved_at ? formatDateTime(report.approved_at) : '-'}</p>
        </div>
      </div>

      {report.loss_reason && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">损耗原因</h3>
          </div>
          <div className="card-body">
            <p className="text-gray-600 whitespace-pre-wrap">{report.loss_reason}</p>
          </div>
        </div>
      )}

      {report.related_stock_take_id && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">关联盘点计划</h3>
          </div>
          <div className="card-body">
            <Link
              to={`/stock-take/${report.related_stock_take_id}`}
              className="text-tea-600 hover:text-tea-700 font-medium"
            >
              {report.related_plan_no} - 查看关联盘点 →
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-800">损耗明细</h3>
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-red-600">{items.length}</span> 项损耗
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>产品信息</th>
                <th>批次号</th>
                <th className="text-right">数量</th>
                <th className="text-right">单价</th>
                <th className="text-right">金额</th>
                <th>责任归属</th>
                <th>责任人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const respType = RESPONSIBILITY_TYPES[item.responsibility];
                return (
                  <tr key={idx}>
                    <td>
                      <div className="font-medium text-gray-800">{item.product_name}</div>
                      <div className="text-xs text-gray-500">{item.sku} · {item.spec}</div>
                    </td>
                    <td className="font-mono text-sm text-tea-600">{item.batch_no || '-'}</td>
                    <td className="text-right font-medium text-red-600">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td className="text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right font-medium text-red-600">{formatCurrency(item.amount)}</td>
                    <td>
                      <span className={`badge ${respType?.class || 'badge-gray'}`}>
                        {respType?.label || item.responsibility}
                      </span>
                    </td>
                    <td className="text-gray-600">{item.responsible_person_name || '-'}</td>
                    <td className="max-w-[200px]">
                      <span className="text-sm text-gray-500">{item.remark || '-'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {report.remark && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">备注</h3>
          </div>
          <div className="card-body">
            <p className="text-gray-600">{report.remark}</p>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-800">操作记录</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 bg-tea-100 rounded-full flex items-center justify-center shrink-0 text-sm">
                    {log.operator_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{log.operator_name}</span>
                      <span className="text-gray-500"> {log.content}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
