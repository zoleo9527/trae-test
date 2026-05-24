import { Lock, ShieldAlert, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ForbiddenState({ 
  title = '无权限访问', 
  message = '抱歉，您没有权限访问此页面，请联系管理员获取权限。',
  action = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-8">{message}</p>
      
      <div className="flex items-center gap-3">
        {action || (
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            返回工作台
          </Link>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-md">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">权限说明</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 顾问主管：全部功能访问权限</li>
              <li>• 文案老师：签证进度、材料管理、补件回查</li>
              <li>• 签证助理：签证进度、补件回查</li>
            </ul>
            <p className="text-xs text-gray-400 mt-2">
              可点击右上角「角色切换」体验不同角色的功能视图
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
