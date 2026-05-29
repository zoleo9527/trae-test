import { Clock, Package, FileText, Coins, ClipboardCheck, GraduationCap, AlertTriangle } from 'lucide-react';
import type { TimelineEvent } from '@/types';
import { cn } from '@/lib/utils';

interface VerticalTimelineProps {
  events: TimelineEvent[];
  highlightId?: string;
  onEventClick?: (event: TimelineEvent) => void;
}

const eventIcons: Record<TimelineEvent['type'], React.ComponentType<{ className?: string }>> = {
  order: Package,
  appeal: FileText,
  subsidy: Coins,
  assessment: ClipboardCheck,
  training: GraduationCap,
  status_change: AlertTriangle,
};

const eventColors: Record<TimelineEvent['type'], string> = {
  order: 'bg-blue-500',
  appeal: 'bg-amber-500',
  subsidy: 'bg-green-500',
  assessment: 'bg-red-500',
  training: 'bg-purple-500',
  status_change: 'bg-gray-500',
};

const eventBorderColors: Record<TimelineEvent['type'], string> = {
  order: 'border-blue-200 bg-blue-50',
  appeal: 'border-amber-200 bg-amber-50',
  subsidy: 'border-green-200 bg-green-50',
  assessment: 'border-red-200 bg-red-50',
  training: 'border-purple-200 bg-purple-50',
  status_change: 'border-gray-200 bg-gray-50',
};

export function VerticalTimeline({ events, highlightId, onEventClick }: VerticalTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Clock className="w-12 h-12 mb-2" />
        <p className="text-sm">暂无事件记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = eventIcons[event.type];
          const isLast = index === events.length - 1;
          const isHighlighted = event.id === highlightId;

          return (
            <div
              key={event.id}
              className={cn(
                'relative flex gap-4 pl-12 transition-all duration-200',
                onEventClick && 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded',
                isHighlighted && 'bg-primary-50 -mx-2 px-2 py-1 rounded'
              )}
              onClick={() => onEventClick?.(event)}
            >
              <div className={cn(
                'absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10',
                eventColors[event.type]
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <div className={cn(
                'flex-1 border rounded-lg p-4',
                eventBorderColors[event.type]
              )}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <span className="text-xs text-gray-500 font-mono whitespace-nowrap ml-4">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
