import { Check, Eye, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FRUIT_TYPES, GRADING_LEVELS } from '../data/constants.js';

export default function Grading() {
  const { gradingRecords, weighingOrders, addGradingRecord, completeGrading } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newRecord, setNewRecord] = useState({
    weighingOrderId: '',
    grades: GRADING_LEVELS.reduce((acc, level) => ({ ...acc, [level.id]: '' }), {})
  });

  const pendingWeighingOrders = weighingOrders.filter(o => o.gradingStatus === 'pending' && o.status === 'confirmed');

  const filteredRecords = gradingRecords.filter(record => {
    const matchesSearch = record.id.includes(searchTerm) ||
      record.fruitName.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    if (!newRecord.weighingOrderId) return;

    const order = weighingOrders.find(o => o.id === newRecord.weighingOrderId);
    if (!order) return;

    const grades = GRADING_LEVELS.map(level => {
      const quantity = parseFloat(newRecord.grades[level.id]) || 0;
      const fruit = FRUIT_TYPES.find(f => f.id === order.fruitId);
      const basePrice = order.pricePerUnit;
      const price = basePrice * level.multiplier;
      return {
        level: level.id,
        quantity,
        price: parseFloat(price.toFixed(2)),
        amount: parseFloat((quantity * price).toFixed(2))
      };
    }).filter(g => g.quantity > 0);

    const totalQuantity = grades.reduce((sum, g) => sum + g.quantity, 0);

    addGradingRecord({
      weighingOrderId: order.id,
      fruitId: order.fruitId,
      fruitName: order.fruitName,
      totalQuantity,
      grades,
      operator: '王库管'
    });

    setShowCreateModal(false);
    setNewRecord({
      weighingOrderId: '',
      grades: GRADING_LEVELS.reduce((acc, level) => ({ ...acc, [level.id]: '' }), {})
    });
  };

  const handleComplete = (recordId) => {
    completeGrading(recordId);
    setShowDetailModal(false);
  };

  const selectedWeighingOrder = weighingOrders.find(o => o.id === newRecord.weighingOrderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">分级配货</h1>
          <p className="text-gray-500 mt-1">对入库水果进行质量分级和定价</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          disabled={pendingWeighingOrders.length === 0}
        >
          <Plus size={18} className="mr-2" />
          新建分级
        </button>
      </div>

      {pendingWeighingOrders.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
          <p className="text-sm text-warning-700">
            有 <span className="font-bold">{pendingWeighingOrders.length}</span> 批货物等待分级处理
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索分级单、水果..."
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
            <option value="pending">待分级</option>
            <option value="in_progress">分级中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <Table headers={['分级单号', '关联过磅单', '水果', '总数量', '状态', '操作员', '日期', '操作']}>
          {filteredRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-primary-600">{record.id}</td>
              <td className="px-4 py-3 text-sm">{record.weighingOrderId}</td>
              <td className="px-4 py-3 text-sm">{record.fruitName}</td>
              <td className="px-4 py-3 text-sm font-medium">{record.totalQuantity} 斤</td>
              <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
              <td className="px-4 py-3 text-sm">{record.operator}</td>
              <td className="px-4 py-3 text-sm">{record.createDate}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setSelectedRecord(record);
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
        title="新建分级记录"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">选择过磅单</label>
            <select
              className="select"
              value={newRecord.weighingOrderId}
              onChange={(e) => setNewRecord({ ...newRecord, weighingOrderId: e.target.value })}
            >
              <option value="">请选择待分级的过磅单</option>
              {pendingWeighingOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.fruitName} ({order.netWeight} 斤, ¥{order.pricePerUnit}/斤)
                </option>
              ))}
            </select>
          </div>

          {selectedWeighingOrder && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">分级数量分配</p>
              <p className="text-xs text-gray-500 mb-3">
                总数量：{selectedWeighingOrder.netWeight} 斤，请分配到各个等级（数量总和不超过总数量）
              </p>
              <div className="grid grid-cols-2 gap-4">
                {GRADING_LEVELS.map(level => (
                  <div key={level.id}>
                    <label className="label">
                      {level.name} ({level.description})
                      <span className="text-xs text-gray-400 ml-2">
                        单价：¥{(selectedWeighingOrder.pricePerUnit * level.multiplier).toFixed(2)}
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={newRecord.grades[level.id]}
                      onChange={(e) => setNewRecord({
                        ...newRecord,
                        grades: { ...newRecord.grades, [level.id]: e.target.value }
                      })}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleCreate} className="btn-primary">
            开始分级
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="分级详情"
        size="lg"
      >
        {selectedRecord && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">分级单号</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">关联过磅单</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.weighingOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">水果</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.fruitName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                <StatusBadge status={selectedRecord.status} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-800 mb-3">分级明细</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">等级</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">数量</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">单价</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.grades.map((grade, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-sm">
                          {GRADING_LEVELS.find(l => l.id === grade.level)?.name}
                        </td>
                        <td className="px-4 py-2 text-sm">{grade.quantity} 斤</td>
                        <td className="px-4 py-2 text-sm">¥{grade.price}/斤</td>
                        <td className="px-4 py-2 text-sm font-medium">¥{grade.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium" colSpan="3">合计</td>
                      <td className="px-4 py-2 text-sm font-bold text-primary-600">
                        ¥{selectedRecord.grades.reduce((sum, g) => sum + g.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedRecord.status === 'in_progress' && (
              <div className="flex justify-end mt-6">
                <button onClick={() => handleComplete(selectedRecord.id)} className="btn-primary">
                  <Check size={16} className="mr-2" />
                  完成分级
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
