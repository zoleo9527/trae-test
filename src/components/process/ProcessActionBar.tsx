import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Eye, FileText, Coins, ClipboardCheck, GraduationCap } from 'lucide-react';
import { useProcessStore } from '@/store/process.store';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { cn } from '@/lib/utils';
import type { ProcessStep } from '@/types';

const allSteps: Array<{
  key: ProcessStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  { key: 'review', label: '订单审核', icon: Eye, description: '查看订单详情和时间线' },
  { key: 'appeal', label: '申诉处理', icon: FileText, description: '处理用户申诉，判定责任' },
  { key: 'subsidy', label: '补贴审核', icon: Coins, description: '审核补贴申请，确定金额' },
  { key: 'assessment', label: '考核处理', icon: ClipboardCheck, description: '发起或审核骑手考核' },
  { key: 'training', label: '培训跟进', icon: GraduationCap, description: '生成并跟踪培训任务' },
  { key: 'complete', label: '处理完成', icon: CheckCircle, description: '所有流程已完成' },
];

interface ProcessActionBarProps {
  allowedSteps?: ProcessStep[];
}

export function ProcessActionBar({ allowedSteps }: ProcessActionBarProps) {
  const navigate = useNavigate();
  const { processState, order, setCurrentStep } = useProcessStore();

  if (!processState || !order) return null;

  const steps = allowedSteps ? allSteps.filter(s => allowedSteps.includes(s.key)) : allSteps;
  const currentIndex = steps.findIndex(s => s.key === processState.currentStep);

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleNextStep = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handleBackToList = () => {
    navigate('/orders');
  };

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleBackToList}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回订单列表
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <Tag variant="primary">{order.id}</Tag>
            <span className="text-sm text-gray-500">骑手：{order.riderName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-4">
            {steps.slice(0, -1).map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = step.key === processState.currentStep;
              const isCompleted = processState.completedSteps.includes(step.key);

              return (
                <button
                  key={step.key}
                  onClick={() => setCurrentStep(step.key)}
                  className={cn(
                    'group flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm',
                    isActive
                      ? 'bg-primary-700 text-white'
                      : isCompleted
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'text-gray-500 hover:bg-gray-100'
                  )}
                  title={step.description}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                  <span className={cn(isActive ? 'text-white' : '')}>
                    {idx + 1}. {step.label}
                  </span>
                </button>
              );
            })}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-gray-100 text-gray-400">
              <CheckCircle className="w-4 h-4" />
              <span>{steps.length}. 处理完成</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handlePrevStep}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={currentIndex === steps.length - 1}
            >
              下一步
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
