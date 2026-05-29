import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { Return, DamageAssessment, Repair, Rental } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReturnWithRelations extends Return {
  repairs?: Repair[];
  rental?: Rental;
}

export default function ReviewPage() {
  const [pendingReturns, setPendingReturns] = useState<ReturnWithRelations[]>([]);
  const [allReturns, setAllReturns] = useState<ReturnWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const { hasRole } = useAuth();
  const [detailReturn, setDetailReturn] = useState<ReturnWithRelations | null>(null);
  const [batchAction, setBatchAction] = useState<'approve' | 'dispute' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pending, all]: any = await Promise.all([
      api.returns.getPending(),
      api.returns.list({ pageSize: 100 }),
    ]);
    setPendingReturns(pending);
    setAllReturns(all.data);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === pendingReturns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingReturns.map((r) => r.id));
    }
  };

  const handleBatchReview = async (action: 'approve' | 'dispute') => {
    if (selectedIds.length === 0) return;
    setBatchAction(action);
    try {
      await api.returns.batchReview(selectedIds, action);
      setSelectedIds([]);
      loadData();
    } catch (error) {
      console.error('批量操作失败:', error);
    } finally {
      setBatchAction(null);
    }
  };

  const handleSingleReview = async (id: string, action: 'approve' | 'dispute') => {
    try {
      await api.returns.review(id, action);
      setDetailReturn(null);
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const severityLabels: Record<string, { label: string; class: string }> = {
    minor: { label: '轻微', class: 'bg-green-100 text-green-700' },
    moderate: { label: '中等', class: 'bg-amber-100 text-amber-700' },
    major: { label: '严重', class: 'bg-red-100 text-red-700' },
  };

  const liabilityLabels: Record<string, string> = {
    customer: '客户责任',
    wear_and_tear: '正常损耗',
    previous: '原有损坏',
    unknown: '待确认',
  };

  const repairStatusLabels: Record<string, { label: string; class: string }> = {
    pending: { label: '待处理', class: 'bg-amber-100 text-amber-700' },
    in_progress: { label: '维修中', class: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', class: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-700' },
  };

  const displayReturns = activeTab === 'pending' ? pendingReturns : allReturns;

  const calculateDeposit = (item: ReturnWithRelations) => {
    return item.netRefund + item.totalRentalFee + item.damageDeduction;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">归还复核</h1>
            <p className="text-gray-500 mt-1">
              损坏判责 · 押金结算 · 批量处理
            </p>
          </div>
          {activeTab === 'pending' && selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                已选 {selectedIds.length} 项
              </span>
              <button
                onClick={() => handleBatchReview('approve')}
                disabled={batchAction !== null}
                className="btn-primary disabled:opacity-50"
              >
                {batchAction === 'approve' ? '处理中...' : '批量通过'}
              </button>
              <button
                onClick={() => handleBatchReview('dispute')}
                disabled={batchAction !== null}
                className="btn-secondary disabled:opacity-50"
              >
                {batchAction === 'dispute' ? '处理中...' : '批量异议'}
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              待复核
              {pendingReturns.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {pendingReturns.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              历史记录
            </button>
          </div>

          {activeTab === 'pending' && (
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === pendingReturns.length &&
                    pendingReturns.length > 0
                  }
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">全选</span>
              </label>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : displayReturns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-gray-500">暂无{activeTab === 'pending' ? '待复核' : '历史'}记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayReturns.map((returnItem) => (
                <div
                  key={returnItem.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {activeTab === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(returnItem.id)}
                        onChange={() => toggleSelect(returnItem.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm text-primary-600">
                            {returnItem.rentalNumber}
                          </span>
                          <span
                            className={`badge ${
                              returnItem.status === 'pending_review'
                                ? 'bg-amber-100 text-amber-700'
                                : returnItem.status === 'reviewed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {returnItem.status === 'pending_review'
                              ? '待复核'
                              : returnItem.status === 'reviewed'
                              ? '已通过'
                              : '有异议'}
                          </span>
                          {returnItem.repairs && returnItem.repairs.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">关联维修:</span>
                              {returnItem.repairs.map((repair) => (
                                <span
                                  key={repair.id}
                                  className={`badge text-xs ${repairStatusLabels[repair.status]?.class}`}
                                >
                                  {repair.repairNumber} - {repairStatusLabels[repair.status]?.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(returnItem.returnedAt).toLocaleString('zh-CN')}
                        </div>
                      </div>

                      {returnItem.rental && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">租赁信息</div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span>客户: <strong>{returnItem.rental.customerName}</strong></span>
                            <span>电话: {returnItem.rental.customerPhone}</span>
                            <span>乐器: {returnItem.rental.items.map(i => i.instrumentName).join(', ')}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">归还人</div>
                          <div className="font-medium">
                            {returnItem.returnedByName}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">租赁天数</div>
                          <div className="font-medium">
                            {returnItem.totalRentalDays} 天
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">租赁费用</div>
                          <div className="font-medium text-green-600">
                            ¥{returnItem.totalRentalFee}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">损坏扣款</div>
                          <div className="font-medium text-red-600">
                            ¥{returnItem.damageDeduction}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">实际退还</div>
                          <div
                            className={`font-medium ${
                              returnItem.netRefund >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ¥{returnItem.netRefund}
                          </div>
                        </div>
                      </div>

                      {returnItem.damages.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            🔍 损坏判责依据 ({returnItem.damages.length} 项)
                          </div>
                          <div className="space-y-2">
                            {returnItem.damages.map((damage: DamageAssessment) => (
                              <div
                                key={damage.id}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {damage.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span
                                      className={`badge text-xs ${
                                        severityLabels[damage.severity]?.class
                                      }`}
                                    >
                                      {severityLabels[damage.severity]?.label}
                                    </span>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                      责任: {liabilityLabels[damage.liability]}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      评估人: {damage.assessedByName}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(damage.assessedAt).toLocaleString('zh-CN')}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-sm text-gray-500">预估费用</div>
                                  <div className="font-medium text-red-600">
                                    ¥{damage.estimatedRepairCost}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {returnItem.repairs && returnItem.repairs.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            🔧 关联维修记录
                          </div>
                          <div className="space-y-2">
                            {returnItem.repairs.map((repair) => (
                              <div
                                key={repair.id}
                                className="p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-primary-600">
                                      {repair.repairNumber}
                                    </span>
                                    <span className={`badge text-xs ${repairStatusLabels[repair.status]?.class}`}>
                                      {repairStatusLabels[repair.status]?.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      师傅: {repair.assignedToName || '未分配'}
                                    </span>
                                  </div>
                                  {repair.totalRepairCost > 0 && (
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">实际费用</div>
                                      <div className="font-medium text-primary-600">
                                        ¥{repair.totalRepairCost}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {repair.reportedIssues.map((issue, idx) => (
                                    <span key={idx} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                                      {issue}
                                    </span>
                                  ))}
                                </div>
                                {repair.partsUsed && repair.partsUsed.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    备件消耗: {repair.partsUsed.map(p => `${p.partName}×${p.quantity}`).join(', ')}
                                  </div>
                                )}
                                {repair.completedAt && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    完成时间: {new Date(repair.completedAt).toLocaleString('zh-CN')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {returnItem.actualRepairCost !== undefined && (
                        <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                          <div className="text-xs text-amber-600 mb-2 font-medium">
                            💰 实际维修成本（维修完成后回写）
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">备件费用:</span>
                              <span className="font-medium ml-1">¥{returnItem.actualPartsCost || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">工时费用:</span>
                              <span className="font-medium ml-1">¥{returnItem.actualLaborCost || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">总计:</span>
                              <span className="font-bold text-amber-700 ml-1">¥{returnItem.actualRepairCost || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                          押金: ¥{calculateDeposit(returnItem)} - 租金: ¥{returnItem.totalRentalFee} - 扣款: ¥{returnItem.damageDeduction} = <strong>实退: ¥{returnItem.netRefund}</strong>
                        </div>

                        {activeTab === 'pending' && hasRole('store_owner', 'admin') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDetailReturn(returnItem)}
                              className="btn-secondary text-sm py-1.5"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={() => handleSingleReview(returnItem.id, 'approve')}
                              className="btn-primary text-sm py-1.5"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => handleSingleReview(returnItem.id, 'dispute')}
                              className="btn-danger text-sm py-1.5"
                            >
                              异议
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {detailReturn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailReturn(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold">归还单详情 - {detailReturn.rentalNumber}</h3>
                <button
                  onClick={() => setDetailReturn(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {detailReturn.rental && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium mb-3 text-blue-700">📋 租赁信息</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">客户名称</div>
                        <div className="font-medium">{detailReturn.rental.customerName}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">联系电话</div>
                        <div>{detailReturn.rental.customerPhone}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">押金金额</div>
                        <div className="font-medium">¥{detailReturn.rental.depositAmount}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">租赁来源</div>
                        <div>{detailReturn.rental.source === 'school_partner' ? '学校合作' : '散客'}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-gray-500 text-sm mb-1">租赁乐器</div>
                      {detailReturn.rental.items.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between py-1 border-b border-blue-100 last:border-0">
                          <span>{item.instrumentName}</span>
                          <span className="text-gray-500">¥{item.dailyRate}/天 · {item.serialNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">🧮 费用结算明细</h4>
                  <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-600">押金金额</span>
                      <span className="text-lg font-medium">¥{calculateDeposit(detailReturn)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">租赁费用 ({detailReturn.totalRentalDays}天)</span>
                      <span className="text-green-600 font-medium">- ¥{detailReturn.totalRentalFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">损坏扣款</span>
                      <span className="text-red-600 font-medium">- ¥{detailReturn.damageDeduction}</span>
                    </div>
                    {detailReturn.actualRepairCost !== undefined && detailReturn.damageDeduction > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg mt-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-amber-700">预估扣款 vs 实际维修成本</span>
                          <span className={detailReturn.actualRepairCost > detailReturn.damageDeduction ? 'text-red-600' : 'text-green-600'}>
                            预估 ¥{detailReturn.damageDeduction} / 实际 ¥{detailReturn.actualRepairCost}
                            {detailReturn.actualRepairCost > detailReturn.damageDeduction && ' (亏损)'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                      <span className="text-lg font-bold">实际应退还</span>
                      <span className={`text-2xl font-bold ${detailReturn.netRefund >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ¥{detailReturn.netRefund}
                      </span>
                    </div>
                  </div>
                </div>

                {detailReturn.damages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">🔍 损坏判责依据</h4>
                    <div className="space-y-3">
                      {detailReturn.damages.map((damage, idx) => (
                        <div key={damage.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium">
                                {idx + 1}
                              </span>
                              <span className={`badge ${severityLabels[damage.severity]?.class}`}>
                                {severityLabels[damage.severity]?.label}
                              </span>
                              <span className="badge bg-purple-100 text-purple-700">
                                {liabilityLabels[damage.liability]}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">预估维修费</div>
                              <div className="font-bold text-red-600">¥{damage.estimatedRepairCost}</div>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{damage.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>评估人: {damage.assessedByName}</span>
                            <span>评估时间: {new Date(damage.assessedAt).toLocaleString('zh-CN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailReturn.repairs && detailReturn.repairs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">🔧 维修记录与备件消耗</h4>
                    <div className="space-y-4">
                      {detailReturn.repairs.map((repair) => (
                        <div key={repair.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-primary-600">{repair.repairNumber}</span>
                              <span className={`badge ${repairStatusLabels[repair.status]?.class}`}>
                                {repairStatusLabels[repair.status]?.label}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">维修师傅: </span>
                              <span className="font-medium">{repair.assignedToName || '未分配'}</span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">上报问题</div>
                            <div className="flex flex-wrap gap-2">
                              {repair.reportedIssues.map((issue, idx) => (
                                <span key={idx} className="px-2 py-1 bg-red-50 text-red-600 rounded text-sm">
                                  {issue}
                                </span>
                              ))}
                            </div>
                          </div>

                          {repair.diagnosis && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-1">诊断结果</div>
                              <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">{repair.diagnosis}</p>
                            </div>
                          )}

                          {repair.partsUsed && repair.partsUsed.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-2">📦 备件消耗明细</div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-1 font-medium text-gray-600">备件名称</th>
                                    <th className="text-center py-1 font-medium text-gray-600">SKU</th>
                                    <th className="text-right py-1 font-medium text-gray-600">数量</th>
                                    <th className="text-right py-1 font-medium text-gray-600">单价</th>
                                    <th className="text-right py-1 font-medium text-gray-600">小计</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {repair.partsUsed.map((part) => (
                                    <tr key={part.partId} className="border-b border-gray-100">
                                      <td className="py-2">{part.partName}</td>
                                      <td className="py-2 text-center text-gray-500 font-mono text-xs">{part.sku}</td>
                                      <td className="py-2 text-right">{part.quantity}</td>
                                      <td className="py-2 text-right">¥{part.unitCost}</td>
                                      <td className="py-2 text-right font-medium">¥{part.totalCost}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="font-bold">
                                    <td colSpan={4} className="py-2 text-right">备件合计</td>
                                    <td className="py-2 text-right text-primary-600">¥{repair.totalPartsCost}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}

                          <div className="p-3 bg-amber-50 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">工时</div>
                                <div className="font-medium">{repair.laborHours || 0}小时 × ¥{repair.laborRate}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">工时费用</div>
                                <div className="font-medium">¥{repair.totalLaborCost}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">维修总费用</div>
                                <div className="font-bold text-lg text-amber-700">¥{repair.totalRepairCost}</div>
                              </div>
                            </div>
                          </div>

                          {repair.completedAt && (
                            <div className="mt-3 text-xs text-gray-500 text-right">
                              完成时间: {new Date(repair.completedAt).toLocaleString('zh-CN')}
                              {repair.verifiedByName && ` · 验收人: ${repair.verifiedByName}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setDetailReturn(null)}
                    className="btn-secondary"
                  >
                    关闭
                  </button>
                  {activeTab === 'pending' && hasRole('store_owner', 'admin') && (
                    <>
                      <button
                        onClick={() => handleSingleReview(detailReturn.id, 'dispute')}
                        className="btn-danger"
                      >
                        标记异议
                      </button>
                      <button
                        onClick={() => handleSingleReview(detailReturn.id, 'approve')}
                        className="btn-primary"
                      >
                        确认通过
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
