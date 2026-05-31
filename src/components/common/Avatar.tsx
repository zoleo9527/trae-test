import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserRole } from '../../types';

interface AvatarProps {
  src?: string;
  name: string;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const roleColors: Record<UserRole, string> = {
  manager: 'bg-bakery-brown-500',
  chef: 'bg-bakery-matcha',
  customer_service: 'bg-blue-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  role,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full flex items-center justify-center overflow-hidden',
          sizeClasses[size],
          role && roleColors[role],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-medium">
            {initials || <User className="w-1/2 h-1/2" />}
          </span>
        )}
      </div>
    </div>
  );
};
