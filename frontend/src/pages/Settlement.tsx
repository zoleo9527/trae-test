import { StatusBadge } from '@/components/shared/StatusBadge';
import { useFilteredData } from '@/hooks/useFilteredData';
import { useRole } from '@/hooks/useRole';
import type { DisputeStatus } from '@/types';
import { AlertTriangle, CheckCircle, Lock, Scale, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Settlement() {
  const { disputes, canViewDisputes } = useFilteredData();
  const navigate = useNavigate();
  const { canRuleDispute, currentRole } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');

  if (!canViewDisputes) {
    return (
      <div className="p-6">
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">权限不足</h3>
          <p className="text-sm text-gray-500">
            您当前角色为 {currentRole === 'team_leader' ? '班组长' : currentRole}，暂无权限访问结算中心
          </p>
          <p className="text-xs text-gray-400 mt-2">
            请联系项目负责人获取相关权限
          </p>
        </div>
      </div>
    );
  }

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: disputes.length,
    pending: disputes.filter(d => d.status === 'pending').length,
    negotiating: disputes.filter(d => d.status === 'negotiating').length,
    ruled: disputes.filter(d => d.status === 'ruled').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    appealed: disputes.filter(d => d.status === 'appealed').length,
  };

  const totalDisputedAmount = disputes
    .filter(d => d.status !== 'resolved')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">结算中心</h1>
        <p className="text-sm text-gray-500 mt-1">处理结算争议、查看对账单、预警结算风险</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理争议</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">
                {state.disputes.filter(d => ['pending', 'negotiating'].includes(d.status)).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-warning-50">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">争议总金额</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">
                ¥{totalDisputedAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-danger-50">
              <Scale className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已解决争议</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">
                {state.disputes.filter(d => d.status === 'resolved').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success-50">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as DisputeStatus | 'all')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              statusFilter === status
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? '全部' :
             status === 'pending' ? '待处理' :
             status === 'negotiating' ? '协商中' :
             status === 'ruled' ? '已裁定' :
             status === 'resolved' ? '已解决' :
             status === 'appealed' ? '已申诉' : status}
            <span className="ml-1.5 text-gray-400">({count})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索争议单..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                争议单号
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                类型
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                争议金额
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDisputes.map((dispute) => (
              <tr
                key={dispute.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/settlement/${dispute.id}`)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-warning-500" />
                    <span className="text-sm font-medium text-gray-800">{dispute.code}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-700">{dispute.title}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-700">
                    {dispute.type === 'material' ? '材料争议' :
                     dispute.type === 'labor' ? '人工争议' :
                     dispute.type === 'rework' ? '返工争议' : '其他争议'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-danger-600">
                    ¥{dispute.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={dispute.status} type="dispute" />
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-500">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {dispute.status === 'pending' && canRuleDispute && (
                      <button className="btn-primary text-xs py-1.5">
                        裁定
                      </button>
                    )}
                    <button className="text-sm text-primary-600 hover:text-primary-700">
                      详情
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDisputes.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success-500" />
            <p className="text-gray-500">暂无争议记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
