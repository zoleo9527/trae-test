import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { Return, DamageAssessment } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ReviewPage() {
  const [pendingReturns, setPendingReturns] = useState<Return[]>([]);
  const [allReturns, setAllReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const { hasRole } = useAuth();
  const [detailReturn, setDetailReturn] = useState<Return | null>(null);
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

  const displayReturns = activeTab === 'pending' ? pendingReturns : allReturns;

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
                        <div className="flex items-center gap-3">
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
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(returnItem.returnedAt).toLocaleString('zh-CN')}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                          <div className="text-xs text-gray-500 mb-2">
                            损坏评估 ({returnItem.damages.length} 项)
                          </div>
                          <div className="space-y-2">
                            {returnItem.damages.map((damage: DamageAssessment) => (
                              <div
                                key={damage.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {damage.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`badge text-xs ${
                                        severityLabels[damage.severity]?.class
                                      }`}
                                    >
                                      {severityLabels[damage.severity]?.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      责任方: {liabilityLabels[damage.liability]}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      评估人: {damage.assessedByName}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
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

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm">
                          <span>损坏扣款: <span className="font-medium text-red-600">¥{returnItem.damageDeduction}</span></span>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">归还单详情</h3>
                <button
                  onClick={() => setDetailReturn(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium mb-3">费用明细</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>租赁费用</span>
                      <span>¥{detailReturn.totalRentalFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>押金</span>
                      <span>¥{(detailReturn.netRefund + detailReturn.totalRentalFee + detailReturn.damageDeduction) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>损坏扣款</span>
                      <span>-¥{detailReturn.damageDeduction}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold">
                      <span>实际退还</span>
                      <span className={detailReturn.netRefund >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ¥{detailReturn.netRefund}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDetailReturn(null)}
                    className="btn-secondary"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => handleSingleReview(detailReturn.id, 'approve')}
                    className="btn-primary"
                  >
                    确认通过
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
