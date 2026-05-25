import { AlertTriangle, Check, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FRUIT_TYPES } from '../data/constants.js';

export default function Loss() {
  const { lossRecords, coldRoomInventory, addLossRecord, confirmLossRecord, rejectLossRecord } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newRecord, setNewRecord] = useState({
    fruitId: 1,
    warehouse: '',
    quantity: '',
    reason: '自然损耗',
    description: '',
    relatedOrder: ''
  });

  const filteredRecords = lossRecords.filter(record => {
    const matchesSearch = record.fruitName.includes(searchTerm) ||
      record.warehouse.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = lossRecords.filter(r => r.status === 'pending').length;
  const confirmedCount = lossRecords.filter(r => r.status === 'confirmed').length;
  const rejectedCount = lossRecords.filter(r => r.status === 'rejected').length;

  const handleCreate = () => {
    const fruit = FRUIT_TYPES.find(f => f.id === newRecord.fruitId);
    if (!fruit) return;

    addLossRecord({
      fruitId: newRecord.fruitId,
      fruitName: fruit.name,
      warehouse: newRecord.warehouse,
      quantity: parseFloat(newRecord.quantity),
      unit: fruit.unit,
      reason: newRecord.reason,
      description: newRecord.description,
      operator: '王库管',
      relatedOrder: newRecord.relatedOrder
    });

    setShowCreateModal(false);
    setNewRecord({
      fruitId: 1,
      warehouse: '',
      quantity: '',
      reason: '自然损耗',
      description: '',
      relatedOrder: ''
    });
  };

  const handleConfirm = (recordId) => {
    confirmLossRecord(recordId);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectLossRecord(selectedRecord.id, rejectReason);
    setShowRejectModal(false);
    setSelectedRecord(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">损耗管理</h1>
          <p className="text-gray-500 mt-1">记录和审核库存损耗情况</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} className="mr-2" />
          记录损耗
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-warning-500" />
            <p className="text-sm text-gray-500">待审核</p>
          </div>
          <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Check size={16} className="text-primary-500" />
            <p className="text-sm text-gray-500">已确认</p>
          </div>
          <p className="text-2xl font-bold text-primary-600">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <X size={16} className="text-danger-500" />
            <p className="text-sm text-gray-500">已驳回</p>
          </div>
          <p className="text-2xl font-bold text-danger-600">{rejectedCount}</p>
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
            <option value="pending">待审核</option>
            <option value="confirmed">已确认</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>

        <Table headers={['损耗单号', '水果', '库位', '数量', '原因', '描述', '操作员', '状态', '关联订单', '操作']}>
          {filteredRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-primary-600">{record.id}</td>
              <td className="px-4 py-3 text-sm">{record.fruitName}</td>
              <td className="px-4 py-3 text-sm">{record.warehouse}</td>
              <td className="px-4 py-3 text-sm font-medium text-danger-600">{record.quantity} {record.unit}</td>
              <td className="px-4 py-3 text-sm">{record.reason}</td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{record.description}</td>
              <td className="px-4 py-3 text-sm">{record.operator}</td>
              <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
              <td className="px-4 py-3 text-sm text-gray-500">{record.relatedOrder || '-'}</td>
              <td className="px-4 py-3">
                {record.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirm(record.id)}
                      className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                    >
                      <Check size={14} /> 确认
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowRejectModal(true);
                      }}
                      className="text-danger-600 hover:text-danger-700 text-sm flex items-center gap-1"
                    >
                      <X size={14} /> 驳回
                    </button>
                  </div>
                )}
                {record.status === 'rejected' && (
                  <span className="text-xs text-danger-500">{record.rejectReason}</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="记录损耗"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">水果类型</label>
              <select
                className="select"
                value={newRecord.fruitId}
                onChange={(e) => setNewRecord({ ...newRecord, fruitId: parseInt(e.target.value) })}
              >
                {FRUIT_TYPES.map(fruit => (
                  <option key={fruit.id} value={fruit.id}>{fruit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">库位</label>
              <select
                className="select"
                value={newRecord.warehouse}
                onChange={(e) => setNewRecord({ ...newRecord, warehouse: e.target.value })}
              >
                <option value="">请选择库位</option>
                {coldRoomInventory.map(item => (
                  <option key={item.id} value={item.warehouse}>{item.warehouse} ({item.fruitName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">损耗数量 (斤/盒)</label>
              <input
                type="number"
                className="input"
                value={newRecord.quantity}
                onChange={(e) => setNewRecord({ ...newRecord, quantity: e.target.value })}
                placeholder="请输入损耗数量"
              />
            </div>
            <div>
              <label className="label">损耗原因</label>
              <select
                className="select"
                value={newRecord.reason}
                onChange={(e) => setNewRecord({ ...newRecord, reason: e.target.value })}
              >
                <option value="自然损耗">自然损耗</option>
                <option value="冷害损伤">冷害损伤</option>
                <option value="机械损伤">机械损伤</option>
                <option value="霉变">霉变</option>
                <option value="虫害">虫害</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">损耗描述</label>
            <textarea
              className="input h-24 resize-none"
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              placeholder="请详细描述损耗情况..."
            />
          </div>
          <div>
            <label className="label">关联过磅单号 (可选)</label>
            <input
              type="text"
              className="input"
              value={newRecord.relatedOrder}
              onChange={(e) => setNewRecord({ ...newRecord, relatedOrder: e.target.value })}
              placeholder="如：WO202501001"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleCreate} className="btn-primary">
            提交审核
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRecord(null);
          setRejectReason('');
        }}
        title="驳回损耗记录"
        size="md"
      >
        <div>
          <label className="label">驳回原因</label>
          <textarea
            className="input h-24 resize-none"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请说明驳回原因..."
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowRejectModal(false);
              setSelectedRecord(null);
              setRejectReason('');
            }}
            className="btn-secondary"
          >
            取消
          </button>
          <button onClick={handleReject} className="btn-danger">
            确认驳回
          </button>
        </div>
      </Modal>
    </div>
  );
}
