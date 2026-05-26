import { useNavigate } from 'react-router-dom';
import {
  Scale,
  FileText,
  AlertTriangle,
  DollarSign,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { categoryLabels, exceptionStatusLabels, ledgerStatusLabels, exceptionTypeLabels } from '@/types';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentRole,
    ledgerRecords,
    exceptions,
    financeRecords,
    dailyStats,
    categoryStats,
    getFilteredLedger,
    getFilteredExceptions,
    getPendingExceptionsCount,
    getPendingLedgerCount,
    getPendingFinanceCount,
    getLedgerById,
  } = useStore();

  const filteredLedger = getFilteredLedger();
  const filteredExceptions = getFilteredExceptions();

  const todayWeight = dailyStats[dailyStats.length - 1]?.weight || 0;
  const todayAmount = dailyStats[dailyStats.length - 1]?.amount || 0;
  const pendingExceptions = getPendingExceptionsCount();
  const pendingLedger = getPendingLedgerCount();
  const pendingFinance = getPendingFinanceCount();

  const recentLedger = filteredLedger.slice(0, 5);
  const recentExceptions = filteredExceptions.slice(0, 5);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'settled':
      case 'resolved':
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      case 'processing':
      case 'verified':
      case 'reconciled':
        return 'info';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日回收重量"
          value={`${todayWeight.toLocaleString()} kg`}
          icon={Scale}
          trend="较昨日"
          trendUp={todayWeight > (dailyStats[dailyStats.length - 2]?.weight || 0)}
          color="blue"
        />
        <StatCard
          title="今日交易金额"
          value={`¥${todayAmount.toLocaleString()}`}
          icon={DollarSign}
          trend="较昨日"
          trendUp={todayAmount > (dailyStats[dailyStats.length - 2]?.amount || 0)}
          color="green"
        />
        <StatCard
          title="待处理异常"
          value={pendingExceptions}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="待审核台账"
          value={pendingLedger + pendingFinance}
          icon={FileText}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/ledger')}>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>近7日回收趋势</Card.Title>
            <span className="text-sm text-blue-600">查看台账 →</span>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats.slice(-7)} onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    const date = data.activePayload[0].payload.date;
                    navigate(`/ledger?date=${date}`);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'MM/dd', { locale: zhCN })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'weight' ? `${value} kg` : `¥${value}`,
                      name === 'weight' ? '重量' : '金额',
                    ]}
                    labelFormatter={(label) => `日期: ${format(new Date(label), 'yyyy-MM-dd', { locale: zhCN })}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', cursor: 'pointer' }}
                    name="weight"
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', cursor: 'pointer' }}
                    name="amount"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">点击数据点可查看当日台账</p>
          </Card.Content>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/ledger')}>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>品类分布</Card.Title>
            <span className="text-sm text-blue-600">查看台账 →</span>
          </Card.Header>
          <Card.Content>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryStats}
                  onClick={(data: any) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const category = data.activePayload[0].payload.category;
                      navigate(`/ledger?category=${category}`);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} tickFormatter={(cat) => categoryLabels[cat as keyof typeof categoryLabels]} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'weight' ? `${value} kg` : `¥${value}`,
                      name === 'weight' ? '重量' : '价值',
                    ]}
                    labelFormatter={(label) => `品类: ${categoryLabels[label as keyof typeof categoryLabels]}`}
                  />
                  <Bar dataKey="weight" fill="#3b82f6" name="weight" radius={[4, 4, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">点击柱状图可查看该品类台账</p>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>最近台账记录</Card.Title>
            <Button variant="ghost" size="sm" onClick={() => navigate('/ledger')}>
              查看全部 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-gray-100">
              {recentLedger.map((record) => (
                <div
                  key={record.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/ledger/${record.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{record.recordNo}</span>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {ledgerStatusLabels[record.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {categoryLabels[record.category]} · {record.weight}kg · ¥{record.totalAmount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{record.supplier}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(record.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentLedger.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  暂无台账记录
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>异常上报</Card.Title>
            <Button variant="ghost" size="sm" onClick={() => navigate('/exceptions')}>
              查看全部 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-gray-100">
              {recentExceptions.map((exception) => {
                const relatedLedger = exception.relatedLedgerId 
                  ? getLedgerById(exception.relatedLedgerId) 
                  : undefined;
                return (
                  <div
                    key={exception.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/exceptions/${exception.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-lg mt-0.5',
                          exception.type === 'environment' ? 'bg-green-100' :
                          exception.type === 'equipment' ? 'bg-blue-100' :
                          exception.type === 'quality' ? 'bg-yellow-100' :
                          'bg-red-100'
                        )}>
                          <AlertTriangle className={cn(
                            'w-4 h-4',
                            exception.type === 'environment' ? 'text-green-600' :
                            exception.type === 'equipment' ? 'text-blue-600' :
                            exception.type === 'quality' ? 'text-yellow-600' :
                            'text-red-600'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{exception.title}</span>
                            <Badge variant={getStatusBadgeVariant(exception.status)}>
                              {exceptionStatusLabels[exception.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {exceptionTypeLabels[exception.type]} · {exception.reporterName}
                          </p>
                          {relatedLedger && (
                            <p className="text-xs text-blue-600 mt-1" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ledger/${relatedLedger.id}`);
                            }}>
                              关联台账：{relatedLedger.recordNo} →
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(exception.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentExceptions.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  暂无异常记录
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>

      {(currentRole === 'owner' || currentRole === 'accountant') && (
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>待办事项</Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-gray-100">
              {pendingLedger > 0 && (
                <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/ledger')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">待审核台账</p>
                        <p className="text-sm text-gray-500">有 {pendingLedger} 条台账记录等待审核</p>
                      </div>
                    </div>
                    <Badge variant="warning">{pendingLedger} 条</Badge>
                  </div>
                </div>
              )}
              {pendingFinance > 0 && (
                <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/finance')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">待对账结算</p>
                        <p className="text-sm text-gray-500">有 {pendingFinance} 笔款项等待对账</p>
                      </div>
                    </div>
                    <Badge variant="default">{pendingFinance} 条</Badge>
                  </div>
                </div>
              )}
              {pendingExceptions > 0 && (
                <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/exceptions')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">待处理异常</p>
                        <p className="text-sm text-gray-500">有 {pendingExceptions} 个异常需要处理</p>
                      </div>
                    </div>
                    <Badge variant="danger">{pendingExceptions} 条</Badge>
                  </div>
                </div>
              )}
              {pendingLedger === 0 && pendingFinance === 0 && pendingExceptions === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>太棒了！暂无待办事项</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
