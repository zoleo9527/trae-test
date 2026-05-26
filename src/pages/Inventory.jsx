import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  truncateText
} from '../utils/format';

export default function Inventory({ user }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [filters, setFilters] = useState({
    warehouseId: '',
    lowStock: false,
    expiringSoon: false,
    keyword: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  async function loadData() {
    setLoading(true);
    try {
      const [warehousesData] = await Promise.all([api.warehouses.list()]);
      setWarehouses(warehousesData);

      if (activeTab === 'summary') {
        const params = {};
        if (filters.warehouseId) params.warehouseId = filters.warehouseId;
        if (filters.lowStock) params.lowStock = 'true';
        const data = await api.inventory.list(params);
        let filtered = data;
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase();
          filtered = data.filter(i =>
            i.name.toLowerCase().includes(kw) ||
            i.sku.toLowerCase().includes(kw)
          );
        }
        setInventory(filtered);
      } else {
        const params = {};
        if (filters.warehouseId) params.warehouseId = filters.warehouseId;
        if (filters.expiringSoon) params.expiringSoon = 'true';
        const data = await api.inventory.batches(params);
        let filtered = data;
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase();
          filtered = data.filter(b =>
            b.product_name.toLowerCase().includes(kw) ||
            b.batch_no.toLowerCase().includes(kw) ||
            b.sku.toLowerCase().includes(kw)
          );
        }
        setBatches(filtered);
      }
    } catch (err) {
      console.error('加载库存数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-tea-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            库存汇总
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'batches'
                ? 'bg-tea-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            批次明细
          </button>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="搜索产品名称/SKU..."
            className="input input-sm w-full sm:w-64"
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
          />
          <select
            className="input input-sm w-full sm:w-auto"
            value={filters.warehouseId}
            onChange={e => setFilters({ ...filters, warehouseId: e.target.value })}
          >
            <option value="">全部仓库</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={e => setFilters({ ...filters, lowStock: e.target.checked })}
              className="rounded text-tea-600 focus:ring-tea-500"
            />
            <span className="text-sm text-gray-600">低库存</span>
          </label>
          {activeTab === 'batches' && (
            <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filters.expiringSoon}
                onChange={e => setFilters({ ...filters, expiringSoon: e.target.checked })}
                className="rounded text-tea-600 focus:ring-tea-500"
              />
              <span className="text-sm text-gray-600">临期</span>
            </label>
          )}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          {activeTab === 'summary' ? (
            <table className="table">
              <thead>
                <tr>
                  <th>产品信息</th>
                  <th>分类</th>
                  <th>规格</th>
                  <th>仓库</th>
                  <th className="text-right">库存数量</th>
                  <th className="text-right">库存价值</th>
                  <th className="text-right">参考单价</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">加载中...</td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">暂无库存数据</td>
                  </tr>
                ) : (
                  inventory.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="font-medium text-gray-800">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{item.category}</span>
                      </td>
                      <td className="text-gray-600">{item.spec}</td>
                      <td className="text-gray-600">{item.warehouse_name}</td>
                      <td className="text-right">
                        <span className={`font-medium ${item.total_quantity < 20 ? 'text-orange-600' : 'text-gray-800'}`}>
                          {formatNumber(item.total_quantity)} {item.unit}
                        </span>
                        {item.total_quantity < 20 && (
                          <div className="text-xs text-orange-500">库存偏低</div>
                        )}
                      </td>
                      <td className="text-right font-medium text-gray-800">
                        {formatCurrency(item.total_value)}
                      </td>
                      <td className="text-right text-gray-600">
                        {formatCurrency(item.base_price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>批次号</th>
                  <th>产品信息</th>
                  <th>仓库</th>
                  <th>生产日期</th>
                  <th>到期日期</th>
                  <th>入库单号</th>
                  <th className="text-right">可用库存</th>
                  <th className="text-right">批次价值</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">加载中...</td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">暂无批次数据</td>
                  </tr>
                ) : (
                  batches.map((batch, idx) => {
                    const daysToExpiry = batch.expiry_date
                      ? Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpiring = daysToExpiry !== null && daysToExpiry < 180;
                    
                    return (
                      <tr key={idx}>
                        <td className="font-mono text-sm text-tea-600">{batch.batch_no}</td>
                        <td>
                          <div className="font-medium text-gray-800">{batch.product_name}</div>
                          <div className="text-xs text-gray-500">{batch.sku} · {batch.spec}</div>
                        </td>
                        <td className="text-gray-600">{batch.warehouse_name}</td>
                        <td className="text-gray-600">{formatDate(batch.production_date)}</td>
                        <td>
                          <span className={isExpiring ? 'text-orange-600' : 'text-gray-600'}>
                            {formatDate(batch.expiry_date)}
                          </span>
                          {isExpiring && (
                            <div className="text-xs text-orange-500">
                              {daysToExpiry > 0 ? `${daysToExpiry}天后到期` : '已过期'}
                            </div>
                          )}
                        </td>
                        <td className="font-mono text-sm text-gray-500">{batch.inbound_no}</td>
                        <td className="text-right font-medium text-gray-800">
                          {formatNumber(batch.available_quantity)} {batch.unit}
                        </td>
                        <td className="text-right text-gray-800">
                          {formatCurrency(batch.available_quantity * batch.unit_price)}
                        </td>
                        <td className="max-w-[150px]">
                          <span className="text-sm text-gray-500" title={batch.remark}>
                            {truncateText(batch.remark, 15)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
