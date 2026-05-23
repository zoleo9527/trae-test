import { useState, useEffect } from 'react';
import withAuth from '../hoc/withAuth';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const statusColors = {
  pending: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '', type: '' });
  const [newRemark, setNewRemark] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const { hasRole, ROLES, user } = useAuth();
  const isManager = hasRole(ROLES.STATION_MANAGER);
  const isEngineer = hasRole(ROLES.ENGINEER);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { ...filter };
      if (isEngineer) {
        params.assigneeId = user.id;
      }
      
      const [ordersRes, statsRes, engineersRes] = await Promise.all([
        api.workOrders.list(params),
        api.workOrders.getStats(),
        isManager ? api.auth.getEngineers() : Promise.resolve([]),
      ]);
      
      setOrders(ordersRes);
      setStats(statsRes);
      setEngineers(engineersRes);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrder || !selectedEngineer) return;
    try {
      await api.workOrders.assign(selectedOrder.id, selectedEngineer);
      setShowAssignModal(false);
      setSelectedEngineer('');
      loadData();
      setSelectedOrder(null);
    } catch (error) {
      console.error('分配失败:', error);
    }
  };

  const handleUpdateStatus = async (status, statusName, closeNoteVal) => {
    if (!selectedOrder) return;
    try {
      await api.workOrders.updateStatus(selectedOrder.id, status, statusName, closeNoteVal);
      loadData();
      setSelectedOrder(null);
      setShowCloseModal(false);
      setCloseNote('');
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const handleAddRemark = async () => {
    if (!selectedOrder || !newRemark.trim()) return;
    try {
      await api.workOrders.addRemark(selectedOrder.id, newRemark);
      setNewRemark('');
      loadData();
    } catch (error) {
      console.error('添加备注失败:', error);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分` : `${mins}分钟`;
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">工单管理</h2>
          <p className="text-sm text-gray-500">管理发电异常、设备维修等工单</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">总工单</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">待分配</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">处理中</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">累计停机</p>
            <p className="text-2xl font-bold text-red-600">{formatDuration(stats.totalDowntime)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">损失电量</p>
            <p className="text-2xl font-bold text-gray-800">{(stats.totalPowerLoss / 1000).toFixed(1)}kWh</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待分配</option>
            <option value="in_progress">处理中</option>
            <option value="completed">已完成</option>
            <option value="closed">已关闭</option>
          </select>
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部优先级</option>
            <option value="high">紧急</option>
            <option value="medium">重要</option>
            <option value="low">一般</option>
          </select>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部类型</option>
            <option value="alarm">发电异常</option>
            <option value="repair">设备维修</option>
            <option value="maintenance">日常巡检</option>
            <option value="inspection">专项检查</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-380px)]">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单标题</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理人</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedOrder?.id === order.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{order.title}</div>
                        <div className="text-xs text-gray-400">{order.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.typeName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[order.priority]}`}>
                          {order.priorityName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                          {order.statusName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.assignee || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{order.location}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        <p className="text-4xl mb-2">🔧</p>
                        <p>暂无工单</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="w-96 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">工单详情</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[selectedOrder.priority]}`}>
                    {selectedOrder.priorityName}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.statusName}
                  </span>
                  <span className="text-xs text-gray-400">{selectedOrder.id}</span>
                </div>
                <h4 className="font-medium text-gray-800 text-lg">{selectedOrder.title}</h4>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">工单类型</span>
                  <span>{selectedOrder.typeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">位置</span>
                  <span>{selectedOrder.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">设备</span>
                  <span>{selectedOrder.equipment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">处理人</span>
                  <span>{selectedOrder.assignee || '-'}</span>
                </div>
                {selectedOrder.downtimeMinutes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">停机时长</span>
                    <span className="text-red-600">{formatDuration(selectedOrder.downtimeMinutes)}</span>
                  </div>
                )}
                {selectedOrder.powerLoss > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">损失电量</span>
                    <span className="text-orange-600">{(selectedOrder.powerLoss / 1000).toFixed(1)}kWh</span>
                  </div>
                )}
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{selectedOrder.description}</p>
              </div>

              {selectedOrder.spareParts?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">📦 备件领用</p>
                  <div className="space-y-2">
                    {selectedOrder.spareParts.map((part, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>{part.name} × {part.quantity}</span>
                        <span className="text-xs text-gray-500">{part.requestTime?.slice(5, 11)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.evidences?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">📷 证据链</p>
                  <div className="space-y-2">
                    {selectedOrder.evidences.map((ev, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <span>🖼️</span>
                        <span className="flex-1 truncate">{ev.name}</span>
                        <span className="text-gray-400 text-xs">{ev.uploader}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.history?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">📜 状态历史</p>
                  <div className="space-y-2">
                    {selectedOrder.history.map((h, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        <div>
                          <span className="text-gray-700">{h.statusName}</span>
                          <span className="text-gray-400 text-xs ml-2">{h.time?.slice(5, 16)}</span>
                          <p className="text-gray-500 text-xs">操作人：{h.operator}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">💬 沟通记录</p>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {selectedOrder.remarks?.length > 0 ? (
                    selectedOrder.remarks.map((remark) => (
                      <div key={remark.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700">{remark.author}</span>
                          <span className="text-xs text-gray-400">{remark.time?.slice(5, 16)}</span>
                        </div>
                        <p className="text-gray-600">{remark.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">暂无记录</p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                    placeholder="添加备注..."
                  />
                  <button
                    onClick={handleAddRemark}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2">
              {isManager && selectedOrder.status === 'pending' && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  分配工单
                </button>
              )}
              {isEngineer && selectedOrder.status === 'in_progress' && selectedOrder.assigneeId === user.id && (
                <button
                  onClick={() => handleUpdateStatus('completed', '已完成')}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  完成处理
                </button>
              )}
              {isManager && selectedOrder.status === 'completed' && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  关闭工单
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">分配工单</h3>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
            >
              <option value="">选择处理人</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>{eng.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedEngineer(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                确定分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">关闭工单</h3>
            <textarea
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 h-24 resize-none"
              placeholder="请输入关闭说明（验收结果、遗留问题等）..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCloseModal(false); setCloseNote(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleUpdateStatus('closed', '已关闭', closeNote)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(WorkOrders);
