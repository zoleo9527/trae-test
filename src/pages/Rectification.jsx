import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  ShieldAlert,
  Clock,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { rectificationRecords, statusMap, typeMap } from '../data/mockData';
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

export default function Rectification({ currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDropdown, setFilterDropdown] = useState(null);

  const filteredRecords = rectificationRecords.filter(record => {
    const matchSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = filteredRecords.filter(r => r.status === 'pending').length;
  const inProgressCount = filteredRecords.filter(r => r.status === 'in_progress').length;
  const completedCount = filteredRecords.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
              <div className="text-sm text-yellow-600">待处理</div>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
              <div className="text-sm text-blue-600">整改中</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{completedCount}</div>
              <div className="text-sm text-green-600">已完成</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索整改记录..."
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
                  {['all', 'pending', 'in_progress', 'completed'].map(status => (
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

        {currentUser.role === 'supervisor' && (
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            新建整改单
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredRecords.map((record) => (
          <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  record.type === 'quality' ? 'bg-orange-100' : 'bg-red-100'
                )}>
                  {record.type === 'quality' ? (
                    <AlertTriangle className={cn('w-5 h-5', record.type === 'quality' ? 'text-orange-600' : 'text-red-600')} />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{record.title}</span>
                    <StatusBadge status={record.status} />
                  </div>
                  <div className="text-xs text-gray-500">{typeMap[record.type]?.label}</div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{record.id}</span>
            </div>

            <div className="text-sm text-gray-600 mb-4">{record.description}</div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-gray-500">项目：</span>
                  <span className="text-gray-700">{record.projectName}</span>
                </div>
                <div>
                  <span className="text-gray-500">负责人：</span>
                  <span className="text-gray-700">{record.handler}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">截止日期：</span>
                <span className={cn(
                  'font-medium',
                  record.status !== 'completed' && new Date(record.deadline) < new Date() 
                    ? 'text-red-600' 
                    : 'text-gray-700'
                )}>
                  {record.deadline}
                </span>
              </div>
              <div className="flex space-x-2">
                {record.status === 'in_progress' && currentUser.role === 'supervisor' && (
                  <button className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                    验收
                  </button>
                )}
                {record.status === 'pending' && currentUser.role === 'supervisor' && (
                  <button className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                    派工
                  </button>
                )}
                <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无符合条件的整改记录</p>
        </div>
      )}
    </div>
  );
}
