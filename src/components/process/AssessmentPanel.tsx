import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import { cn } from '@/lib/utils';
import { getRiderById } from '@/mock/riders';
import { approveAssessment, calculateAssessmentResult, createAssessment, submitForApproval } from '@/services/assessment.service';
import { createTrainingFromAssessment } from '@/services/training.service';
import { useAppStore } from '@/store/app.store';
import { useProcessStore } from '@/store/process.store';
import type { AssessmentStatus, AssessmentType } from '@/types';
import { getAssessmentStatusColor, getAssessmentStatusLabel, getAssessmentTypeLabel } from '@/utils/assessmentRules';
import { getPartyColor, getPartyLabel } from '@/utils/responsibility';
import { shouldTriggerTraining } from '@/utils/trainingTrigger';
import { AlertTriangle, CheckCircle, ClipboardCheck, FileText, GraduationCap, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const assessmentTypes: { value: AssessmentType; label: string; defaultScore: number }[] = [
  { value: 'timeout', label: '配送超时', defaultScore: 6 },
  { value: 'complaint', label: '用户投诉', defaultScore: 9 },
  { value: 'violation', label: '违规操作', defaultScore: 12 },
  { value: 'service_issue', label: '服务问题', defaultScore: 5 },
];

const severityOptions = [
  { value: 'minor', label: '轻微', multiplier: 0.5 },
  { value: 'moderate', label: '一般', multiplier: 1 },
  { value: 'severe', label: '严重', multiplier: 1.5 },
];

export function AssessmentPanel() {
  const { order, assessments, selectedResponsibility, setAssessmentDecision, markStepComplete, goToNextStep } = useProcessStore();
  const { currentUser, userRole, refreshPendingCounts } = useAppStore();
  const [selectedType, setSelectedType] = useState<AssessmentType>('timeout');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'severe'>('moderate');
  const [customScore, setCustomScore] = useState<number | null>(null);
  const [customFine, setCustomFine] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [trainingTriggerInfo, setTrainingTriggerInfo] = useState<{ shouldTrigger: boolean; reason: string; title: string } | null>(null);

  const assessment = assessments[0];
  const rider = order ? getRiderById(order.riderId) : null;

  useEffect(() => {
    if (order && assessments.length > 0) {
      setSelectedType(assessments[0].type);
      setCustomScore(assessments[0].scoreDeducted);
      setCustomFine(assessments[0].fineAmount);
      setReason(assessments[0].reason);
    }
  }, [order, assessments]);

  useEffect(() => {
    if (order && selectedResponsibility === 'rider' && rider) {
      const calcResult = calculateAssessmentResult(
        selectedType,
        selectedResponsibility,
        severity,
        order.riderId
      );
      const allAssessments = [...assessments];
      const trainingResult = shouldTriggerTraining(
        { ...calcResult, type: selectedType } as any,
        rider,
        allAssessments
      );
      setTrainingTriggerInfo(trainingResult);
    } else {
      setTrainingTriggerInfo(null);
    }
  }, [selectedType, severity, selectedResponsibility, order, rider]);

  if (!order) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-500 text-center py-8">请先选择订单</p>
        </CardContent>
      </Card>
    );
  }

  const calcResult = calculateAssessmentResult(
    selectedType,
    selectedResponsibility || 'unclear',
    severity,
    order.riderId
  );

  const finalScore = customScore ?? calcResult.scoreDeducted;
  const finalFine = customFine ?? calcResult.fineAmount;
  const requiresTraining = trainingTriggerInfo?.shouldTrigger ?? calcResult.requiresTraining;

  const isProcessed = assessment && (assessment.status === 'approved' || assessment.status === 'rejected');

  const getStatusVariant = (status: AssessmentStatus) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending_approval': return 'warning';
      case 'appealed': return 'info';
      default: return 'default';
    }
  };

  const handleSubmit = async (needsApproval: boolean) => {
    if (selectedResponsibility !== 'rider' && selectedResponsibility !== 'merchant' && selectedResponsibility !== 'platform' && selectedResponsibility !== 'user') {
      alert('请先判定责任方');
      return;
    }
    if (!reason.trim()) {
      alert('请填写考核原因');
      return;
    }

    setIsProcessing(true);
    try {
      let assessmentRecord = assessment;
      if (!assessmentRecord) {
        assessmentRecord = createAssessment({
          riderId: order.riderId,
          orderId: order.id,
          riderName: order.riderName,
          type: selectedType,
          responsibleParty: selectedResponsibility,
          reason,
          notes: '',
          severity: finalScore >= 10 ? 'severe' : finalScore >= 5 ? 'moderate' : 'minor',
          scoreDeducted: finalScore,
          fineAmount: finalFine,
          requiresTraining,
          createdBy: currentUser!.name,
        });

        if (needsApproval) {
          assessmentRecord.status = 'pending_approval';
        }
      }

      if (!needsApproval || userRole === 'manager') {
        const approved = approveAssessment(assessmentRecord.id, currentUser!.name);
        if (approved && requiresTraining) {
          const training = createTrainingFromAssessment(approved.id, order.riderId);
          if (training) {
            approved.trainingId = training.id;
          }
        }
        if (approved) {
          setAssessmentDecision(approved);
          markStepComplete('assessment');
          refreshPendingCounts();
          goToNextStep();
        }
      } else {
        const submitted = submitForApproval(assessmentRecord.id);
        if (submitted) {
          setAssessmentDecision(submitted);
          markStepComplete('assessment');
          refreshPendingCounts();
          goToNextStep();
        }
      }
    } catch (error) {
      alert('处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    markStepComplete('assessment');
    goToNextStep();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base">考核处理</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  订单：{order.id}
                </p>
              </div>
            </div>
            {assessment && (
              <StatusBadge
                status={assessment.status}
                label={getAssessmentStatusLabel(assessment.status)}
                variant={getStatusVariant(assessment.status)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">骑手：</span>
                <span className="font-medium text-gray-900">{order.riderName}</span>
              </div>
              <div>
                <span className="text-gray-500">责任方：</span>
                <span className={cn('font-medium', selectedResponsibility ? getPartyColor(selectedResponsibility) : 'text-gray-500')}>
                  {selectedResponsibility ? getPartyLabel(selectedResponsibility) : '待判定'}
                </span>
              </div>
              {rider && (
                <>
                  <div>
                    <span className="text-gray-500">当前积分：</span>
                    <span className="font-mono font-medium text-gray-900">{rider.totalScore} 分</span>
                  </div>
                  <div>
                    <span className="text-gray-500">本月扣分：</span>
                    <span className="font-mono font-medium text-accent-red">{rider.currentMonthScore} 分</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedResponsibility !== 'rider' && selectedResponsibility && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  责任方为{getPartyLabel(selectedResponsibility)}，不对骑手进行考核扣分
                </span>
              </div>
            </div>
          )}

          {selectedResponsibility === 'rider' && calcResult.reasoning.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">考核计算依据</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {calcResult.reasoning.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requiresTraining && trainingTriggerInfo && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">培训触发提醒</span>
              </div>
              <p className="text-sm text-purple-700">{trainingTriggerInfo.reason}</p>
              <p className="text-sm text-purple-600 mt-1">将自动生成培训：{trainingTriggerInfo.title}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {assessment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">已有考核记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag variant="warning">{getAssessmentTypeLabel(assessment.type)}</Tag>
              <span className={cn(getAssessmentStatusColor(assessment.status), 'text-xs px-2 py-0.5 rounded-full')}>
                {getAssessmentStatusLabel(assessment.status)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">扣分：</span>
                <span className="text-xl font-bold text-accent-red">{assessment.scoreDeducted} 分</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">罚款：</span>
                <span className="text-xl font-bold text-accent-red">¥{assessment.fineAmount}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">原因：</span>
              <p className="text-sm text-gray-900 mt-1">{assessment.reason}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>处理人：{assessment.createdBy}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isProcessed && selectedResponsibility === 'rider' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{assessment ? '审核考核' : '发起考核'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">违规类型</label>
              <div className="flex flex-wrap gap-2">
                {assessmentTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-md border text-sm transition-all',
                      selectedType === type.value
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">情节严重程度</label>
              <div className="flex gap-2">
                {severityOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSeverity(opt.value as any)}
                    className={cn(
                      'px-4 py-1.5 rounded-md border text-sm transition-all',
                      severity === opt.value
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  系统建议扣分
                </label>
                <div className="text-2xl font-bold text-accent-red">
                  {calcResult.scoreDeducted} 分
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  实际扣分
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customScore ?? calcResult.scoreDeducted}
                    onChange={e => setCustomScore(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                  <span className="text-gray-500">分</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  系统建议罚款
                </label>
                <div className="text-2xl font-bold text-accent-red">
                  ¥{calcResult.fineAmount}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  实际罚款
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">¥</span>
                  <input
                    type="number"
                    value={customFine ?? calcResult.fineAmount}
                    onChange={e => setCustomFine(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">考核原因说明</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="请详细描述违规事实和处理依据..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={handleSkip}>
                跳过考核
              </Button>
              <div className="flex gap-3">
                {userRole !== 'manager' && (
                  <Button variant="secondary" onClick={() => handleSubmit(true)} loading={isProcessing}>
                    <FileText className="w-4 h-4 mr-2" />
                    提交审核
                  </Button>
                )}
                <Button onClick={() => handleSubmit(false)} loading={isProcessing}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {userRole === 'manager' ? '确认考核并下一步' : '直接确认并下一步'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isProcessed && selectedResponsibility !== 'rider' && selectedResponsibility && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                责任方为{getPartyLabel(selectedResponsibility)}，无需对骑手进行考核
              </p>
            </div>
            <Button onClick={handleSkip}>
              跳过考核，进入下一步
            </Button>
          </CardContent>
        </Card>
      )}

      {isProcessed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent-green" />
              处理结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状态：</span>
              <span className={cn(getAssessmentStatusColor(assessment!.status), 'text-xs px-2 py-0.5 rounded-full')}>
                {getAssessmentStatusLabel(assessment!.status)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">扣分：</span>
                <span className="text-xl font-bold text-accent-red">{assessment!.scoreDeducted} 分</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">罚款：</span>
                <span className="text-xl font-bold text-accent-red">¥{assessment!.fineAmount}</span>
              </div>
            </div>
            {assessment!.trainingId && (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <GraduationCap className="w-4 h-4" />
                <span>已关联生成培训记录</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>处理人：{assessment!.approvedBy || assessment!.createdBy}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
