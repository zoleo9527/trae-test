import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatRelativeTime, formatDateTime } from '../utils/format';

const MODULE_NAMES = {
  auth: '认证',
  stock_take: '库存盘点',
  loss_report: '损耗报告',
  inventory: '库存',
  product: '产品',
  price: '价格'
};

const OPERATION_NAMES = {
  login: '登录',
  create: '创建',
  start: '开始',
  complete: '完成',
  review: '审核',
  approve: '审批',
  adjust: '调整'
};

export default function OperationLogs({ user }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [moduleFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (moduleFilter) params.module = moduleFilter;
      params.limit = 100;
      const data = await api.operationLogs.list(params);
      setLogs(data);
    } catch (err) {
      console.error('加载操作日志失败:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setModuleFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !moduleFilter
                ? 'bg-tea-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            全部
          </button>
          {Object.entries(MODULE_NAMES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setModuleFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                moduleFilter === key
                  ? 'bg-tea-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>操作时间</th>
                <th>操作人</th>
                <th>模块</th>
                <th>操作</th>
                <th>操作内容</th>
                <th>变更记录</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">加载中...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">暂无操作日志</td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="text-gray-800">{formatRelativeTime(log.created_at)}</div>
                      <div className="text-xs text-gray-400">{formatDateTime(log.created_at)}</div>
                    </td>
                    <td className="font-medium text-gray-800">{log.operator_name}</td>
                    <td>
                      <span className="badge badge-info">
                        {MODULE_NAMES[log.module] || log.module}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {OPERATION_NAMES[log.operation] || log.operation}
                      </span>
                    </td>
                    <td className="text-gray-600">{log.content}</td>
                    <td>
                      {log.old_value && log.new_value ? (
                        <div className="text-sm">
                          <span className="text-gray-500 line-through">{log.old_value}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="text-tea-600 font-medium">{log.new_value}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
