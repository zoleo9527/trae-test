import { Link } from 'react-router-dom';

export default function StatCard({ title, value, subtitle, icon: Icon, color, to, badge }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    info: 'bg-info-100 text-info-600',
    success: 'bg-green-100 text-green-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const content = (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.gray}`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      {badge && (
        <div className="mt-3">
          {badge}
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
}
