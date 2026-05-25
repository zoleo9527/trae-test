import { Droplets, Search, Thermometer } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function ColdRoom() {
  const { coldRoomInventory } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInventory = coldRoomInventory.filter(item => {
    const matchesSearch = item.fruitName.includes(searchTerm) ||
      item.warehouse.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getShelfLifeStatus = (item) => {
    const expectedDate = new Date(item.expectedShelfLife);
    const now = new Date();
    const diffDays = (expectedDate - now) / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) return { text: '即将到期', color: 'text-danger-600' };
    if (diffDays <= 7) return { text: '临近到期', color: 'text-warning-600' };
    return { text: '正常', color: 'text-primary-600' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">冷库库存</h1>
        <p className="text-gray-500 mt-1">实时监控冷库库存和保鲜状态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">总库存</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {coldRoomInventory.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()} 斤
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">可用库存</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {coldRoomInventory.reduce((sum, item) => sum + item.availableQuantity, 0).toLocaleString()} 斤
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">已分级</p>
          <p className="text-2xl font-bold text-info-600 mt-1">
            {coldRoomInventory.reduce((sum, item) => sum + item.gradedQuantity, 0).toLocaleString()} 斤
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">待分级</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">
            {coldRoomInventory.reduce((sum, item) => sum + item.ungradedQuantity, 0).toLocaleString()} 斤
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索水果、库位..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select max-w-[150px]"
          >
            <option value="all">全部状态</option>
            <option value="normal">正常</option>
            <option value="warning">预警</option>
            <option value="pending">待入库</option>
          </select>
        </div>

        <Table headers={['库位', '水果', '总库存', '可用', '已分级', '未分级', '温度', '湿度', '入库日期', '保质期', '状态']}>
          {filteredInventory.map((item) => {
            const shelfLifeStatus = getShelfLifeStatus(item);
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{item.warehouse}</td>
                <td className="px-4 py-3 text-sm">{item.fruitName}</td>
                <td className="px-4 py-3 text-sm font-medium">{item.totalQuantity} {item.fruitName === '葡萄' ? '盒' : '斤'}</td>
                <td className="px-4 py-3 text-sm text-primary-600">{item.availableQuantity}</td>
                <td className="px-4 py-3 text-sm text-info-600">{item.gradedQuantity}</td>
                <td className="px-4 py-3 text-sm text-warning-600">{item.ungradedQuantity}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Thermometer size={14} className="text-blue-500" />
                    {item.temperature}°C
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Droplets size={14} className="text-blue-500" />
                    {item.humidity}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{item.inboundDate}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={shelfLifeStatus.color}>
                    {item.expectedShelfLife}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
