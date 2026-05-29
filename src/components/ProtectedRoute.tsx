import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [profileState, setProfileState] = useState<{ complete: boolean; checked: boolean }>({
    complete: false,
    checked: false,
  })

  useEffect(() => {
    if (user && isAuthenticated) {
      pb.collection('employee_profiles')
        .getFirstListItem(`user_id = '${user.id}'`)
        .then((profile) => {
          setProfileState({
            complete: !!profile?.company_name && !!profile?.last_checkin_at,
            checked: true,
          })
        })
        .catch(() => {
          setProfileState({ complete: false, checked: true })
        })
    } else if (!loading && !isAuthenticated) {
      setProfileState({ complete: false, checked: true })
    }
  }, [user, isAuthenticated, loading, location.pathname])

  if (loading || (!profileState.checked && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  // Redirect employees to onboarding if incomplete
  if (!profileState.complete && location.pathname !== '/onboarding' && user?.role === 'employee') {
    return <Navigate to="/onboarding" replace />
  }

  // Prevent accessing onboarding again if complete
  if (profileState.complete && location.pathname === '/onboarding') {
    return <Navigate to="/employee" replace />
  }

  return <Outlet />
}
