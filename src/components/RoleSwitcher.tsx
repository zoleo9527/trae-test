import { useState } from 'react';
import { ChevronDown, Crown, Shield, Store } from 'lucide-react';
import { useRoleStore } from '@/store/useRoleStore';
import { ROLE_LABELS, type Role } from '@/types';
import { cn } from '@/lib/utils';

const roleIcons: Record<Role, typeof Crown> = {
  factory_manager: Crown,
  inspector: Shield,
  store_handler: Store,
};

const roleColors: Record<Role, string> = {
  factory_manager: 'text-amber-400',
  inspector: 'text-purple-400',
  store_handler: 'text-teal-400',
};

export default function RoleSwitcher() {
  const { currentRole, setRole } = useRoleStore();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = roleIcons[currentRole];

  const roles: Role[] = ['factory_manager', 'inspector', 'store_handler'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 transition-all hover:border-slate-600',
          roleColors[currentRole]
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium">{ROLE_LABELS[currentRole]}</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl z-50">
          {roles.map((role) => {
            const RoleIcon = roleIcons[role];
            const isSelected = role === currentRole;
            return (
              <button
                key={role}
                onClick={() => {
                  setRole(role);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-700',
                  isSelected ? 'bg-slate-700' : '',
                  roleColors[role]
                )}
              >
                <RoleIcon className="w-5 h-5" />
                <span className="text-sm">{ROLE_LABELS[role]}</span>
                {isSelected && (
                  <span className="ml-auto text-xs bg-slate-600 px-2 py-0.5 rounded">当前</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
