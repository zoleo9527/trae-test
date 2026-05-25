import { Check, FileText, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';

const mockEvidenceFiles = [
  'photo_质量问题_20250101_01.jpg',
  'photo_质量问题_20250101_02.jpg',
  'photo_质量问题_20250101_03.jpg',
  '过磅单_20250101.jpg',
  '签收单_20250101.jpg',
  '视频_运输损坏_20250101.mp4'
];

export default function Complaints() {
  const { complaintRecords, customers, creditOrders, addComplaintRecord, processComplaint, resolveComplaint, currentUser } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolution, setResolution] = useState('');

  const [newRecord, setNewRecord] = useState({
    customerId: '',
    orderId: '',
    type: 'quality',
    description: '',
    quantity: '',
    claimAmount: '',
    evidence: []
  });

  const toggleEvidence = (fileName) => {
    const current = newRecord.evidence || [];
    if (current.includes(fileName)) {
      setNewRecord({
        ...newRecord,
        evidence: current.filter(f => f !== fileName)
      });
    } else {
      setNewRecord({
        ...newRecord,
        evidence: [...current, fileName]
      });
    }
  };

  const filteredRecords = complaintRecords.filter(record => {
    const matchesSearch = record.customerName.includes(searchTerm) ||
      record.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = complaintRecords.filter(r => r.status === 'pending').length;
  const processingCount = complaintRecords.filter(r => r.status === 'processing').length;
  const resolvedCount = complaintRecords.filter(r => r.status === 'resolved').length;

  const getTypeLabel = (type) => {
    const types = {
      quality: '质量问题',
      shortage: '数量短缺',
      damage: '运输损坏',
      other: '其他'
    };
    return types[type] || type;
  };

  const handleCreate = () => {
    if (!newRecord.customerId || !newRecord.orderId) return;

    const customer = customers.find(c => c.id === parseInt(newRecord.customerId));
    if (!customer) return;

    addComplaintRecord({
      customerId: parseInt(newRecord.customerId),
      customerName: customer.name,
      orderId: newRecord.orderId,
      type: newRecord.type,
      description: newRecord.description,
      quantity: parseFloat(newRecord.quantity),
      unit: '斤',
      claimAmount: parseFloat(newRecord.claimAmount),
      evidence: newRecord.evidence || [],
      handler: currentUser.name
    });

    setShowCreateModal(false);
    setNewRecord({
      customerId: '',
      orderId: '',
      type: 'quality',
      description: '',
      quantity: '',
      claimAmount: '',
      evidence: []
    });
  };

  const handleProcess = () => {
    if (!resolution.trim()) return;
    processComplaint(selectedRecord.id, resolution);
    setShowProcessModal(false);
    setSelectedRecord(null);
    setResolution('');
  };

  const handleResolve = () => {
    if (!resolution.trim()) return;
    resolveComplaint(selectedRecord.id, resolution);
    setShowResolveModal(false);
    setSelectedRecord(null);
    setResolution('');
  };

  const selectedCustomer = customers.find(c => c.id === parseInt(newRecord.customerId));
  const customerOrders = selectedCustomer
    ? creditOrders.filter(o => o.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">客诉赔付</h1>
          <p className="text-gray-500 mt-1">处理客户投诉和赔付事宜</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} className="mr-2" />
          新建投诉
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-warning-500" />
            <p className="text-sm text-gray-500">待处理</p>
          </div>
          <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Search size={16} className="text-info-500" />
            <p className="text-sm text-gray-500">处理中</p>
          </div>
          <p className="text-2xl font-bold text-info-600">{processingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Check size={16} className="text-primary-500" />
            <p className="text-sm text-gray-500">已解决</p>
          </div>
          <p className="text-2xl font-bold text-primary-600">{resolvedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户、投诉单号..."
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
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
          </select>
        </div>

        <Table headers={['投诉单号', '客户', '关联订单', '类型', '描述', '凭证', '索赔金额', '处理人', '状态', '操作']}>
          {filteredRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-primary-600">{record.id}</td>
              <td className="px-4 py-3 text-sm">{record.customerName}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{record.orderId}</td>
              <td className="px-4 py-3 text-sm">{getTypeLabel(record.type)}</td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate">{record.description}</td>
              <td className="px-4 py-3 text-sm">
                {record.evidence && record.evidence.length > 0 ? (
                  <span className="text-primary-600">{record.evidence.length} 个</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-danger-600">¥{record.claimAmount.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm">{record.handler}</td>
              <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowDetailModal(true);
                    }}
                    className="text-info-600 hover:text-info-700 text-sm flex items-center gap-1"
                  >
                    <Image size={14} /> 凭证
                  </button>
                  {record.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setResolution('');
                        setShowProcessModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      处理
                    </button>
                  )}
                  {record.status === 'processing' && (
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setResolution(record.resolution || '');
                        setShowResolveModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                    >
                      <Check size={14} /> 结案
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建投诉记录"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">选择客户</label>
              <select
                className="select"
                value={newRecord.customerId}
                onChange={(e) => setNewRecord({ ...newRecord, customerId: e.target.value })}
              >
                <option value="">请选择客户</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">关联订单</label>
              <select
                className="select"
                value={newRecord.orderId}
                onChange={(e) => setNewRecord({ ...newRecord, orderId: e.target.value })}
                disabled={!selectedCustomer}
              >
                <option value="">请选择订单</option>
                {customerOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.id} ({order.createDate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">投诉类型</label>
              <select
                className="select"
                value={newRecord.type}
                onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
              >
                <option value="quality">质量问题</option>
                <option value="shortage">数量短缺</option>
                <option value="damage">运输损坏</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="label">索赔数量</label>
              <input
                type="number"
                className="input"
                value={newRecord.quantity}
                onChange={(e) => setNewRecord({ ...newRecord, quantity: e.target.value })}
                placeholder="请输入索赔数量"
              />
            </div>
          </div>
          <div>
            <label className="label">问题描述</label>
            <textarea
              className="input h-24 resize-none"
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              placeholder="请详细描述投诉问题..."
            />
          </div>
          <div>
            <label className="label">索赔金额 (元)</label>
            <input
              type="number"
              className="input"
              value={newRecord.claimAmount}
              onChange={(e) => setNewRecord({ ...newRecord, claimAmount: e.target.value })}
              placeholder="请输入索赔金额"
            />
          </div>
          <div>
            <label className="label">
              选择凭证
              <span className="text-xs text-gray-400 ml-2">已选 {newRecord.evidence?.length || 0} 个</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {mockEvidenceFiles.map((fileName) => (
                <button
                  key={fileName}
                  type="button"
                  onClick={() => toggleEvidence(fileName)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                    newRecord.evidence?.includes(fileName)
                      ? 'bg-primary-50 border border-primary-300'
                      : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    newRecord.evidence?.includes(fileName) ? 'bg-primary-500 text-white' : 'bg-gray-200'
                  }`}>
                    {newRecord.evidence?.includes(fileName) && <Check size={12} />}
                  </div>
                  <span className="truncate text-xs">{fileName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleCreate} className="btn-primary">
            提交投诉
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          setSelectedRecord(null);
          setResolution('');
        }}
        title="处理投诉"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">投诉信息</p>
              <p className="text-sm font-medium mt-1">{selectedRecord.customerName} - {selectedRecord.id}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedRecord.description}</p>
            </div>
            <div>
              <label className="label">处理方案</label>
              <textarea
                className="input h-24 resize-none"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="请描述处理方案..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedRecord(null);
                  setResolution('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleProcess} className="btn-primary">
                开始处理
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setSelectedRecord(null);
          setResolution('');
        }}
        title="结案确认"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">当前处理方案</p>
              <p className="text-sm mt-1">{selectedRecord.resolution || '暂无'}</p>
            </div>
            <div>
              <label className="label">最终解决方案</label>
              <textarea
                className="input h-24 resize-none"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="请确认最终解决方案..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedRecord(null);
                  setResolution('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleResolve} className="btn-primary">
                <Check size={16} className="mr-2" />
                确认结案
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRecord(null);
        }}
        title="投诉详情"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">投诉单号</p>
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
                <p className="text-lg font-medium text-primary-600">{selectedRecord.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">投诉类型</p>
                <p className="text-lg font-medium text-gray-800">{getTypeLabel(selectedRecord.type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">处理人</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.handler}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">索赔数量</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.quantity} {selectedRecord.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">索赔金额</p>
                <p className="text-lg font-bold text-danger-600">¥{selectedRecord.claimAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建日期</p>
                <p className="text-lg font-medium text-gray-800">{selectedRecord.createDate}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-2">问题描述</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800">{selectedRecord.description}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-800">凭证文件</p>
                <span className="text-xs text-gray-500">共 {selectedRecord.evidence?.length || 0} 个</span>
              </div>
              {selectedRecord.evidence && selectedRecord.evidence.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedRecord.evidence.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center">
                        {file.endsWith('.mp4') ? (
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <Image size={20} className="text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file}</p>
                        <p className="text-xs text-gray-500">{file.endsWith('.mp4') ? '视频文件' : '图片'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Image size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无凭证文件</p>
                </div>
              )}
            </div>

            {selectedRecord.resolution && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-2">处理方案</p>
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="text-sm text-primary-800">{selectedRecord.resolution}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRecord(null);
                }}
                className="btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
