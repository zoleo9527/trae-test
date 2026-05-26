import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  formatCurrency,
  formatDate,
  PRICE_TYPES,
  ADJUST_TYPES
} from '../utils/format';

export default function PriceAdjustments({ user }) {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.priceAdjustments.list(params);
      setAdjustments(data);
    } catch (err) {
      console.error('加载价格调整失败:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {[
            { value: '', label: '全部' },
            { value: 'active', label: '生效中' },
            { value: 'expired', label: '已过期' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-tea-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>产品信息</th>
                <th>调整类型</th>
                <th>价格类型</th>
                <th className="text-right">原价格</th>
                <th className="text-right">新价格</th>
                <th className="text-right">调整幅度</th>
                <th>生效日期</th>
                <th>失效日期</th>
                <th>状态</th>
                <th>审批人</th>
                <th>调整原因</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">加载中...</td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">暂无价格调整记录</td>
                </tr>
              ) : (
                adjustments.map((pa, idx) => {
                  const diff = pa.new_price - pa.old_price;
                  const diffPercent = ((diff / pa.old_price) * 100).toFixed(1);
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="font-medium text-gray-800">{pa.product_name}</div>
                        <div className="text-xs text-gray-500">{pa.sku}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{ADJUST_TYPES[pa.adjust_type]}</span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{PRICE_TYPES[pa.price_type]}</span>
                      </td>
                      <td className="text-right text-gray-500 line-through">
                        {formatCurrency(pa.old_price)}
                      </td>
                      <td className="text-right font-medium text-tea-600">
                        {formatCurrency(pa.new_price)}
                      </td>
                      <td className="text-right">
                        <span className={diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-gray-500'}>
                          {diff > 0 ? '+' : ''}{diffPercent}%
                        </span>
                      </td>
                      <td className="text-gray-600">{formatDate(pa.effective_date)}</td>
                      <td className="text-gray-600">{pa.expiry_date ? formatDate(pa.expiry_date) : '长期'}</td>
                      <td>
                        <span className={`badge ${pa.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                          {pa.status === 'active' ? '生效中' : '已过期'}
                        </span>
                      </td>
                      <td className="text-gray-600">{pa.approver_name}</td>
                      <td className="max-w-[180px]">
                        <span className="text-sm text-gray-500" title={pa.reason}>
                          {pa.reason}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card bg-tea-50 border-tea-200">
        <div className="card-body">
          <h3 className="font-semibold text-tea-800 mb-2">💡 价格管理说明</h3>
          <ul className="text-sm text-tea-700 space-y-1">
            <li>• <strong>活动价口径乱问题</strong>：系统通过价格调整记录完整追踪每一次价格变动，包括原价格、新价格、生效时间、失效时间和审批人</li>
            <li>• <strong>价格类型</strong>：支持基础定价、促销价、批发价、VIP价等多种价格类型，避免价格口径混淆</li>
            <li>• <strong>追溯性</strong>：所有价格调整均有记录，可随时查询历史价格和调整原因</li>
            <li>• <strong>权限控制</strong>：仅经销负责人可查看和管理价格调整</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
