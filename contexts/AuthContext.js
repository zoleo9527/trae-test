import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

const ROLES = {
  STATION_MANAGER: 'station_manager',
  ENGINEER: 'engineer',
  ADMIN_STAFF: 'admin_staff',
};

const ROLE_NAMES = {
  [ROLES.STATION_MANAGER]: '站长',
  [ROLES.ENGINEER]: '巡检工程师',
  [ROLES.ADMIN_STAFF]: '运维内勤',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '登录失败');
      }
      
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (!Array.isArray(requiredRoles)) {
      return user.role === requiredRoles;
    }
    return requiredRoles.includes(user.role);
  };

  const canAccess = (permission) => {
    if (!user) return false;
    if (user.role === ROLES.STATION_MANAGER) return true;
    
    const rolePermissions = {
      [ROLES.ENGINEER]: ['dashboard', 'work_orders', 'spare_parts', 'power_data'],
      [ROLES.ADMIN_STAFF]: ['dashboard', 'grid_docs', 'payment', 'work_orders', 'spare_parts'],
    };
    
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      hasRole, 
      canAccess,
      ROLES,
      ROLE_NAMES 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
