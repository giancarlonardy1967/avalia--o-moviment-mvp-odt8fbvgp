import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  const role = user.role || 'employee'

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'employee') {
      return <Navigate to="/employee" replace />
    }
    return <Navigate to="/rh/dashboard" replace />
  }

  return <Outlet />
}
