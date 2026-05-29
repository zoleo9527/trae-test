import { useState } from 'react';
import { GraduationCap, CheckCircle, Clock, User, FileText, AlertTriangle } from 'lucide-react';
import { useProcessStore } from '@/store/process.store';
import { useAppStore } from '@/store/app.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import type { TrainingStatus, TrainingType } from '@/types';
import { createTrainingFromAssessment, completeTraining, startTraining } from '@/services/training.service';
import { getTrainingTypeLabel, getTrainingStatusLabel, getTrainingStatusColor } from '@/utils/trainingTrigger';
import { getAssessmentTypeLabel } from '@/utils/assessmentRules';
import { cn } from '@/lib/utils';

export function TrainingPanel() {
  const { order, assessments, trainings, processState, markStepComplete, goToNextStep } = useProcessStore();
  const { currentUser, refreshPendingCounts } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const assessment = assessments.find(a => a.status === 'approved' || a.status === 'pending_approval');
  const training = trainings[0];

  if (!order) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-500 text-center py-8">请先选择订单</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: TrainingStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'expired': return 'danger';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleCreateTraining = async () => {
    if (!assessment) {
      alert('请先完成考核');
      return;
    }

    setIsProcessing(true);
    try {
      const newTraining = createTrainingFromAssessment(assessment.id, order.riderId);
      if (newTraining) {
        markStepComplete('training');
        refreshPendingCounts();
        goToNextStep();
      } else {
        markStepComplete('training');
        goToNextStep();
      }
    } catch (error) {
      alert('创建培训失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTraining = async (score: number) => {
    if (!training) return;

    setIsProcessing(true);
    try {
      const updated = completeTraining(training.id, score);
      if (updated) {
        markStepComplete('training');
        refreshPendingCounts();
        goToNextStep();
      }
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    markStepComplete('training');
    goToNextStep();
  };

  const needsTraining = assessment?.requiresTraining || processState?.autoTriggeredTraining;
  const isCompleted = training && training.status === 'completed';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">培训跟进</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  骑手：{order.riderName}
                </p>
              </div>
            </div>
            {training && (
              <StatusBadge
                status={training.status}
                label={getTrainingStatusLabel(training.status)}
                variant={getStatusVariant(training.status)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessment && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">关联考核信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">违规类型：</span>
                  <Tag variant="warning" className="ml-1">{getAssessmentTypeLabel(assessment.type)}</Tag>
                </div>
                <div>
                  <span className="text-gray-500">扣分：</span>
                  <span className="font-medium text-accent-red">{assessment.scoreDeducted} 分</span>
                </div>
                <div>
                  <span className="text-gray-500">罚款：</span>
                  <span className="font-medium text-accent-red">¥{assessment.fineAmount}</span>
                </div>
                <div>
                  <span className="text-gray-500">需培训：</span>
                  <span className={cn('font-medium', assessment.requiresTraining ? 'text-purple-600' : 'text-gray-500')}>
                    {assessment.requiresTraining ? '是' : '否'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {needsTraining && !training && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">培训触发提醒</span>
              </div>
              <p className="text-sm text-purple-700">
                根据考核规则，该骑手需要参加对应培训，请确认生成培训任务。
              </p>
            </div>
          )}

          {!needsTraining && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  本次违规未达到培训触发条件，无需强制培训
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {training && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">培训详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">培训标题：</span>
              <p className="text-base font-medium text-gray-900 mt-1">{training.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-500">培训类型：</span>
                <Tag variant="info" className="ml-1">{getTrainingTypeLabel(training.type)}</Tag>
              </div>
              <div>
                <span className="text-sm text-gray-500">截止日期：</span>
                <span className={cn(
                  'font-medium ml-1',
                  new Date(training.dueDate) < new Date() ? 'text-accent-red' : 'text-gray-900'
                )}>
                  {formatDate(training.dueDate)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">培训内容：</span>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {training.content}
              </div>
            </div>
            {training.score !== null && (
              <div className="pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">考核得分：</span>
                <span className="text-xl font-bold text-accent-green ml-2">{training.score} 分</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isCompleted && needsTraining && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{training ? '处理培训' : '生成培训'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {training && training.status === 'pending' && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-700">
                  培训待骑手开始学习。可标记为开始或直接完成。
                </p>
              </div>
            )}

            {training && training.status === 'in_progress' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  骑手正在学习中。完成后可记录考核得分。
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {!training && (
                <Button onClick={handleCreateTraining} loading={isProcessing}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  生成培训任务
                </Button>
              )}
              {training && training.status === 'pending' && (
                <>
                  <Button variant="secondary" onClick={() => startTraining(training.id)}>
                    标记学习中
                  </Button>
                  <Button onClick={() => handleCompleteTraining(85)} loading={isProcessing}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    标记完成
                  </Button>
                </>
              )}
              {training && training.status === 'in_progress' && (
                <Button onClick={() => handleCompleteTraining(85)} loading={isProcessing}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  完成培训（85分）
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!needsTraining && !training && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                无需强制培训，可跳过此步骤
              </p>
            </div>
            <Button onClick={handleSkip}>
              跳过培训，完成处理
            </Button>
          </CardContent>
        </Card>
      )}

      {isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent-green" />
              处理完成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状态：</span>
              <span className={cn(getTrainingStatusColor(training!.status), 'text-xs px-2 py-0.5 rounded-full')}>
                {getTrainingStatusLabel(training!.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>完成时间：{formatDateTime(training!.completedAt!)}</span>
            </div>
            {training!.score !== null && (
              <div>
                <span className="text-sm text-gray-500">考核得分：</span>
                <span className="text-xl font-bold text-accent-green ml-2">{training!.score} 分</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
