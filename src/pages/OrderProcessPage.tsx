import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useProcessStore } from '@/store/process.store';
import { getOrderByOrderId } from '@/services/order.service';
import { getAppealsByOrderId } from '@/services/appeal.service';
import { getSubsidiesByOrderId } from '@/services/subsidy.service';
import { getAssessmentsByOrderId } from '@/services/assessment.service';
import { getTrainingsByOrderId } from '@/services/training.service';
import { getRiderById } from '@/services/rider.service';
import { OrderDetailPanel } from '@/components/process/OrderDetailPanel';
import { AppealPanel } from '@/components/process/AppealPanel';
import { SubsidyPanel } from '@/components/process/SubsidyPanel';
import { AssessmentPanel } from '@/components/process/AssessmentPanel';
import { TrainingPanel } from '@/components/process/TrainingPanel';
import { ProcessActionBar } from '@/components/process/ProcessActionBar';
import { VerticalTimeline } from '@/components/timeline/VerticalTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/app.store';
import { buildTimeline } from '@/services/order.service';
import type { ProcessStep, UserRole } from '@/types';

const stepComponents: Record<Exclude<ProcessStep, 'complete'>, React.ComponentType> = {
  review: OrderDetailPanel,
  appeal: AppealPanel,
  subsidy: SubsidyPanel,
  assessment: AssessmentPanel,
  training: TrainingPanel,
};

export function OrderProcessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { userRole } = useAppStore();
  const {
    processState,
    order,
    appeals,
    subsidies,
    assessments,
    trainings,
    timeline,
    rider,
    isLoading,
    loadOrderData,
    clearProcessState,
  } = useProcessStore();

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (orderId) {
      const exists = getOrderByOrderId(orderId);
      if (!exists) {
        setNotFound(true);
        return;
      }

      const orderData = getOrderByOrderId(orderId)!;
      const appealsData = getAppealsByOrderId(orderId);
      const subsidiesData = getSubsidiesByOrderId(orderId);
      const assessmentsData = getAssessmentsByOrderId(orderId);
      const trainingsData = getTrainingsByOrderId(orderId);
      const riderData = orderData.riderId ? getRiderById(orderData.riderId) : null;
      const timelineData = buildTimeline(orderId);

      loadOrderData({
        order: orderData,
        appeals: appealsData,
        subsidies: subsidiesData,
        assessments: assessmentsData,
        trainings: trainingsData,
        timeline: timelineData,
        rider: riderData || undefined,
      });
    }

    return () => {
      clearProcessState();
    };
  }, [orderId, loadOrderData, clearProcessState]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">订单不存在</h2>
        <p className="text-gray-500 mb-6">未找到订单号为 {orderId} 的订单</p>
        <Button onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回订单列表
        </Button>
      </div>
    );
  }

  if (isLoading || !order || !processState) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-80 bg-gray-200 rounded" />
          </div>
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const allowedStepsForRole: Record<UserRole, ProcessStep[]> = {
    manager: ['review', 'appeal', 'subsidy', 'assessment', 'training', 'complete'],
    dispatcher: ['review', 'appeal', 'subsidy', 'assessment', 'training', 'complete'],
    customer_service: ['review', 'appeal', 'complete'],
  };

  const allowedSteps = userRole ? allowedStepsForRole[userRole] : allowedStepsForRole.manager;

  const safeCurrentStep = allowedSteps.includes(processState.currentStep)
    ? processState.currentStep
    : allowedSteps[0];

  const stepTitles: Record<ProcessStep, string> = {
    review: '订单详情审核',
    appeal: '申诉处理',
    subsidy: '补贴审核',
    assessment: '考核处理',
    training: '培训跟进',
    complete: '处理完成',
  };

  if (safeCurrentStep === 'complete') {
    return (
      <div className="animate-fade-in">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              返回订单列表
            </button>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">订单处理完成</h2>
              <p className="text-gray-500 mb-8">订单 {order.id} 的所有流程已处理完毕</p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">处理摘要</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">申诉处理</span>
                    <span className={appeals.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                      {appeals.length > 0 ? '已处理' : '无申诉'}
                    </span>
                  </div>
                  {userRole !== 'customer_service' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">补贴处理</span>
                        <span className={subsidies.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                          {subsidies.length > 0 ? `¥${subsidies[0].amount}` : '无补贴'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">考核处理</span>
                        <span className={assessments.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                          {assessments.length > 0 ? `扣 ${assessments[0].scoreDeducted} 分` : '无考核'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">培训处理</span>
                        <span className={trainings.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                          {trainings.length > 0 ? '已安排' : '无需培训'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => navigate('/orders')}>
                  返回订单列表
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  返回工作台
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = stepComponents[safeCurrentStep as Exclude<ProcessStep, 'complete'>];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            返回订单列表
          </button>
          <div className="text-sm text-gray-500">
            当前步骤：<span className="text-primary-700 font-medium">{stepTitles[safeCurrentStep]}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{stepTitles[safeCurrentStep]}</CardTitle>
              </CardHeader>
              <CardContent>
                <CurrentStepComponent />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">完整事件时间线</CardTitle>
              </CardHeader>
              <CardContent>
                <VerticalTimeline events={timeline} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">骑手信息</CardTitle>
              </CardHeader>
              <CardContent>
                {rider ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                        {rider.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{rider.name}</p>
                        <p className="text-sm text-gray-500">工号：{rider.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-primary-700">{rider.currentScore}</p>
                        <p className="text-xs text-gray-500 mt-1">当前积分</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{rider.trainingCount.completed}</p>
                        <p className="text-xs text-gray-500 mt-1">已完成培训</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">入职日期</span>
                        <span className="text-gray-900">{new Date(rider.joinDate).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">负责区域</span>
                        <span className="text-gray-900">{rider.zone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">累计订单</span>
                        <span className="text-gray-900">{rider.totalOrders} 单</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">暂无骑手信息</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">关联记录概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded">
                    <span className="text-sm">申诉记录</span>
                    <span className={`text-sm font-medium ${appeals.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                      {appeals.length} 条
                    </span>
                  </div>
                  {userRole !== 'customer_service' && (
                    <>
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">补贴记录</span>
                        <span className={`text-sm font-medium ${subsidies.length > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                          {subsidies.length} 条
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-sm">考核记录</span>
                        <span className={`text-sm font-medium ${assessments.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                          {assessments.length} 条
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm">培训记录</span>
                        <span className={`text-sm font-medium ${trainings.length > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                          {trainings.length} 条
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProcessActionBar allowedSteps={allowedSteps} />
    </div>
  );
}
