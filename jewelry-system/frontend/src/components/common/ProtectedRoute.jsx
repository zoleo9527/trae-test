import { useAuth } from '../../context/AuthContext';
import { ForbiddenState } from './ForbiddenState';

export function ProtectedRoute({ permission, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <ForbiddenState />;
  }

  return children;
}
