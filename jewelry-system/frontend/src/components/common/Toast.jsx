import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  const Icon = toastIcons[type];

  useEffect(() => {
    if (onClose && duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  return (
    <div className={twMerge(
      'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in',
      toastStyles[type]
    )}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove?.(toast.id)}
        />
      ))}
    </div>
  );
}
