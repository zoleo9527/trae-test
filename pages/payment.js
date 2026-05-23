import { useState, useEffect } from 'react';
import withAuth from '../hoc/withAuth';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

function Payment() {
  const [nodes, setNodes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newRemark, setNewRemark] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({ invoiceNo: '', remark: '' });
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceName, setEvidenceName] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({ currentStep: '', nextStep: '' });
  const { hasRole, ROLES } = useAuth();
  const canEdit = hasRole([ROLES.STATION_MANAGER, ROLES.ADMIN_STAFF]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nodesRes, summaryRes] = await Promise.all([
        api.payment.list(),
        api.payment.getSummary(),
      ]);
      setNodes(nodesRes);
      setSummary(summaryRes);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcess = async (nodeId) => {
    try {
      const updatedNode = await api.payment.process(nodeId, { currentStep: '启动办理流程' });
      updateNodeInList(updatedNode);
      setSelectedNode(updatedNode);
    } catch (error) {
      console.error('启动失败:', error);
    }
  };

  const handleComplete = async () => {
    if (!selectedNode) return;
    try {
      const updatedNode = await api.payment.complete(selectedNode.id, completeForm);
      updateNodeInList(updatedNode);
      setShowCompleteModal(false);
      setCompleteForm({ invoiceNo: '', remark: '' });
    } catch (error) {
      console.error('完成失败:', error);
    }
  };

  const handleAddRemark = async () => {
    if (!selectedNode || !newRemark.trim()) return;
    try {
      await api.payment.addRemark(selectedNode.id, newRemark);
      setNewRemark('');
      const updatedNode = await api.payment.get(selectedNode.id);
      updateNodeInList(updatedNode);
    } catch (error) {
      console.error('添加备注失败:', error);
    }
  };

  const updateNodeInList = (updatedNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNode(updatedNode);
    refreshSummary();
  };

  const refreshSummary = async () => {
    try {
      const newSummary = await api.payment.getSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error('刷新汇总失败:', error);
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedNode || !evidenceName.trim()) return;
    try {
      const updatedNode = await api.payment.addEvidence(selectedNode.id, evidenceName);
      updateNodeInList(updatedNode);
      setShowEvidenceModal(false);
      setEvidenceName('');
    } catch (error) {
      console.error('添加凭证失败:', error);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedNode) return;
    try {
      const updatedNode = await api.payment.updateProgress(selectedNode.id, progressForm);
      updateNodeInList(updatedNode);
      setShowProgressModal(false);
      setProgressForm({ currentStep: '', nextStep: '' });
    } catch (error) {
      console.error('更新进度失败:', error);
    }
  };

  const openProgressModal = () => {
    setProgressForm({
      currentStep: selectedNode.currentStep || '',
      nextStep: selectedNode.nextStep || '',
    });
    setShowProgressModal(true);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">回款节点跟踪</h2>
          <p className="text-sm text-gray-500">跟踪各回款节点的进度与状态</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">合同总金额</p>
            <p className="text-2xl font-bold text-gray-800">{formatMoney(summary.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">已回款</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(summary.paidAmount)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">待回款</p>
            <p className="text-2xl font-bold text-orange-600">{formatMoney(summary.pendingAmount)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">回款进度</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-blue-600">{summary.paymentRate}%</p>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${summary.paymentRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-320px)]">
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">回款节点</h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)] scrollbar-thin">
            <div className="relative px-6 py-4">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              {nodes.map((node, index) => (
                <div key={node.id} className="relative mb-6 last:mb-0">
                  <div 
                    className={`absolute left-6 w-4 h-4 rounded-full border-2 ${
                      node.status === 'completed' ? 'bg-green-500 border-green-500' :
                      node.status === 'processing' ? 'bg-blue-500 border-blue-500' :
                      'bg-white border-gray-300'
                    }`}
                  />
                  
                  <div 
                    onClick={() => setSelectedNode(node)}
                    className={`ml-12 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedNode?.id === node.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">{node.name}</h4>
                        <p className="text-sm text-gray-500">{node.percentage}% · {formatMoney(node.amount)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[node.status]}`}>
                        {node.statusName}
                      </span>
                    </div>
                    
                    {node.status === 'processing' && node.currentStep && (
                      <p className="text-sm text-blue-600 mb-2">📍 当前：{node.currentStep}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>计划：{node.planDate}</span>
                      {node.actualDate && <span>实际：{node.actualDate}</span>}
                    </div>
                    
                    {node.status === 'pending' && node.triggerCondition && (
                      <p className="text-xs text-orange-600 mt-2">🔔 触发条件：{node.triggerCondition}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="w-96 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">节点详情</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-800 text-lg">{selectedNode.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedNode.status]}`}>
                    {selectedNode.statusName}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{formatMoney(selectedNode.amount)}</p>
                <p className="text-sm text-gray-500">占比 {selectedNode.percentage}%</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">经办人</span>
                  <span>{selectedNode.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">计划日期</span>
                  <span>{selectedNode.planDate}</span>
                </div>
                {selectedNode.actualDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">实际日期</span>
                    <span className="text-green-600">{selectedNode.actualDate}</span>
                  </div>
                )}
                {selectedNode.invoiceNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">发票号</span>
                    <span>{selectedNode.invoiceNo}</span>
                  </div>
                )}
              </div>

              {selectedNode.status === 'processing' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-blue-600 font-medium">当前进度</p>
                    {canEdit && (
                      <button
                        onClick={openProgressModal}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 mb-2">{selectedNode.currentStep || '办理中...'}</p>
                  {selectedNode.nextStep && (
                    <p className="text-xs text-blue-500">→ 下一步：{selectedNode.nextStep}</p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">📎 凭证材料</p>
                  {canEdit && selectedNode.status !== 'completed' && (
                    <button
                      onClick={() => setShowEvidenceModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + 补充材料
                    </button>
                  )}
                </div>
                {selectedNode.evidences?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNode.evidences.map((ev, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <span>📄</span>
                        <span className="flex-1 truncate">{ev.name}</span>
                        <span className="text-gray-400 text-xs">{ev.uploadTime?.slice(5, 11)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">暂无凭证材料</p>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">💬 操作记录</p>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {selectedNode.remarks?.length > 0 ? (
                    selectedNode.remarks.map((remark) => (
                      <div 
                        key={remark.id} 
                        className={`p-2 rounded text-sm ${remark.isSystem ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${remark.isSystem ? 'text-blue-700' : 'text-gray-700'}`}>
                            {remark.isSystem && '🤖 '}{remark.author}
                          </span>
                          <span className="text-xs text-gray-400">{remark.time?.slice(5, 16)}</span>
                        </div>
                        <p className={remark.isSystem ? 'text-blue-600' : 'text-gray-600'}>{remark.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">暂无记录</p>
                  )}
                </div>
                {canEdit && (
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
                )}
              </div>
            </div>

            {canEdit && selectedNode.status !== 'completed' && (
              <div className="p-4 border-t border-gray-200">
                {selectedNode.status === 'pending' ? (
                  <button
                    onClick={() => handleStartProcess(selectedNode.id)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    启动办理
                  </button>
                ) : selectedNode.status === 'processing' ? (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    标记完成
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">标记回款完成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发票号</label>
                <input
                  type="text"
                  value={completeForm.invoiceNo}
                  onChange={(e) => setCompleteForm({ ...completeForm, invoiceNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="请输入发票号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                <textarea
                  value={completeForm.remark}
                  onChange={(e) => setCompleteForm({ ...completeForm, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                  placeholder="填写备注信息..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowCompleteModal(false); setCompleteForm({ invoiceNo: '', remark: '' }); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">补充凭证材料</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">材料名称</label>
              <input
                type="text"
                value={evidenceName}
                onChange={(e) => setEvidenceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="例如：发票扫描件、验收单、对账单等"
              />
            </div>
            <p className="text-xs text-gray-500 mb-4">
              📌 注：当前为演示模式，记录材料名称用于追溯。生产环境可集成文件上传功能。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowEvidenceModal(false); setEvidenceName(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAddEvidence}
                disabled={!evidenceName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">更新办理进度</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前步骤</label>
                <input
                  type="text"
                  value={progressForm.currentStep}
                  onChange={(e) => setProgressForm({ ...progressForm, currentStep: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="例如：财务审核中、业主方签字等"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">下一步说明</label>
                <textarea
                  value={progressForm.nextStep}
                  onChange={(e) => setProgressForm({ ...progressForm, nextStep: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                  placeholder="例如：等待发票开具、安排付款等（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowProgressModal(false); setProgressForm({ currentStep: '', nextStep: '' }); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProgress}
                disabled={!progressForm.currentStep.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(Payment, ['station_manager', 'admin_staff']);
