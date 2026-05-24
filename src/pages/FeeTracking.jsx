import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle, 
  Clock,
  ChevronDown,
  FileText,
  Download,
  Check,
  AlertCircle
} from 'lucide-react';
import { statusMap, typeMap } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';

function StatusBadge({ status }) {
  const config = statusMap[status] || { label: status, color: 'default' };
  const colorClasses = {
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
    primary: 'bg-blue-100 text-blue-700',
    default: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', colorClasses[config.color])}>
      {config.label}
    </span>
  );
}

export default function FeeTracking({ currentUser }) {
  const { feeRecords, confirmFee, markFeePaid } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDropdown, setFilterDropdown] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  const filteredRecords = feeRecords.filter(record => {
    const matchSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.relatedId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = filteredRecords
    .filter(r => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalPaid = filteredRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleConfirmFee = (feeId) => {
    confirmFee(feeId, currentUser.id);
    setShowConfirmModal(null);
  };

  const handleMarkPaid = (feeId) => {
    markFeePaid(feeId, currentUser.id);
    setShowConfirmModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">待确认费用</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            ¥{filteredRecords.filter(r => r.status === 'pending_confirm').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">待支付费用</span>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            ¥{filteredRecords.filter(r => r.status === 'pending_pay').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">已支付费用</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            ¥{totalPaid.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索费用记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterDropdown(filterDropdown === 'status' ? null : 'status')}
              className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-700">
                {statusFilter === 'all' ? '全部状态' : statusMap[statusFilter]?.label}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
            </button>
            {filterDropdown === 'status' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterDropdown(null)} />
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {['all', 'pending_confirm', 'pending_pay', 'paid'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setFilterDropdown(null);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-gray-50',
                        statusFilter === status ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                      )}
                    >
                      {status === 'all' ? '全部状态' : statusMap[status]?.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4 mr-2 text-gray-600" />
          导出报表
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                费用编号
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                项目名称
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                费用类型
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                关联变更单
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-primary-600">{record.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{record.projectName}</div>
                  <div className="text-xs text-gray-500">{record.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    {typeMap[record.type]?.label}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    to={`/change-orders/${record.relatedId}`} 
                    className="text-sm text-primary-600 cursor-pointer hover:underline"
                  >
                    {record.relatedId}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">
                    ¥{record.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {record.createdAt}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {record.status === 'pending_confirm' && currentUser.role === 'manager' && (
                      <button 
                        onClick={() => setShowConfirmModal({ type: 'confirm', id: record.id })}
                        className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        确认
                      </button>
                    )}
                    {record.status === 'pending_pay' && currentUser.role === 'service' && (
                      <button 
                        onClick={() => setShowConfirmModal({ type: 'paid', id: record.id, amount: record.amount })}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        标记已付
                      </button>
                    )}
                    {record.status === 'paid' && (
                      <span className="px-3 py-1.5 text-sm text-gray-500">
                        {record.paidAt}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无符合条件的费用记录</p>
          </div>
        )}
      </div>

      {currentUser.role === 'service' && filteredRecords.filter(r => r.status === 'pending_pay').length > 0 && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
          <h3 className="font-medium text-yellow-700 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            客服收款提醒
          </h3>
          <p className="text-sm text-yellow-600 mb-4">
            以下项目的变更费用待业主支付，请及时跟进。
          </p>
          <div className="grid grid-cols-2 gap-4">
            {filteredRecords.filter(r => r.status === 'pending_pay').map(record => (
              <div key={record.id} className="bg-white p-4 rounded-lg border border-yellow-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{record.title}</span>
                  <span className="text-lg font-bold text-gray-900">¥{record.amount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">{record.projectName}</div>
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors">
                    发送收款提醒
                  </button>
                  <button 
                    onClick={() => setShowConfirmModal({ type: 'paid', id: record.id, amount: record.amount })}
                    className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    标记已付
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showConfirmModal.type === 'confirm' ? '确认费用' : '标记已支付'}
            </h3>
            {showConfirmModal.type === 'paid' && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  确认已收到业主支付的 ¥{showConfirmModal.amount?.toLocaleString()} 费用。
                </p>
              </div>
            )}
            {showConfirmModal.type === 'confirm' && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  确认该费用记录无误后，将进入【待业主支付】状态。
                </p>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => 
                  showConfirmModal.type === 'confirm' 
                    ? handleConfirmFee(showConfirmModal.id)
                    : handleMarkPaid(showConfirmModal.id)
                }
                className={cn(
                  'flex-1 py-2 rounded-lg text-white transition-colors flex items-center justify-center',
                  showConfirmModal.type === 'confirm' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-green-600 hover:bg-green-700'
                )}
              >
                <Check className="w-4 h-4 mr-2" />
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
