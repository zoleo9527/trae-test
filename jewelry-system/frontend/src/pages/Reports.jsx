import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  ChevronDown
} from 'lucide-react';
import { visaCases } from '../data/mockData';

export default function Reports() {
  const [dateRange, setDateRange] = useState('this_month');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const dateOptions = [
    { value: 'this_week', label: '本周' },
    { value: 'this_month', label: '本月' },
    { value: 'this_quarter', label: '本季度' },
    { value: 'this_year', label: '本年' }
  ];

  const totalCases = visaCases.length;
  const approvedCases = visaCases.filter(c => c.status === 'approved').length;
  const rejectedCases = visaCases.filter(c => c.status === 'rejected').length;
  const pendingCases = visaCases.filter(c => 
    ['processing', 'under_review', 'pending_supplement', 'in_progress'].includes(c.status)
  ).length;
  const overdueCases = visaCases.filter(c => c.status === 'overdue').length;
  const approvalRate = Math.round((approvedCases / totalCases) * 100);

  const stats = [
    { label: '总案件数', value: totalCases, icon: Users, change: '+12%', trend: 'up' },
    { label: '已完成', value: approvedCases, icon: CheckCircle, change: '+8%', trend: 'up' },
    { label: '进行中', value: pendingCases, icon: Clock, change: '-3%', trend: 'down' },
    { label: '已驳回', value: rejectedCases, icon: AlertTriangle, change: '+2%', trend: 'up' }
  ];

  const countryStats = [
    { country: '美国', count: 2, percentage: 33 },
    { country: '英国', count: 1, percentage: 17 },
    { country: '澳大利亚', count: 1, percentage: 17 },
    { country: '加拿大', count: 1, percentage: 17 },
    { country: '其他', count: 1, percentage: 16 }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">数据报表</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{dateOptions.find(d => d.value === dateRange)?.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDateDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {dateOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateRange(option.value);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      dateRange === option.value ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">签证通过率</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${approvalRate * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{approvalRate}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">已通过: {approvedCases} 件</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">进行中: {pendingCases} 件</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-600">已驳回: {rejectedCases} 件</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">目的地分布</h3>
          <div className="space-y-4">
            {countryStats.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{item.country}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count} 件</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">处理时效分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 mb-1">5.2</p>
            <p className="text-sm text-gray-600">平均处理天数</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600 mb-1">3.8</p>
            <p className="text-sm text-gray-600">补件平均天数</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-3xl font-bold text-amber-600 mb-1">{overdueCases}</p>
            <p className="text-sm text-gray-600">逾期案件数</p>
          </div>
        </div>
      </div>
    </div>
  );
}
