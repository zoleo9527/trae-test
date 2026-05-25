import { TASK_PRIORITY_NAMES } from '../data/constants.js';

const priorityColors = {
  urgent: 'bg-danger-500',
  high: 'bg-warning-500',
  medium: 'bg-info-500',
  low: 'bg-gray-400'
};

export default function PriorityBadge({ priority }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${priorityColors[priority] || priorityColors.low}`} />
      <span className="text-xs text-gray-600">{TASK_PRIORITY_NAMES[priority] || priority}</span>
    </span>
  );
}
