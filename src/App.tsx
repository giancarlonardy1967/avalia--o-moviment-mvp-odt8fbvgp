import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Onboarding from './pages/Onboarding'
import EmployeeApp from './pages/EmployeeApp'
import Dashboard from './pages/Dashboard'
import HrDashboard from './pages/hr/Dashboard'
import HrCompliance from './pages/hr/Compliance'
import HrTeams from './pages/hr/Teams'
import HrReports from './pages/hr/Reports'
import BrokerDashboard from './pages/BrokerDashboard'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />

            <Route element={<ProtectedRoute allowedRoles={['employee', 'hr_manager', 'admin']} />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/employee" element={<EmployeeApp />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['hr_manager', 'admin']} />}>
              <Route path="/rh/dashboard" element={<HrDashboard />} />
              <Route path="/rh/compliance" element={<HrCompliance />} />
              <Route path="/rh/equipes" element={<HrTeams />} />
              <Route path="/rh/relatorios" element={<HrReports />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['broker_analyst', 'admin']} />}>
              <Route path="/broker-dashboard" element={<BrokerDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
