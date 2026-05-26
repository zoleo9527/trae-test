import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  formatRelativeTime,
  LOSS_TYPES,
  RESPONSIBILITY_TYPES,
  ROLE_NAMES
} from '../utils/format';

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [inventoryByCategory, setInventoryByCategory] = useState([]);
  const [inventoryByWarehouse, setInventoryByWarehouse] = useState([]);
  const [lossTrend, setLossTrend] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [summaryData, categoryData, warehouseData, trendData] = await Promise.all([
        api.dashboard.summary(),
        api.dashboard.inventoryByCategory(),
        api.dashboard.inventoryByWarehouse(),
        api.dashboard.lossTrend()
      ]);
      setSummary(summaryData);
      setInventoryByCategory(categoryData);
      setInventoryByWarehouse(warehouseData);
      setLossTrend(trendData);
    } catch (err) {
      console.error('加载看板数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const totalValue = inventoryByWarehouse.reduce((sum, w) => sum + (w.total_value || 0), 0);
  const maxWarehouseValue = Math.max(...inventoryByWarehouse.map(w => w.total_value || 0), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/inventory" className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">库存总价值</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-gray-400 mt-2">
                {summary?.totalInventory?.product_count || 0} 个品类 · {formatNumber(summary?.totalInventory?.total_quantity || 0)} 件
              </p>
            </div>
            <div className="w-12 h-12 bg-tea-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-tea-200 transition-colors">
              💰
            </div>
          </div>
        </Link>

        <Link to="/inventory" className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">低库存预警</p>
              <p className="text-2xl font-bold text-orange-600">{summary?.lowStock || 0}</p>
              <p className="text-xs text-gray-400 mt-2">库存数量低于 20 件</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-orange-200 transition-colors">
              ⚠️
            </div>
          </div>
        </Link>

        <Link to="/inventory" className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">临期预警</p>
              <p className="text-2xl font-bold text-red-600">{summary?.expiring || 0}</p>
              <p className="text-xs text-gray-400 mt-2">6个月内即将到期</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-red-200 transition-colors">
              📅
            </div>
          </div>
        </Link>

        <Link to="/loss-reports" className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">本月损耗金额</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.thisMonthLoss?.total_amount || 0)}</p>
              <p className="text-xs text-gray-400 mt-2">
                {formatNumber(summary?.thisMonthLoss?.total_quantity || 0)} 件 · {summary?.pendingLoss || 0} 份待处理
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-red-200 transition-colors">
              📉
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { key: 'overview', label: '待办事项' },
              { key: 'activities', label: '最近动态' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? 'border-tea-600 text-tea-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-800">待处理盘点</h3>
                  <Link to="/stock-take?status=pending" className="text-sm text-tea-600 hover:text-tea-700">
                    查看全部 →
                  </Link>
                </div>
                <div className="card-body">
                  {summary?.pendingTake > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          ✅
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{summary.pendingTake} 个盘点计划待处理</p>
                          <p className="text-sm text-gray-500">包括待执行和进行中</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">🎉</div>
                      <p>暂无待处理盘点</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-800">待审核损耗</h3>
                  <Link to="/loss-reports?status=pending" className="text-sm text-tea-600 hover:text-tea-700">
                    查看全部 →
                  </Link>
                </div>
                <div className="card-body">
                  {summary?.pendingLoss > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          📝
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{summary.pendingLoss} 份损耗报告待审核</p>
                          <p className="text-sm text-gray-500">请及时处理</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">✅</div>
                      <p>暂无待审核损耗</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  {summary?.recentActivities?.length > 0 ? (
                    summary.recentActivities.map((log, idx) => (
                      <div key={idx} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-8 h-8 bg-tea-100 rounded-full flex items-center justify-center shrink-0 text-sm">
                          {log.operator_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">{log.operator_name}</span>
                            <span className="text-gray-500"> {log.content}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(log.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      暂无操作记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-800">库存分类占比</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {inventoryByCategory.map((cat, idx) => {
                  const percent = totalValue > 0 ? ((cat.total_value / totalValue) * 100).toFixed(1) : 0;
                  const colors = ['bg-tea-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-700">{cat.category}</span>
                        <span className="text-gray-500">{formatCurrency(cat.total_value)} · {percent}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-800">各仓库存价值</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {inventoryByWarehouse.map((wh, idx) => {
                  const percent = maxWarehouseValue > 0 ? ((wh.total_value / maxWarehouseValue) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-700 font-medium">{wh.name}</span>
                        <span className="text-tea-600 font-semibold">{formatCurrency(wh.total_value)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-tea-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">{wh.product_count} 品</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-800">损耗类型分布</h3>
            </div>
            <div className="card-body">
              {summary?.lossByType?.length > 0 ? (
                <div className="space-y-3">
                  {summary.lossByType.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{LOSS_TYPES[item.loss_type] || item.loss_type}</p>
                        <p className="text-xs text-gray-500">{item.report_count} 次报告</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(item.total_amount)}</p>
                        <p className="text-xs text-gray-500">{formatNumber(item.total_quantity)} 件</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  暂无损耗数据
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-800">责任归属统计</h3>
            </div>
            <div className="card-body">
              {summary?.lossByResponsibility?.length > 0 ? (
                <div className="space-y-3">
                  {summary.lossByResponsibility.map((item, idx) => {
                    const type = RESPONSIBILITY_TYPES[item.responsibility];
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${type?.class || 'badge-gray'}`}>{type?.label || item.responsibility}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-gray-800">{formatCurrency(item.total_amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  暂无责任归属数据
                </div>
              )}
            </div>
          </div>

          {lossTrend?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-800">近6个月损耗趋势</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {lossTrend.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{formatNumber(item.total_quantity)}件</span>
                        <span className="font-medium text-red-600">{formatCurrency(item.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
