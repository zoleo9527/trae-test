import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { Role, RoleLabels } from '@/types';

export function RoleSwitcher() {
  const { currentUser, currentRole, switchRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: Role[] = ['project_manager', 'quality_engineer', 'team_leader'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
      >
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {RoleLabels[currentRole]}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => {
                switchRole(role);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                role === currentRole ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
              }`}
            >
              <div className="font-medium">{RoleLabels[role]}</div>
              {role === currentRole && currentUser && (
                <div className="text-xs text-gray-500 mt-0.5">
                  当前用户: {currentUser.name}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
