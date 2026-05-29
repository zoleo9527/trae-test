import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Phone, Calendar, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { getRiderById } from '@/services/rider.service';
import { getOrders } from '@/services/order.service';
import { getAssessmentsByRiderId } from '@/services/assessment.service';
import { getTrainingsByRiderId } from '@/services/training.service';
import { VerticalTimeline } from '@/components/timeline/VerticalTimeline';
import { buildRiderTimeline } from '@/services/rider.service';
import { getAssessmentTypeLabel, getSeverityLabel } from '@/utils/assessmentRules';

export function RiderProfilePage() {
  const { riderId } = useParams<{ riderId: string }>();
  const navigate = useNavigate();

  const rider = useMemo(() => riderId ? getRiderById(riderId) : null, [riderId]);
  const riderOrders = useMemo(() => riderId ? getOrders({ riderId }).slice(0, 10) : [], [riderId]);
  const riderAssessments = useMemo(() => riderId ? getAssessmentsByRiderId(riderId) : [], [riderId]);
  const riderTrainings = useMemo(() => riderId ? getTrainingsByRiderId(riderId) : [], [riderId]);
  const timeline = useMemo(() => riderId ? buildRiderTimeline(riderId) : [], [riderId]);

  if (!rider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">骑手不存在</h2>
        <p className="text-gray-500 mb-6">未找到该骑手信息</p>
        <Button onClick={() => navigate('/riders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回骑手列表
        </Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '在职';
      case 'inactive': return '离职';
      case 'suspended': return '停职';
      default: return status;
    }
  };

  const totalDeducted = riderAssessments
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.scoreDeducted, 0);

  const completedTrainings = riderTrainings.filter(t => t.status === 'completed').length;
  const pendingTrainings = riderTrainings.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/riders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          返回骑手列表
        </button>
      </div>

      <Card>
        <CardContent padding="lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-3xl">
                {rider.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{rider.name}</h1>
                  <StatusBadge
                    status={rider.status}
                    label={getStatusLabel(rider.status)}
                    variant={getStatusVariant(rider.status)}
                  />
                  {rider.currentScore < 75 && rider.status === 'active' && (
                    <Tag variant="danger">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      需重点关注
                    </Tag>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">工号：</span>
                    <span className="font-mono">{rider.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{rider.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{rider.zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>入职：{new Date(rider.joinDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={cn('text-3xl font-bold', getScoreColor(rider.currentScore))}>
                  {rider.currentScore}
                </p>
                <p className="text-sm text-gray-500 mt-1">当前积分</p>
                {totalDeducted > 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center justify-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    累计扣 {totalDeducted} 分
                  </p>
                )}
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{rider.totalOrders}</p>
                <p className="text-sm text-gray-500 mt-1">累计订单</p>
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{rider.trainingCount.completed}</p>
                <p className="text-sm text-gray-500 mt-1">已完成培训</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">完整时间线</CardTitle>
            </CardHeader>
            <CardContent>
              <VerticalTimeline events={timeline} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                最近订单
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/orders">查看全部</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riderOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无订单记录</p>
              ) : (
                <div className="space-y-3">
                  {riderOrders.map(order => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}/process`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 font-mono">{order.id}</p>
                          <p className="text-xs text-gray-500">{order.merchantName} → {order.address}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">¥{order.amount}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">考核记录</CardTitle>
            </CardHeader>
            <CardContent>
              {riderAssessments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无考核记录</p>
              ) : (
                <div className="space-y-3">
                  {riderAssessments.map(assessment => (
                    <div
                      key={assessment.id}
                      className="p-3 bg-red-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {getAssessmentTypeLabel(assessment.type)}
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          -{assessment.scoreDeducted} 分
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Tag variant="warning" size="sm">{getSeverityLabel(assessment.severity)}</Tag>
                        <span>{new Date(assessment.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      {assessment.notes && (
                        <p className="text-xs text-gray-600 mt-2">{assessment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">培训记录</CardTitle>
            </CardHeader>
            <CardContent>
              {riderTrainings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">暂无培训记录</p>
              ) : (
                <div className="space-y-3">
                  {riderTrainings.map(training => (
                    <div
                      key={training.id}
                      className={cn(
                        'p-3 rounded-lg',
                        training.status === 'completed' ? 'bg-green-50' : 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{training.title}</span>
                        <StatusBadge
                          status={training.status}
                          label={training.status === 'completed' ? '已完成' : '待学习'}
                          variant={training.status === 'completed' ? 'success' : 'info'}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {training.completedAt
                          ? `完成于 ${new Date(training.completedAt).toLocaleDateString('zh-CN')}`
                          : training.dueDate
                            ? `截止 ${new Date(training.dueDate).toLocaleDateString('zh-CN')}`
                            : ''}
                        {training.score !== undefined && (
                          <span className="ml-2 text-green-600 font-medium">得分 {training.score} 分</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
