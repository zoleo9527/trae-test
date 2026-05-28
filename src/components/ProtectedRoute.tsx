import { Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { UserRole } from '../types'

const PAGE_ROLES: Record<string, UserRole[]> = {
  '/': ['station_master', 'driver', 'customer_service'],
  '/orders': ['station_master', 'customer_service'],
  '/deliveries': ['station_master', 'driver'],
  '/bucket-returns': ['station_master', 'driver', 'customer_service'],
  '/inventory': ['station_master'],
  '/complaints': ['station_master', 'customer_service'],
  '/users': ['station_master'],
}

interface Props {
  path: string
  children: React.ReactNode
}

export default function ProtectedRoute({ path, children }: Props) {
  const { currentUser } = useApp()
  const allowed = PAGE_ROLES[path]

  if (!allowed || allowed.includes(currentUser.role)) {
    return <>{children}</>
  }

  return <Navigate to="/" replace />
}
