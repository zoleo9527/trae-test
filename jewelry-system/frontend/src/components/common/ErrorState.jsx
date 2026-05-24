import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorState({ 
  title = '加载失败', 
  message = '抱歉，加载数据时出现错误，请稍后重试。',
  onRetry,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重新加载
        </button>
      )}
    </div>
  );
}
