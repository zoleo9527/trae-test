import { useNavigate } from 'react-router-dom';
import { Package, FileText, Coins, ClipboardCheck, GraduationCap, Users, Clock, AlertTriangle, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useAppStore, getRoleName } from '@/store/app.store';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getDashboardStats, getOrders } from '@/services/order.service';
import { getPendingAppeals } from '@/services/appeal.service';
import { getPendingSubsidies } from '@/services/subsidy.service';
import { getPendingAssessments } from '@/services/assessment.service';
import { getPendingTrainings, getOverdueTrainings } from '@/services/training.service';
import { getAllRiders } from '@/services/rider.service';
import { getAssessmentStatusColor, getAssessmentStatusLabel, getAssessmentTypeLabel } from '@/utils/assessmentRules';
import { useMemo } from 'react';
import type { UserRole } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { userRole, currentUser, pendingCounts, refreshPendingCounts } = useAppStore();

  const stats = useMemo(() => getDashboardStats(), []);
  const recentOrders = useMemo(() => getOrders({ hasException: true }).slice(0, 5), []);
  const pendingAppeals = useMemo(() => getPendingAppeals().slice(0, 5), []);
  const pendingAssessments = useMemo(() => getPendingAssessments().slice(0, 5), []);
  const pendingTrainings = useMemo(() => getPendingTrainings().slice(0, 5), []);
  const allRiders = useMemo(() => getAllRiders(), []);

  const roleDashboardConfig: Record<UserRole, {
    stats: Array<{
      title: string;
      value: string | number;
      icon: any;
      color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
      onClick?: () => void;
      trend?: { value: number; isUp: boolean; label: string };
    }>;
    sections: Array<{
      title: string;
      action?: { label: string; onClick: () => void };
      content: React.ReactNode;
    }>;
  }> = {
    manager: {
      stats: [
        { title: '今日订单总数', value: stats.totalOrders, icon: Package, color: 'primary', onClick: () => navigate('/orders') },
        { title: '异常订单', value: stats.exceptionOrders, icon: AlertTriangle, color: 'danger', onClick: () => navigate('/orders'), trend: { value: 12, isUp: true, label: '较昨日' } },
        { title: '待审核考核', value: pendingCounts.assessments, icon: ClipboardCheck, color: 'warning', onClick: () => navigate('/assessments') },
        { title: '准时送达率', value: `${stats.onTimeRate}%`, icon: TrendingUp, color: 'success', trend: { value: 3, isUp: true, label: '较上周' } },
        { title: '待处理培训', value: pendingCounts.trainings, icon: GraduationCap, color: 'info', onClick: () => navigate('/training') },
        { title: '活跃骑手', value: allRiders.filter(r => r.status === 'active').length, icon: Users, color: 'primary' },
      ],
      sections: [
        {
          title: '待处理申诉',
          action: { label: '查看全部', onClick: () => navigate('/appeals') },
          content: (
            <div className="space-y-3">
              {pendingAppeals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无待处理申诉</p>
              ) : pendingAppeals.map(appeal => (
                <div key={appeal.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => navigate(`/orders/${appeal.orderId}/process`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appeal.reason}</p>
                      <p className="text-xs text-gray-500">订单号：{appeal.orderId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '待审核考核',
          action: { label: '查看全部', onClick: () => navigate('/assessments') },
          content: (
            <div className="space-y-3">
              {pendingAssessments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无待审核考核</p>
              ) : pendingAssessments.map(assessment => (
                <div key={assessment.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => navigate(`/orders/${assessment.orderId}/process`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <ClipboardCheck className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">扣 {assessment.scoreDeducted} 分</p>
                        <Tag variant="warning" size="sm">{getAssessmentTypeLabel(assessment.type)}</Tag>
                      </div>
                      <p className="text-xs text-gray-500">骑手：{assessment.createdBy}</p>
                    </div>
                  </div>
                  <StatusBadge status={assessment.status} label={getAssessmentStatusLabel(assessment.status)} variant="warning" />
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
    dispatcher: {
      stats: [
        { title: '异常订单待处理', value: stats.exceptionOrders, icon: AlertTriangle, color: 'danger', onClick: () => navigate('/orders') },
        { title: '待审核补贴', value: pendingCounts.subsidies, icon: Coins, color: 'success', onClick: () => navigate('/subsidies') },
        { title: '待发起考核', value: pendingCounts.assessments, icon: ClipboardCheck, color: 'warning', onClick: () => navigate('/assessments') },
        { title: '平均配送时长', value: `${stats.avgDeliveryTime}分钟`, icon: Clock, color: 'primary' },
      ],
      sections: [
        {
          title: '最新异常订单',
          action: { label: '查看全部', onClick: () => navigate('/orders') },
          content: (
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无异常订单</p>
              ) : recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => navigate(`/orders/${order.id}/process`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 font-mono">{order.id}</p>
                        <Tag variant="danger" size="sm">异常</Tag>
                      </div>
                      <p className="text-xs text-gray-500">骑手：{order.riderName} · {order.merchantName}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '待处理补贴',
          action: { label: '查看全部', onClick: () => navigate('/subsidies') },
          content: (
            <div className="space-y-3">
              {getPendingSubsidies().length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无待处理补贴</p>
              ) : getPendingSubsidies().slice(0, 5).map(subsidy => (
                <div key={subsidy.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => navigate(`/orders/${subsidy.orderId}/process`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Coins className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">¥{subsidy.amount}</p>
                      <p className="text-xs text-gray-500">{subsidy.reason}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
    customer_service: {
      stats: [
        { title: '待处理申诉', value: pendingCounts.appeals, icon: FileText, color: 'warning', onClick: () => navigate('/appeals') },
        { title: '今日处理', value: 8, icon: ClipboardCheck, color: 'success', trend: { value: 15, isUp: true, label: '较昨日' } },
        { title: '用户满意度', value: '96%', icon: TrendingUp, color: 'primary', trend: { value: 2, isUp: true, label: '较上周' } },
        { title: '平均响应时长', value: '5分钟', icon: Clock, color: 'info' },
      ],
      sections: [
        {
          title: '待处理申诉',
          action: { label: '查看全部', onClick: () => navigate('/appeals') },
          content: (
            <div className="space-y-3">
              {pendingAppeals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无待处理申诉</p>
              ) : pendingAppeals.map(appeal => (
                <div key={appeal.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => navigate(`/orders/${appeal.orderId}/process`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appeal.reason}</p>
                      <p className="text-xs text-gray-500">订单号：{appeal.orderId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          ),
        },
        {
          title: '我处理的申诉',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 text-center py-4">暂无处理记录</p>
            </div>
          ),
        },
      ],
    },
  };

  if (!userRole) return null;

  const config = roleDashboardConfig[userRole];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            你好，{currentUser?.name} 👋
          </h1>
          <p className="text-gray-500 mt-1">欢迎回到{getRoleName(userRole)}工作台</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={refreshPendingCounts}>
            刷新数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {config.stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config.sections.map((section, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{section.title}</CardTitle>
                {section.action && (
                  <Button variant="ghost" size="sm" onClick={section.action.onClick}>
                    {section.action.label}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {section.content}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">快速开始</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userRole === 'manager' && (
              <>
                <div
                  className="p-4 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => navigate('/orders')}
                >
                  <Package className="w-6 h-6 text-primary-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">处理异常订单</p>
                  <p className="text-xs text-gray-500 mt-1">共 {stats.exceptionOrders} 条待处理</p>
                </div>
                <div
                  className="p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => navigate('/appeals')}
                >
                  <FileText className="w-6 h-6 text-amber-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">处理用户申诉</p>
                  <p className="text-xs text-gray-500 mt-1">共 {pendingCounts.appeals} 条待处理</p>
                </div>
                <div
                  className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => navigate('/subsidies')}
                >
                  <Coins className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">审核补贴申请</p>
                  <p className="text-xs text-gray-500 mt-1">共 {pendingCounts.subsidies} 条待审核</p>
                </div>
                <div
                  className="p-4 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => navigate('/assessments')}
                >
                  <ClipboardCheck className="w-6 h-6 text-red-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">处理考核记录</p>
                  <p className="text-xs text-gray-500 mt-1">共 {pendingCounts.assessments} 条待处理</p>
                </div>
              </>
            )}
            {userRole === 'dispatcher' && (
              <>
                <div
                  className="p-4 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => navigate('/orders')}
                >
                  <Package className="w-6 h-6 text-primary-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">处理异常订单</p>
                  <p className="text-xs text-gray-500 mt-1">共 {stats.exceptionOrders} 条待处理</p>
                </div>
                <div
                  className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => navigate('/subsidies')}
                >
                  <Coins className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">审核补贴申请</p>
                  <p className="text-xs text-gray-500 mt-1">共 {pendingCounts.subsidies} 条待审核</p>
                </div>
                <div
                  className="p-4 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => navigate('/assessments')}
                >
                  <ClipboardCheck className="w-6 h-6 text-red-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">发起考核记录</p>
                  <p className="text-xs text-gray-500 mt-1">共 {pendingCounts.assessments} 条待处理</p>
                </div>
                <div
                  className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => navigate('/riders')}
                >
                  <Users className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">查看骑手信息</p>
                  <p className="text-xs text-gray-500 mt-1">共 {allRiders.filter(r => r.status === 'active').length} 名在职骑手</p>
                </div>
              </>
            )}
            {userRole === 'customer_service' && (
              <>
                <div
                  className="p-4 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => navigate('/appeals')}
                >
                  <FileText className="w-6 h-6 text-amber-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">处理用户申诉</p>
                  <p className="text-xs text-gray-500 mt-1">共 {pendingCounts.appeals} 条待处理</p>
                </div>
                <div
                  className="p-4 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => navigate('/orders')}
                >
                  <Package className="w-6 h-6 text-primary-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">查询订单信息</p>
                  <p className="text-xs text-gray-500 mt-1">共 {stats.totalOrders} 条订单</p>
                </div>
                <div
                  className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => navigate('/orders/order-A001/process')}
                >
                  <GraduationCap className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">体验处理流程</p>
                  <p className="text-xs text-gray-500 mt-1">查看完整流程演示</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">演示样例</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            系统内置了4组完整样例数据，覆盖正常流和问题流，可直接点击进入体验完整处理流程：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50/50 cursor-pointer transition-all"
              onClick={() => navigate('/orders/order-A001/process')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Tag variant="success">样例 A</Tag>
                <span className="text-sm font-medium text-gray-900">正常超时订单流</span>
              </div>
              <p className="text-xs text-gray-500">骑手责任超时，正常考核→培训完整流程</p>
            </div>
            <div
              className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50/50 cursor-pointer transition-all"
              onClick={() => navigate('/orders/order-B002/process')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Tag variant="warning">样例 B</Tag>
                <span className="text-sm font-medium text-gray-900">商家出餐慢</span>
              </div>
              <p className="text-xs text-gray-500">商家责任，补贴骑手，无考核</p>
            </div>
            <div
              className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50/50 cursor-pointer transition-all"
              onClick={() => navigate('/orders/order-C003/process')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Tag variant="danger">样例 C</Tag>
                <span className="text-sm font-medium text-gray-900">用户退款+结算错误</span>
              </div>
              <p className="text-xs text-gray-500">复合问题，多角色协作，跨系统核对</p>
            </div>
            <div
              className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50/50 cursor-pointer transition-all"
              onClick={() => navigate('/orders/order-D004/process')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Tag variant="info">样例 D</Tag>
                <span className="text-sm font-medium text-gray-900">骑手反复超时</span>
              </div>
              <p className="text-xs text-gray-500">历史数据关联，累计规则触发专项培训</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
