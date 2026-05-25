import {
    AlertCircle,
    ArrowRight,
    Clock,
    CreditCard,
    FileWarning,
    Layers,
    PhoneCall,
    Scale,
    TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PriorityBadge from '../components/PriorityBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Dashboard() {
  const { stats, myTasks, currentUser, creditOrders, customers } = useApp();
  const [activeTab, setActiveTab] = useState('all');

  const filteredTasks = myTasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return task.status === 'pending';
    if (activeTab === 'in_progress') return task.status === 'in_progress';
    if (activeTab === 'rejected') return task.status === 'rejected';
    return true;
  });

  const overdueOrders = creditOrders.filter(o => o.status === 'overdue' || o.status === 'bad_debt');
  const warningOrders = creditOrders.filter(o => {
    const dueDate = new Date(o.dueDate);
    const now = new Date();
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 7 && o.status === 'normal';
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">工作台</h1>
        <p className="text-gray-500 mt-1">
          欢迎回来，{currentUser.name}。以下是今日需要处理的事项。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待处理任务"
          value={stats.pendingTasks}
          subtitle="需要您处理的事项"
          icon={Clock}
          color="warning"
          badge={
            stats.overdueTasks > 0 && (
              <span className="text-xs text-danger-600 font-medium">
                {stats.overdueTasks} 项已超时
              </span>
            )
          }
        />
        <StatCard
          title="进行中任务"
          value={stats.inProgressTasks}
          subtitle="正在处理的事项"
          icon={TrendingUp}
          color="info"
        />
        <StatCard
          title="已驳回"
          value={stats.rejectedTasks}
          subtitle="需要重新提交"
          icon={AlertCircle}
          color="danger"
        />
        <StatCard
          title="逾期账款"
          value={`¥${(stats.totalOverdueAmount / 10000).toFixed(1)}万`}
          subtitle="需催办的逾期金额"
          icon={CreditCard}
          color="danger"
          to="/collection"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">我的待办</h2>
              <div className="flex gap-2">
                {['all', 'pending', 'in_progress', 'rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'all' && '全部'}
                    {tab === 'pending' && '待处理'}
                    {tab === 'in_progress' && '进行中'}
                    {tab === 'rejected' && '已驳回'}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        截止日期：{task.dueDate}
                        {task.rejectReason && (
                          <span className="ml-2 text-danger-600">
                            驳回原因：{task.rejectReason}
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      to={getTaskLink(task)}
                      className="flex items-center gap-1 text-primary-600 text-sm hover:text-primary-700"
                    >
                      处理
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-400">
                  暂无待办事项
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">需回查</h2>
              <Link to="/credit" className="text-primary-600 text-sm hover:text-primary-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {[...overdueOrders, ...warningOrders].slice(0, 4).map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {order.customerName} - {order.id}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        欠款：¥{order.totalAmount - order.paidAmount}
                        {order.status === 'overdue' && (
                          <span className="ml-2 text-danger-600">已逾期</span>
                        )}
                        {order.status === 'normal' && (
                          <span className="ml-2 text-warning-600">即将到期</span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
              {overdueOrders.length === 0 && warningOrders.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-400">
                  暂无需要回查的账款
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">快捷入口</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/weighing"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <Scale size={24} className="text-primary-600" />
                <span className="text-sm text-primary-700">新建过磅单</span>
              </Link>
              <Link
                to="/grading"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-info-50 hover:bg-info-100 transition-colors"
              >
                <Layers size={24} className="text-info-600" />
                <span className="text-sm text-info-700">分级配货</span>
              </Link>
              <Link
                to="/collection"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warning-50 hover:bg-warning-100 transition-colors"
              >
                <PhoneCall size={24} className="text-warning-600" />
                <span className="text-sm text-warning-700">回款催办</span>
              </Link>
              <Link
                to="/complaints"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-danger-50 hover:bg-danger-100 transition-colors"
              >
                <FileWarning size={24} className="text-danger-600" />
                <span className="text-sm text-danger-700">客诉处理</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">客户信用概览</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">总客户数</span>
                <span className="text-sm font-medium text-gray-800">{stats.totalCustomers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">当前赊销总额</span>
                <span className="text-sm font-medium text-gray-800">
                  ¥{(stats.totalCreditAmount / 10000).toFixed(1)}万
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">逾期金额</span>
                <span className="text-sm font-medium text-danger-600">
                  ¥{(stats.totalOverdueAmount / 10000).toFixed(1)}万
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger-500 rounded-full"
                  style={{
                    width: `${stats.totalCreditAmount > 0 ? (stats.totalOverdueAmount / stats.totalCreditAmount * 100) : 0}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                逾期占比：{stats.totalCreditAmount > 0 ? ((stats.totalOverdueAmount / stats.totalCreditAmount) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTaskLink(task) {
  switch (task.type) {
    case 'weighing':
      return '/weighing';
    case 'grading':
      return '/grading';
    case 'collection':
      return '/collection';
    case 'loss':
      return '/loss';
    case 'complaint':
      return '/complaints';
    default:
      return '/';
  }
}
