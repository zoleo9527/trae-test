import { useState, useEffect } from 'react';
import { X, AlertTriangle, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  workOrderPriorityLabels,
  workOrderPriorityColors,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { WorkOrderPriority, Alarm } from '../types';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm?: Alarm | null;
  onSuccess?: (workOrderId: string) => void;
}

const priorityOptions: { value: WorkOrderPriority; label: string }[] = [
  { value: 'critical', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export default function CreateWorkOrderModal({
  isOpen,
  onClose,
  alarm,
  onSuccess,
}: CreateWorkOrderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('high');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWorkOrder = useStore((state) => state.createWorkOrder);
  const getEngineers = useStore((state) => state.getEngineers);
  const currentUser = useStore((state) => state.currentUser);

  const engineers = getEngineers();

  useEffect(() => {
    if (isOpen && alarm) {
      setTitle(`处理${alarm.type}: ${alarm.inverterId}`);
      setDescription(alarm.description);
      setPriority(alarm.level === 'critical' ? 'critical' : alarm.level === 'warning' ? 'high' : 'medium');
    } else if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('high');
      setAssigneeId('');
      setDeadlineHours(24);
    }
  }, [isOpen, alarm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeId) return;

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const workOrderId = createWorkOrder({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeId,
      alarmId: alarm?.id,
      deadlineHours,
    });

    setIsSubmitting(false);
    onSuccess?.(workOrderId);
    onClose();
  };

  if (!isOpen) return null;

  const canCreate = currentUser?.role === 'staff' || currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">创建巡检工单</h3>
              {alarm && (
                <p className="text-xs text-slate-500">关联告警: {alarm.inverterId}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {alarm && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-slate-800 text-sm">关联发电预警</span>
              </div>
              <p className="text-sm text-slate-600">{alarm.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>设备: {alarm.inverterId}</span>
                <span>当前值: {alarm.currentValue}</span>
                <span>阈值: {alarm.thresholdValue}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              工单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入工单标题..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              问题描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述问题情况..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                优先级 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                      priority === opt.value
                        ? workOrderPriorityColors[opt.value]
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                处理时限（小时）
              </label>
              <select
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value={4}>4 小时（紧急）</option>
                <option value={8}>8 小时</option>
                <option value={24}>24 小时</option>
                <option value={48}>48 小时</option>
                <option value={72}>72 小时</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              分派给 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {engineers.map((engineer) => (
                <button
                  key={engineer.id}
                  type="button"
                  onClick={() => setAssigneeId(engineer.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                    assigneeId === engineer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <img
                    src={engineer.avatar}
                    alt={engineer.name}
                    className="w-10 h-10 rounded-full bg-slate-200"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{engineer.name}</p>
                    <p className="text-xs text-slate-500">{engineer.station}</p>
                  </div>
                  {assigneeId === engineer.id && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canCreate || isSubmitting || !title.trim() || !assigneeId}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  创建中...
                </>
              ) : (
                '创建工单'
              )}
            </button>
          </div>

          {!canCreate && (
            <p className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
              只有运维内勤或站长可以创建工单
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
