import { createContext, useContext, useState } from 'react';

const ROLES = {
  CONSULTANT: 'consultant',
  COPYWRITER: 'copywriter',
  VISA_ASSISTANT: 'visa_assistant'
};

const ROLE_NAMES = {
  [ROLES.CONSULTANT]: '顾问主管',
  [ROLES.COPYWRITER]: '文案老师',
  [ROLES.VISA_ASSISTANT]: '签证助理'
};

const ROLE_PERMISSIONS = {
  [ROLES.CONSULTANT]: ['dashboard', 'cases', 'documents', 'supplements', 'refunds', 'reports'],
  [ROLES.COPYWRITER]: ['dashboard', 'cases', 'documents', 'supplements'],
  [ROLES.VISA_ASSISTANT]: ['dashboard', 'cases', 'supplements']
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(ROLES.CONSULTANT);
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: '张明',
    role: ROLES.CONSULTANT
  });

  const switchRole = (role) => {
    setCurrentRole(role);
    setCurrentUser(prev => ({ ...prev, role }));
  };

  const hasPermission = (permission) => {
    return ROLE_PERMISSIONS[currentRole]?.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      currentRole,
      currentUser,
      switchRole,
      hasPermission,
      ROLES,
      ROLE_NAMES,
      ROLE_PERMISSIONS
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
