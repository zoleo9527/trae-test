import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TimelineItem {
  id: string;
  action: string;
  userName: string;
  createdAt: string;
  oldValue?: string;
  newValue?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative pl-10">
            <div className="absolute left-2 w-5 h-5 bg-blue-100 rounded-full border-2 border-blue-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item.action}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(item.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">操作人：{item.userName}</p>
              {item.oldValue && item.newValue && (
                <p className="text-sm text-gray-500 mt-1">
                  {item.oldValue} → <span className="text-blue-600">{item.newValue}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
