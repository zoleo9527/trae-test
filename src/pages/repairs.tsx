import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { Repair, PartUsage } from '../types';
import { useAuth } from '../context/AuthContext';

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });
  const [detailRepair, setDetailRepair] = useState<Repair | null>(null);
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPart, setNewPart] = useState<Partial<PartUsage>>({});
  const { user, hasRole } = useAuth();

  useEffect(() => {
    loadRepairs();
  }, [filters]);

  const loadRepairs = async () => {
    setLoading(true);
    const result: any = await api.repairs.list({
      ...filters,
      pageSize: 100,
    });
    setRepairs(result.data);
    setLoading(false);
  };

  const handleStartRepair = async (id: string) => {
    await api.repairs.start(id);
    loadRepairs();
  };

  const handleAddPart = async () => {
    if (!detailRepair || !newPart.partName || !newPart.quantity || !newPart.unitCost) return;
    
    await api.repairs.addPart(detailRepair.id, {
      partId: `part-${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      ...newPart,
    });
    setShowAddPart(false);
    setNewPart({});
    const updated: any = await api.repairs.get(detailRepair.id);
    setDetailRepair(updated);
    loadRepairs();
  };

  const handleSaveLabor = async () => {
    if (!detailRepair) return;
    try {
      const updated: any = await api.repairs.updateLabor(detailRepair.id, {
        laborHours: detailRepair.laborHours || 0,
        diagnosis: detailRepair.diagnosis,
      });
      setDetailRepair(updated);
      loadRepairs();
      alert('工时已保存，归还单成本已同步更新！');
    } catch (error) {
      console.error('保存工时失败:', error);
    }
  };

  const handleCompleteRepair = async () => {
    if (!detailRepair) return;
    await api.repairs.complete(detailRepair.id, {
      diagnosis: detailRepair.diagnosis || '',
      laborHours: detailRepair.laborHours || 0,
    });
    setDetailRepair(null);
    loadRepairs();
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending: { label: '待处理', class: 'bg-amber-100 text-amber-700' },
    in_progress: { label: '进行中', class: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', class: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-700' },
  };

  const priorityLabels: Record<string, { label: string; class: string }> = {
    low: { label: '低', class: 'bg-gray-100 text-gray-700' },
    medium: { label: '中', class: 'bg-blue-100 text-blue-700' },
    high: { label: '高', class: 'bg-orange-100 text-orange-700' },
    urgent: { label: '紧急', class: 'bg-red-100 text-red-700' },
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">维修保养</h1>
          <p className="text-gray-500 mt-1">维修进度管理 · 备件消耗追踪</p>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              className="input-field max-w-xs"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
            <select
              className="input-field max-w-xs"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">全部优先级</option>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔧</div>
              <p className="text-gray-500">暂无维修记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {repairs.map((repair) => (
                <div
                  key={repair.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors cursor-pointer"
                  onClick={() => setDetailRepair(repair)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-primary-600">
                        {repair.repairNumber}
                      </span>
                      <span className={`badge ${statusLabels[repair.status]?.class}`}>
                        {statusLabels[repair.status]?.label}
                      </span>
                      <span className={`badge ${priorityLabels[repair.priority]?.class}`}>
                        {priorityLabels[repair.priority]?.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(repair.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">乐器</div>
                      <div className="font-medium">{repair.instrumentName}</div>
                      <div className="text-xs text-gray-400">{repair.serialNumber}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">客户</div>
                      <div className="font-medium">{repair.customerName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">维修师傅</div>
                      <div className="font-medium">{repair.assignedToName || '未分配'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">预估费用</div>
                      <div className="font-medium text-primary-600">
                        ¥{repair.totalRepairCost || '待定'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {repair.reportedIssues.map((issue, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>

                  {repair.notes && (
                    <div className="mt-3 text-sm text-gray-500">
                      备注: {repair.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {detailRepair && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">维修单详情 - {detailRepair.repairNumber}</h3>
                <button
                  onClick={() => setDetailRepair(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">乐器信息</div>
                    <div className="font-medium">{detailRepair.instrumentName}</div>
                    <div className="text-sm text-gray-500">{detailRepair.serialNumber}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">状态</div>
                    <span className={`badge ${statusLabels[detailRepair.status]?.class}`}>
                      {statusLabels[detailRepair.status]?.label}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">上报问题</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailRepair.reportedIssues.map((issue, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">诊断结果</h4>
                    {detailRepair.status === 'in_progress' && hasRole('repair_technician', 'admin') && (
                      <span className="text-xs text-gray-500">可编辑</span>
                    )}
                  </div>
                  {detailRepair.status === 'in_progress' && hasRole('repair_technician', 'admin') ? (
                    <textarea
                      className="input-field"
                      rows={3}
                      value={detailRepair.diagnosis || ''}
                      onChange={(e) => setDetailRepair({ ...detailRepair, diagnosis: e.target.value })}
                      placeholder="请输入诊断结果..."
                    />
                  ) : (
                    <p className="text-gray-600 p-3 bg-gray-50 rounded-lg">
                      {detailRepair.diagnosis || '暂无诊断'}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">工时录入</h4>
                    {detailRepair.status === 'in_progress' && hasRole('repair_technician', 'admin') && (
                      <span className="text-xs text-green-600">可编辑 · 修改后保存即可同步更新归还单</span>
                    )}
                  </div>
                  {detailRepair.status === 'in_progress' && hasRole('repair_technician', 'admin') ? (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex-1">
                        <label className="text-sm text-gray-600 mb-1 block">工时（小时）</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="input-field"
                          value={detailRepair.laborHours || ''}
                          onChange={(e) => {
                            const hours = parseFloat(e.target.value) || 0;
                            setDetailRepair({
                              ...detailRepair,
                              laborHours: hours,
                              totalLaborCost: hours * detailRepair.laborRate,
                              totalRepairCost: hours * detailRepair.laborRate + detailRepair.totalPartsCost,
                            });
                          }}
                          placeholder="输入工时..."
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">工时单价</div>
                        <div className="font-medium">¥{detailRepair.laborRate}/小时</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">工时费用</div>
                        <div className="font-bold text-blue-600">
                          ¥{(detailRepair.laborHours || 0) * detailRepair.laborRate}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500">工时</div>
                        <div className="font-medium">{detailRepair.laborHours || 0} 小时</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">单价</div>
                        <div className="font-medium">¥{detailRepair.laborRate}/小时</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">工时费用</div>
                        <div className="font-bold">¥{detailRepair.totalLaborCost}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">备件消耗</h4>
                    {detailRepair.status === 'in_progress' && hasRole('repair_technician', 'admin') && (
                      <button
                        onClick={() => setShowAddPart(true)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        + 添加备件
                      </button>
                    )}
                  </div>

                  {showAddPart && (
                    <div className="p-4 bg-blue-50 rounded-lg mb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="备件名称"
                          value={newPart.partName || ''}
                          onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                        />
                        <input
                          type="number"
                          className="input-field"
                          placeholder="数量"
                          value={newPart.quantity || ''}
                          onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                        />
                        <input
                          type="number"
                          className="input-field"
                          placeholder="单价 (¥)"
                          value={newPart.unitCost || ''}
                          onChange={(e) => setNewPart({ ...newPart, unitCost: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowAddPart(false)} className="btn-secondary text-sm">
                          取消
                        </button>
                        <button onClick={handleAddPart} className="btn-primary text-sm">
                          确认添加
                        </button>
                      </div>
                    </div>
                  )}

                  {detailRepair.partsUsed.length > 0 ? (
                    <div className="space-y-2">
                      {detailRepair.partsUsed.map((part) => (
                        <div key={part.partId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{part.partName}</div>
                            <div className="text-sm text-gray-500">{part.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{part.quantity} × ¥{part.unitCost}</div>
                            <div className="font-medium">¥{part.totalCost}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">暂无备件记录</div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-medium mb-3">费用结算</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>工时 ({detailRepair.laborHours || 0}小时 × ¥{detailRepair.laborRate}/h)</span>
                      <span>¥{detailRepair.totalLaborCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>配件费用</span>
                      <span>¥{detailRepair.totalPartsCost}</span>
                    </div>
                    <div className="border-t border-amber-300 pt-2 mt-2 flex justify-between font-bold">
                      <span>总计</span>
                      <span className="text-lg">¥{detailRepair.totalRepairCost}</span>
                    </div>
                  </div>
                </div>

                {detailRepair.status !== 'completed' && (
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button onClick={() => setDetailRepair(null)} className="btn-secondary">
                      关闭
                    </button>
                    {detailRepair.status === 'pending' && hasRole('repair_technician', 'admin') && (
                      <button
                        onClick={() => {
                          handleStartRepair(detailRepair.id);
                          setDetailRepair(null);
                        }}
                        className="btn-primary"
                      >
                        开始维修
                      </button>
                    )}
                    {detailRepair.status === 'in_progress' && hasRole('repair_technician', 'admin') && (
                      <>
                        <button onClick={handleSaveLabor} className="btn-secondary">
                          保存工时
                        </button>
                        <button onClick={handleCompleteRepair} className="btn-primary">
                          完成维修
                        </button>
                      </>
                    )}
                  </div>
                )}
                {detailRepair.status === 'completed' && (
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button onClick={() => setDetailRepair(null)} className="btn-secondary">
                      关闭
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
