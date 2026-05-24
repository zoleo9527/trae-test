import { twMerge } from 'tailwind-merge';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  pending_supplement: 'bg-orange-100 text-orange-700',
  processing: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  required: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-purple-100 text-purple-700'
};

const priorityStyles = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export function StatusBadge({ status, text, variant = 'status' }) {
  const styles = variant === 'priority' ? priorityStyles : statusStyles;
  const style = styles[status] || 'bg-gray-100 text-gray-600';

  return (
    <span className={twMerge(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      style
    )}>
      {text}
    </span>
  );
}
