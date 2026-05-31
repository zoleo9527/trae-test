import { Permission } from '../types/enums';

export function serializePermissions(permissions: Permission[] | string[]): string {
  return JSON.stringify(permissions);
}

export function deserializePermissions(permissionsStr: string | null | undefined): Permission[] {
  if (!permissionsStr) return [];
  try {
    return JSON.parse(permissionsStr) as Permission[];
  } catch {
    return [];
  }
}

export function transformUser(user: any) {
  if (!user) return user;
  return {
    ...user,
    permissions: deserializePermissions(user.permissions),
  };
}

export function serializeJson(data: any): string | null {
  if (data === undefined || data === null) return null;
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

export function deserializeJson<T = any>(str: string | null | undefined): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}
