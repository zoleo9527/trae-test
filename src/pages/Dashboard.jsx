import { Link } from 'react-router-dom';
import { 
  Clock, 
  XCircle, 
  Search, 
  CheckCircle, 
  FileText, 
  AlertTriangle, 
  DollarSign,
  ChevronRight,
  TrendingUp,
  Users,
  RotateCcw
} from 'lucide-react';
import { rectificationRecords, statusMap, typeMap, roleMap } from '../data/mockData';
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

export default function Dashboard({ currentUser }) {
  const { changeOrders, feeRecords, resetData } = useApp();

  const pendingOrders = changeOrders.filter(o => 
    o.status === 'pending_approval' || o.status === 'pending_owner_send' || o.status === 'pending_owner'
  );
  const rejectedOrders = changeOrders.filter(o => o.status === 'rejected');
  const needReviewOrders = changeOrders.filter(o => 
    o.status === 'pending_owner_send' || o.status === 'pending_owner'
  );
  const completedOrders = changeOrders.filter(o => o.status === 'completed');

  const pendingRectification = rectificationRecords.filter(r => 
    r.status === 'pending' || r.status === 'in_progress'
  );

  const pendingFees = feeRecords.filter(f => 
    f.status === 'pending_confirm' || f.status === 'pending_pay'
  );

  const totalFeeChange = changeOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.costChange.difference, 0);

  const stats = [
    { 
      label: '待处理', 
      value: pendingOrders.length + pendingRectification.length + pendingFees.length, 
      icon: Clock, 
      color: 'warning',
      description: '需要您处理的事项'
    },
    { 
      label: '已驳回', 
      value: rejectedOrders.length, 
      icon: XCircle, 
      color: 'danger',
      description: '需要重新提交'
    },
    { 
      label: '需回查', 
      value: needReviewOrders.length, 
      icon: Search, 
      color: 'primary',
      description: '待业主确认项目'
    },
    { 
      label: '已完成', 
      value: completedOrders.length, 
      icon: CheckCircle, 
      color: 'success',
      description: '本月完成变更'
    },
  ];

  const colorMap = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    danger: 'bg-red-50 border-red-200 text-red-600',
    primary: 'bg-blue-50 border-blue-200 text-blue-600',
    success: 'bg-green-50 border-green-200 text-green-600',
  };

  const iconBgMap = {
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className={cn('p-6 rounded-xl border', colorMap[stat.color])}>
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-3 rounded-lg', iconBgMap[stat.color])}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm font-medium mt-1">{stat.label}</div>
            <div className="text-xs opacity-70 mt-1">{stat.description}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="font-semibold text-gray-900">费用变更统计</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ¥{totalFeeChange.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">累计变更费用</div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">已确认</span>
              <span className="font-medium text-green-600">
                +¥{changeOrders.filter(o => o.status === 'completed' && o.costChange.difference > 0)
                  .reduce((sum, o) => sum + o.costChange.difference, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">待确认</span>
              <span className="font-medium text-yellow-600">
                ¥{pendingOrders.reduce((sum, o) => sum + o.costChange.difference, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="font-semibold text-gray-900">当前角色</h3>
          </div>
          <div className="text-xl font-bold text-gray-900">{currentUser.name}</div>
          <div className={cn(
            'text-sm mt-1 px-2 py-0.5 inline-block rounded',
            roleMap[currentUser.role]?.color === 'primary' ? 'bg-blue-100 text-blue-700' :
            roleMap[currentUser.role]?.color === 'success' ? 'bg-green-100 text-green-700' :
            'bg-yellow-100 text-yellow-700'
          )}>
            {roleMap[currentUser.role]?.label}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">您的待办事项</div>
            <div className="text-2xl font-bold text-gray-900">
              {pendingOrders.filter(o => o.currentHandler === currentUser.role).length}
            </div>
            <div className="text-xs text-gray-500">项待处理</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">快捷操作</h3>
          </div>
          <div className="space-y-2">
            <Link to="/change-orders" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">变更签认</div>
                <div className="text-xs text-gray-500">查看和处理变更单</div>
              </div>
            </Link>
            <Link to="/rectification" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">整改追踪</div>
                <div className="text-xs text-gray-500">管理整改记录</div>
              </div>
            </Link>
            <Link to="/fee-tracking" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">费用确认</div>
                <div className="text-xs text-gray-500">追踪费用变更</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="font-semibold text-gray-900">待处理变更单</h3>
            </div>
            <Link to="/change-orders" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingOrders.slice(0, 3).map((order) => (
              <Link 
                key={order.id} 
                to={`/change-orders/${order.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{order.title}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{order.projectName}</div>
                    <div className="text-xs text-gray-400 mt-1">{order.createdAt}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">v{order.version}</div>
                    <div className={cn(
                      'text-xs font-medium mt-1',
                      order.costChange.difference > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {order.costChange.difference > 0 ? '+' : ''}¥{order.costChange.difference.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {pendingOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                暂无待处理变更单
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
              <h3 className="font-semibold text-gray-900">进行中整改</h3>
            </div>
            <Link to="/rectification" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRectification.slice(0, 3).map((record) => (
              <div key={record.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{record.title}</span>
                      <StatusBadge status={record.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{record.projectName}</div>
                    <div className="text-xs text-gray-400 mt-1">负责人：{record.handler}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">截止日期</div>
                    <div className="text-sm font-medium text-gray-900">{record.deadline}</div>
                  </div>
                </div>
              </div>
            ))}
            {pendingRectification.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                暂无进行中整改
              </div>
            )}
          </div>
        </div>
      </div>

      {rejectedOrders.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <div className="flex items-center mb-4">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-700">已驳回（需重新提交）</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {rejectedOrders.map((order) => (
              <Link 
                key={order.id} 
                to={`/change-orders/${order.id}`}
                className="block bg-white p-4 rounded-lg border border-red-100 hover:border-red-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{order.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{order.projectName}</div>
                    <div className="text-xs text-red-600 mt-2">
                      驳回原因：{order.approvals.manager?.comment || '请查看详情'}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                    v{order.version}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={resetData}
          className="flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置演示数据
        </button>
      </div>
    </div>
  );
}
