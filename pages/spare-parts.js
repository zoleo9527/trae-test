import { useState, useEffect } from 'react';
import withAuth from '../hoc/withAuth';
import { api } from '../utils/api';

const stockStatusColors = {
  normal: 'bg-green-100 text-green-700',
  low: 'bg-yellow-100 text-yellow-700',
  out: 'bg-red-100 text-red-700',
};

function SpareParts() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState(null);
  const [filter, setFilter] = useState({ category: '', lowStock: false, keyword: '' });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.lowStock) params.lowStock = 'true';
      if (filter.keyword) params.keyword = filter.keyword;

      const [partsRes, alertsRes] = await Promise.all([
        api.spareParts.list(params),
        api.spareParts.getLowStockAlerts(),
      ]);

      setParts(partsRes);
      setLowStockAlerts(alertsRes);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (part) => {
    if (part.stock === 0) return { status: 'out', label: '缺货' };
    if (part.stock <= part.minStock) return { status: 'low', label: '库存低' };
    return { status: 'normal', label: '正常' };
  };

  const categories = [...new Set(parts.map(p => p.category))];

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">备件管理</h2>
          <p className="text-sm text-gray-500">管理备件库存与领用记录</p>
        </div>
      </div>

      {lowStockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <span>⚠️</span>
            <span className="font-medium">库存预警</span>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              {lowStockAlerts.length} 项
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockAlerts.map((part) => (
              <span key={part.id} className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                {part.name}：剩余 {part.stock} {part.unit}（最低 {part.minStock}）
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="搜索备件名称或型号..."
              value={filter.keyword}
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2">
            <input
              type="checkbox"
              checked={filter.lowStock}
              onChange={(e) => setFilter({ ...filter, lowStock: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-600">仅看低库存</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-300px)]">
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-spin">⚙️</div>
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto h-full scrollbar-thin">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备件名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">型号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parts.map((part) => {
                    const stockStatus = getStockStatus(part);
                    return (
                      <tr
                        key={part.id}
                        onClick={() => setSelectedPart(part)}
                        className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                          selectedPart?.id === part.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{part.name}</div>
                          <div className="text-xs text-gray-400">{part.id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{part.model}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{part.category}</td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${stockStatus.status === 'out' ? 'text-red-600' : stockStatus.status === 'low' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {part.stock} {part.unit}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">/ {part.minStock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${stockStatusColors[stockStatus.status]}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{part.location}</td>
                      </tr>
                    );
                  })}
                  {parts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        <p className="text-4xl mb-2">📦</p>
                        <p>暂无备件</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedPart && (
          <div className="w-80 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">备件详情</h3>
              <button onClick={() => setSelectedPart(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 text-lg">{selectedPart.name}</h4>
                <p className="text-sm text-gray-500 font-mono">{selectedPart.model}</p>
              </div>

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">分类</span>
                  <span>{selectedPart.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前库存</span>
                  <span className="font-medium">{selectedPart.stock} {selectedPart.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最低库存</span>
                  <span>{selectedPart.minStock} {selectedPart.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">存放位置</span>
                  <span>{selectedPart.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">单价</span>
                  <span>¥{selectedPart.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最近采购</span>
                  <span>{selectedPart.lastPurchase}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">库存状态</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${stockStatusColors[getStockStatus(selectedPart).status]}`}>
                    {getStockStatus(selectedPart).label}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      getStockStatus(selectedPart).status === 'normal' ? 'bg-green-500' :
                      getStockStatus(selectedPart).status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((selectedPart.stock / selectedPart.minStock / 2) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(SpareParts);
