import { Check, Eye, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FRUIT_TYPES } from '../data/constants.js';

export default function Weighing() {
  const { weighingOrders, addWeighingOrder, confirmWeighingOrder } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newOrder, setNewOrder] = useState({
    supplier: '',
    fruitId: 1,
    quantity: '',
    grossWeight: '',
    tareWeight: '',
    pricePerUnit: '',
    warehouse: ''
  });

  const filteredOrders = weighingOrders.filter(order => {
    const matchesSearch = order.id.includes(searchTerm) ||
      order.supplier.includes(searchTerm) ||
      order.fruitName.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    const fruit = FRUIT_TYPES.find(f => f.id === newOrder.fruitId);
    const netWeight = parseFloat(newOrder.grossWeight) - parseFloat(newOrder.tareWeight);
    const totalAmount = netWeight * parseFloat(newOrder.pricePerUnit);

    addWeighingOrder({
      ...newOrder,
      fruitName: fruit.name,
      unit: fruit.unit,
      netWeight,
      totalAmount,
      operator: '孙采购',
      gradingStatus: 'pending'
    });

    setShowCreateModal(false);
    setNewOrder({
      supplier: '',
      fruitId: 1,
      quantity: '',
      grossWeight: '',
      tareWeight: '',
      pricePerUnit: '',
      warehouse: ''
    });
  };

  const handleConfirm = (orderId) => {
    confirmWeighingOrder(orderId);
    setShowDetailModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">过磅单管理</h1>
          <p className="text-gray-500 mt-1">记录和管理采购过磅单据</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} className="mr-2" />
          新建过磅单
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索单号、供应商、水果..."
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
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
          </select>
        </div>

        <Table headers={['单号', '供应商', '水果', '净重', '单价', '总金额', '库位', '状态', '分级状态', '操作']}>
          {filteredOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-primary-600">{order.id}</td>
              <td className="px-4 py-3 text-sm">{order.supplier}</td>
              <td className="px-4 py-3 text-sm">{order.fruitName}</td>
              <td className="px-4 py-3 text-sm">{order.netWeight} {order.unit}</td>
              <td className="px-4 py-3 text-sm">¥{order.pricePerUnit}/{order.unit}</td>
              <td className="px-4 py-3 text-sm font-medium">¥{order.totalAmount.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm">{order.warehouse}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              <td className="px-4 py-3 text-sm">
                {order.gradingStatus === 'pending' && '待分级'}
                {order.gradingStatus === 'in_progress' && '分级中'}
                {order.gradingStatus === 'completed' && '已分级'}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetailModal(true);
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                >
                  <Eye size={14} /> 详情
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建过磅单"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">供应商</label>
            <input
              type="text"
              className="input"
              value={newOrder.supplier}
              onChange={(e) => setNewOrder({ ...newOrder, supplier: e.target.value })}
              placeholder="请输入供应商名称"
            />
          </div>
          <div>
            <label className="label">水果类型</label>
            <select
              className="select"
              value={newOrder.fruitId}
              onChange={(e) => setNewOrder({ ...newOrder, fruitId: parseInt(e.target.value) })}
            >
              {FRUIT_TYPES.map(fruit => (
                <option key={fruit.id} value={fruit.id}>{fruit.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">毛重 (斤)</label>
            <input
              type="number"
              className="input"
              value={newOrder.grossWeight}
              onChange={(e) => setNewOrder({ ...newOrder, grossWeight: e.target.value })}
              placeholder="请输入毛重"
            />
          </div>
          <div>
            <label className="label">皮重 (斤)</label>
            <input
              type="number"
              className="input"
              value={newOrder.tareWeight}
              onChange={(e) => setNewOrder({ ...newOrder, tareWeight: e.target.value })}
              placeholder="请输入皮重"
            />
          </div>
          <div>
            <label className="label">单价 (元/斤)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={newOrder.pricePerUnit}
              onChange={(e) => setNewOrder({ ...newOrder, pricePerUnit: e.target.value })}
              placeholder="请输入单价"
            />
          </div>
          <div>
            <label className="label">入库库位</label>
            <input
              type="text"
              className="input"
              value={newOrder.warehouse}
              onChange={(e) => setNewOrder({ ...newOrder, warehouse: e.target.value })}
              placeholder="如：A区-01"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleCreate} className="btn-primary">
            确认创建
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="过磅单详情"
        size="lg"
      >
        {selectedOrder && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">单号</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">供应商</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">水果</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.fruitName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">毛重</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.grossWeight} {selectedOrder.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">皮重</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.tareWeight} {selectedOrder.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">净重</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.netWeight} {selectedOrder.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">单价</p>
                <p className="text-lg font-medium text-gray-800">¥{selectedOrder.pricePerUnit}/{selectedOrder.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">总金额</p>
                <p className="text-lg font-bold text-primary-600">¥{selectedOrder.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">入库库位</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.warehouse}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">操作员</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.operator}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建日期</p>
                <p className="text-lg font-medium text-gray-800">{selectedOrder.createDate}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-2">分级状态</p>
              <p className="text-gray-800">
                {selectedOrder.gradingStatus === 'pending' && '待分级'}
                {selectedOrder.gradingStatus === 'in_progress' && '分级中'}
                {selectedOrder.gradingStatus === 'completed' && '已分级'}
              </p>
            </div>
            {selectedOrder.status === 'pending' && (
              <div className="flex justify-end mt-6">
                <button onClick={() => handleConfirm(selectedOrder.id)} className="btn-primary">
                  <Check size={16} className="mr-2" />
                  确认过磅单
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
