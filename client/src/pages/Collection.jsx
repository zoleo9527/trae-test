import { AlertCircle, Check, Phone, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Collection() {
  const { creditOrders, collectionRecords, addCollectionRecord, completeCollectionRecord, currentUser } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newRecord, setNewRecord] = useState({
    creditOrderId: '',
    method: 'phone',
    amount: '',
    record: '',
    status: 'in_progress'
  });

  const unpaidOrders = creditOrders.filter(o => o.status !== 'paid' && o.totalAmount > o.paidAmount);

  const filteredRecords = collectionRecords.filter(record => {
    const matchesSearch = record.customerName.includes(searchTerm) ||
      record.creditOrderId.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = collectionRecords.filter(r => r.status === 'pending').length;
  const inProgressCount = collectionRecords.filter(r => r.status === 'in_progress').length;
  const completedCount = collectionRecords.filter(r => r.status === 'completed').length;
  const failedCount = collectionRecords.filter(r => r.status === 'failed').length;

  const handleCreate = () => {
    if (!newRecord.creditOrderId) return;

    const order = creditOrders.find(o => o.id === newRecord.creditOrderId);
    if (!order) return;

    addCollectionRecord({
      creditOrderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: parseFloat(newRecord.amount),
      method: newRecord.method,
      record: newRecord.record,
      operator: currentUser.name,
      status: newRecord.status,
      nextFollowDate: newRecord.status === 'completed' ? null : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    setShowCreateModal(false);
    setNewRecord({
      creditOrderId: '',
      method: 'phone',
      amount: '',
      record: '',
      status: 'in_progress'
    });
  };

  const handleComplete = (recordId) => {
    completeCollectionRecord(recordId);
    setShowDetailModal(false);
  };

  const selectedOrder = creditOrders.find(o => o.id === newRecord.creditOrderId);

  const getMethodLabel = (method) => {
    const methods = {
      phone: '电话催办',
      visit: '上门催办',
      message: '短信催办',
      letter: '律师函',
      bank: '银行扣款'
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">回款催办</h1>
          <p className="text-gray-500 mt-1">管理账款催收和回款记录</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} className="mr-2" />
          新建催办记录
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-warning-500" />
            <p className="text-sm text-gray-500">待催办</p>
          </div>
          <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Phone size={16} className="text-info-500" />
            <p className="text-sm text-gray-500">催办中</p>
          </div>
          <p className="text-2xl font-bold text-info-600">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Check size={16} className="text-primary-500" />
            <p className="text-sm text-gray-500">已回款</p>
          </div>
          <p className="text-2xl font-bold text-primary-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-danger-500" />
            <p className="text-sm text-gray-500">催办失败</p>
          </div>
          <p className="text-2xl font-bold text-danger-600">{failedCount}</p>
        </div>
      </div>

      {unpaidOrders.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
          <p className="text-sm text-warning-700 mb-2 font-medium">需要催办的订单</p>
          <div className="space-y-2">
            {unpaidOrders.filter(o => o.status === 'overdue' || o.status === 'bad_debt').slice(0, 3).map(order => (
              <div key={order.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{order.customerName} - {order.id}</p>
                  <p className="text-xs text-gray-500">
                    欠款：¥{(order.totalAmount - order.paidAmount).toLocaleString()}
                    {order.status === 'overdue' && <span className="ml-2 text-danger-600">已逾期</span>}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewRecord({
                      creditOrderId: order.id,
                      method: 'phone',
                      amount: (order.totalAmount - order.paidAmount).toString(),
                      record: '',
                      status: 'in_progress'
                    });
                    setShowCreateModal(true);
                  }}
                  className="text-primary-600 text-sm hover:text-primary-700"
                >
                  催办
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户、订单号..."
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
            <option value="pending">待催办</option>
            <option value="in_progress">催办中</option>
            <option value="completed">已回款</option>
            <option value="failed">催办失败</option>
          </select>
        </div>

        <Table headers={['催办单号', '客户', '关联订单', '催办方式', '金额', '操作员', '状态', '记录', '下次跟进', '操作']}>
          {filteredRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-primary-600">{record.id}</td>
              <td className="px-4 py-3 text-sm">{record.customerName}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{record.creditOrderId}</td>
              <td className="px-4 py-3 text-sm">{getMethodLabel(record.method)}</td>
              <td className="px-4 py-3 text-sm font-medium">¥{record.amount.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm">{record.operator}</td>
              <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{record.record || '-'}</td>
              <td className="px-4 py-3 text-sm">{record.nextFollowDate || '-'}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setSelectedRecord(record);
                    setShowDetailModal(true);
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  详情
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建催办记录"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">选择赊销订单</label>
            <select
              className="select"
              value={newRecord.creditOrderId}
              onChange={(e) => setNewRecord({ ...newRecord, creditOrderId: e.target.value })}
            >
              <option value="">请选择需要催办的订单</option>
              {unpaidOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.customerName} (欠款：¥{(order.totalAmount - order.paidAmount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {selectedOrder && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">订单信息</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500">客户</p>
                  <p className="text-sm font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">欠款金额</p>
                  <p className="text-sm font-bold text-danger-600">
                    ¥{(selectedOrder.totalAmount - selectedOrder.paidAmount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">到期日</p>
                  <p className="text-sm">{selectedOrder.dueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">催办方式</label>
              <select
                className="select"
                value={newRecord.method}
                onChange={(e) => setNewRecord({ ...newRecord, method: e.target.value })}
              >
                <option value="phone">电话催办</option>
                <option value="visit">上门催办</option>
                <option value="message">短信催办</option>
                <option value="letter">律师函</option>
                <option value="bank">银行扣款</option>
              </select>
            </div>
            <div>
              <label className="label">催办金额</label>
              <input
                type="number"
                className="input"
                value={newRecord.amount}
                onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                placeholder="请输入催办金额"
              />
            </div>
          </div>

          <div>
            <label className="label">催办记录</label>
            <textarea
              className="input h-24 resize-none"
              value={newRecord.record}
              onChange={(e) => setNewRecord({ ...newRecord, record: e.target.value })}
              placeholder="请记录催办过程和客户反馈..."
            />
          </div>

          <div>
            <label className="label">状态</label>
            <select
              className="select"
              value={newRecord.status}
              onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
            >
              <option value="pending">待催办</option>
              <option value="in_progress">催办中</option>
              <option value="completed">已回款</option>
              <option value="failed">催办失败</option>
            </select>
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
        title="催办记录详情"
        size="lg"
      >
        {selectedRecord && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">催办单号</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">状态</p>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">客户</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">关联订单</p>
                <p className="text-lg font-medium text-primary-600">{selectedRecord.creditOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">催办方式</p>
                <p className="text-lg font-medium text-gray-800">{getMethodLabel(selectedRecord.method)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">催办金额</p>
                <p className="text-lg font-bold text-primary-600">¥{selectedRecord.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">操作员</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.operator}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建日期</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.createDate}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">下次跟进日期</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.nextFollowDate || '无'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-2">催办记录</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800">{selectedRecord.record || '暂无记录'}</p>
              </div>
            </div>

            {selectedRecord.status === 'in_progress' && (
              <div className="flex justify-end mt-6">
                <button onClick={() => handleComplete(selectedRecord.id)} className="btn-primary">
                  <Check size={16} className="mr-2" />
                  标记完成
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
