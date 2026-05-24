import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  RefreshCcw,
  CheckCircle,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
  FileWarning,
  DollarSign
} from 'lucide-react';
import { visaCases, refundCases } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const today = new Date('2024-01-26');

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingState text="正在加载工作台数据..." />;
  }

  const pendingCases = visaCases.filter(c => 
    ['pending_supplement', 'processing', 'under_review', 'in_progress', 'overdue'].includes(c.status)
  );
  const rejectedCases = visaCases.filter(c => c.status === 'rejected');
  const supplementCases = visaCases.filter(c => 
    c.supplements && c.supplements.some(s => ['required', 'rejected', 'under_review'].includes(s.status))
  );
  const urgentCases = visaCases.filter(c => {
    const deadline = new Date(c.deadline);
    const daysLeft = differenceInDays(deadline, today);
    return daysLeft <= 7 && c.status !== 'approved';
  });

  const stats = [
    { 
      label: '待处理案件', 
      value: pendingCases.length, 
      icon: Clock, 
      color: 'bg-blue-500',
      link: '/cases?filter=pending'
    },
    { 
      label: '已驳回案件', 
      value: rejectedCases.length, 
      icon: AlertTriangle, 
      color: 'bg-red-500',
      link: '/cases?filter=rejected'
    },
    { 
      label: '需回查补件', 
      value: supplementCases.length, 
      icon: RefreshCcw, 
      color: 'bg-orange-500',
      link: '/supplements'
    },
    { 
      label: '本周将到期', 
      value: urgentCases.length, 
      icon: Calendar, 
      color: 'bg-amber-500',
      link: '/cases?filter=urgent'
    }
  ];

  const myTasks = visaCases
    .filter(c => c.status !== 'approved')
    .slice(0, 5)
    .map(c => {
      const deadline = new Date(c.deadline);
      const daysLeft = differenceInDays(deadline, today);
      return { ...c, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-primary-600">
                <span>查看详情</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">今日待办</h3>
              <Link to="/cases" className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {myTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>太棒了！今日没有待办任务</p>
                </div>
              ) : (
                myTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/cases/${task.id}`}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{task.studentName}</p>
                        <StatusBadge status={task.status} text={task.statusText} />
                      </div>
                      <p className="text-sm text-gray-500">{task.country} · {task.visaType}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        task.daysLeft < 0 ? 'text-red-600' :
                        task.daysLeft <= 3 ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {task.daysLeft < 0 ? `已逾期 ${Math.abs(task.daysLeft)} 天` :
                         task.daysLeft === 0 ? '今天截止' :
                         `剩余 ${task.daysLeft} 天`}
                      </div>
                      <p className="text-xs text-gray-400">
                        截止 {format(new Date(task.deadline), 'MM月dd日', { locale: zhCN })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">补件预警</h3>
              </div>
            </div>
            <div className="p-4">
              {supplementCases.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">暂无需要补件的案件</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplementCases.map(c => (
                    <div key={c.id} className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">{c.studentName}</span>
                        <StatusBadge status="required" text="需补件" />
                      </div>
                      <p className="text-xs text-gray-500">
                        {c.supplements.filter(s => ['required', 'rejected'].includes(s.status)).length} 项材料待补充
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">退款协商</h3>
              </div>
            </div>
            <div className="p-4">
              {refundCases.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">暂无退款申请</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {refundCases.map(r => (
                    <Link
                      key={r.id}
                      to="/refunds"
                      className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">{r.studentName}</span>
                        <span className="text-sm font-medium text-purple-600">¥{r.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500">{r.reason}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">本月进度</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">已完成</span>
                  <span className="font-semibold text-green-600">
                    {visaCases.filter(c => c.status === 'approved').length} 件
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">进行中</span>
                  <span className="font-semibold text-blue-600">
                    {visaCases.filter(c => ['processing', 'under_review'].includes(c.status)).length} 件
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">成功率</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round((visaCases.filter(c => c.status === 'approved').length / visaCases.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
