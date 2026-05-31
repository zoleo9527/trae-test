"use client";

import { useAuthStore } from "@/store/authStore";

interface RoleGuardProps {
  allowed: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ allowed, children, fallback }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !allowed.includes(user.role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
