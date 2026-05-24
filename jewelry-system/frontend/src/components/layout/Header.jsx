import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ChevronDown } from 'lucide-react';

export function Header({ title }) {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { currentRole, ROLES, ROLE_NAMES, switchRole } = useAuth();

  const roleOptions = [
    { value: ROLES.CONSULTANT, label: ROLE_NAMES[ROLES.CONSULTANT] },
    { value: ROLES.COPYWRITER, label: ROLE_NAMES[ROLES.COPYWRITER] },
    { value: ROLES.VISA_ASSISTANT, label: ROLE_NAMES[ROLES.VISA_ASSISTANT] }
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              角色: {ROLE_NAMES[currentRole]}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="p-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      switchRole(option.value);
                      setShowRoleSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      currentRole === option.value
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  切换角色可体验不同权限的功能视图
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
