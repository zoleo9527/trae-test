import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Package, 
  Building2, 
  Settings,
  ChevronDown,
  Clock
} from 'lucide-react';
import { statusMap, typeMap, roleMap } from '../data/mockData';
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

function TypeIcon({ type }) {
  const iconMap = {
    material: Package,
    structure: Building2,
    process: Settings,
  };
  const Icon = iconMap[type] || FileText;
  return <Icon className="w-4 h-4" />;
}

export default function ChangeOrders({ currentUser }) {
  const { changeOrders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filterDropdown, setFilterDropdown] = useState(null);

  const filteredOrders = changeOrders.filter(order => {
    const matchSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchType = typeFilter === 'all' || order.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const myPendingOrders = filteredOrders.filter(o => o.currentHandler === currentUser.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索变更单..."
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
                  {['all', 'pending_approval', 'pending_owner', 'rejected', 'completed'].map(status => (
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

          <div className="relative">
            <button
              onClick={() => setFilterDropdown(filterDropdown === 'type' ? null : 'type')}
              className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">
                {typeFilter === 'all' ? '全部类型' : typeMap[typeFilter]?.label}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
            </button>
            {filterDropdown === 'type' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterDropdown(null)} />
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {['all', 'material', 'structure', 'process'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilter(type);
                        setFilterDropdown(null);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center',
                        typeFilter === type ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                      )}
                    >
                      {type !== 'all' && <TypeIcon type={type} />}
                      <span className={type !== 'all' ? 'ml-2' : ''}>
                        {type === 'all' ? '全部类型' : typeMap[type]?.label}
                      </span>
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
            新建变更单
          </button>
        )}
      </div>

      {myPendingOrders.length > 0 && currentUser.role !== 'service' && (
        <div className="bg-primary-50 rounded-xl border border-primary-200 p-4">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-primary-600 mr-2" />
            <span className="font-medium text-primary-700">
              需要您处理的变更单 ({myPendingOrders.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {myPendingOrders.map(order => (
              <Link
                key={order.id}
                to={`/change-orders/${order.id}`}
                className="flex items-center p-3 bg-white rounded-lg border border-primary-100 hover:border-primary-300 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <TypeIcon type={order.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{order.title}</div>
                  <div className="text-xs text-gray-500">{order.projectName}</div>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                变更单号
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                项目名称
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                类型
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                费用变更
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                当前处理
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                版本
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/change-orders/${order.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                    {order.id}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.projectName}</div>
                  <div className="text-xs text-gray-500">{order.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <TypeIcon type={order.type} />
                    <span className="ml-2">{typeMap[order.type]?.label}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'text-sm font-medium',
                    order.costChange.difference > 0 ? 'text-red-600' : 
                    order.costChange.difference < 0 ? 'text-green-600' : 'text-gray-600'
                  )}>
                    {order.costChange.difference > 0 ? '+' : ''}¥{order.costChange.difference.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4">
                  {order.currentHandler ? (
                    <span className={cn(
                      'text-xs px-2 py-1 rounded',
                      roleMap[order.currentHandler]?.color === 'primary' ? 'bg-blue-100 text-blue-700' :
                      roleMap[order.currentHandler]?.color === 'success' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {roleMap[order.currentHandler]?.label}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">已完成</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.createdAt}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">v{order.version}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无符合条件的变更单</p>
          </div>
        )}
      </div>
    </div>
  );
}
