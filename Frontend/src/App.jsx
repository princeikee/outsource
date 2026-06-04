import { useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from './components/AuthPage'
import Layout from './components/Layout'
import Accounting from './pages/Accounting'
import Attendance from './pages/Attendance'
import Companies from './pages/Companies'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import HR from './pages/HR'
import LeaveRequestsAdmin from './pages/LeaveRequestsAdmin'
import Payroll from './pages/Payroll'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import EmployeeAttendance from './pages/employee/EmployeeAttendance'
import LeaveRequests from './pages/employee/LeaveRequests'
import EmployeeProfile from './pages/employee/EmployeeProfile'
import Payslips from './pages/employee/Payslips'
import { authApi } from './services/api'
import taskflowImage from './assets/taskflowimage.jpeg'

const superAdminPages = {
  companies: { title: 'Tenant Management', path: '/companies' },
  settings: { title: 'Settings', path: '/platform/settings' },
}

const companyAdminPages = {
  dashboard: { title: 'Dashboard Overview', path: '/dashboard' },
  hr: { title: 'HR Management', path: '/hr' },
  leaveRequests: { title: 'Leave Requests', path: '/leave-requests' },
  employees: { title: 'Employee Directory', path: '/employees' },
  attendance: { title: 'Attendance Tracking', path: '/attendance' },
  payroll: { title: 'Payroll Processing', path: '/payroll' },
  accounting: { title: 'Basic Accounting', path: '/accounting' },
  reports: { title: 'Business Reports', path: '/reports' },
  settings: { title: 'Settings', path: '/settings' },
}

const employeePages = {
  employeeAttendance: { title: 'My Attendance', path: '/employee/attendance' },
  leaveRequests: { title: 'Leave Requests', path: '/employee/leave' },
  payslips: { title: 'My Payslips', path: '/employee/payslips' },
  profile: { title: 'My Profile', path: '/employee/profile' },
  settings: { title: 'Settings', path: '/employee/settings' },
}

const AUTH_STORAGE_KEY = 'taskflow_erp_auth'
const LEGACY_AUTH_STORAGE_KEY = 'nova_erp_auth'

export default function App() {
  const [auth, setAuth] = useState(readStoredAuth)
  const [authError, setAuthError] = useState('')
  const [appealContext, setAppealContext] = useState(null)
  const [appealNotice, setAppealNotice] = useState('')
  const [isAuthLoading, setAuthLoading] = useState(false)
  const navigate = useNavigate()
  const isLoggedIn = Boolean(auth?.token && auth?.user)
  const isEmployee = isEmployeeRole(auth?.user?.role)
  const isSuperAdmin = auth?.user?.role === 'SUPER_ADMIN'

  async function handleLogin(credentials) {
    setAppealContext(null)
    setAppealNotice('')
    await runAuthRequest(async () => {
      const result = await authApi.login(credentials)
      saveAuth(result)
      navigate(getHomePath(result.user), { replace: true })
    })
  }

  async function handleRegister(payload) {
    setAppealContext(null)
    setAppealNotice('')
    await runAuthRequest(async () => {
      const result = await authApi.register(payload)
      if (result.pendingApproval) {
        setAppealNotice(result.message || 'Company account created and is pending super admin approval.')
        navigate('/login', { replace: true })
        return
      }
      saveAuth(result)
      navigate('/dashboard', { replace: true })
    })
  }

  async function runAuthRequest(request) {
    setAuthLoading(true)
    setAuthError('')

    try {
      await request()
    } catch (error) {
      setAuthError(formatAuthError(error))
      setAppealContext(error.details?.appealAllowed ? error.details : null)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleAppeal(payload) {
    setAuthLoading(true)
    setAuthError('')
    setAppealNotice('')

    try {
      const result = await authApi.appeal(payload)
      setAppealNotice(result.notice || 'Your appeal has been submitted.')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  function saveAuth(result) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result))
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    setAuth(result)
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
    setAuth(null)
    navigate('/login', { replace: true })
  }

  function updateStoredAuth(partial) {
    setAuth((current) => {
      const next = { ...current, ...partial, user: { ...current.user, ...partial.user } }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to={getHomePath(auth.user)} replace /> : <AuthPage appealContext={appealContext} appealNotice={appealNotice} mode="login" error={authError} isLoading={isAuthLoading} onAppeal={handleAppeal} onLogin={handleLogin} />}
      />
      <Route
        path="/register"
        element={isLoggedIn ? <Navigate to={getHomePath(auth.user)} replace /> : <AuthPage mode="register" appealNotice={appealNotice} error={authError} isLoading={isAuthLoading} onRegister={handleRegister} />}
      />

      <Route element={isLoggedIn ? <AppShell auth={auth} onAuthUpdate={updateStoredAuth} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to={getHomePath(auth?.user)} replace />} />

        <Route element={<RequireSuperAdmin isSuperAdmin={isSuperAdmin} />}>
          <Route path="/companies" element={<Companies auth={auth} />} />
          <Route path="/platform/settings" element={<Settings auth={auth} onAuthUpdate={updateStoredAuth} />} />
        </Route>

        <Route element={<RequireCompanyAdmin user={auth?.user} />}>
          <Route path="/dashboard" element={<Dashboard auth={auth} />} />
          <Route path="/hr" element={<HR auth={auth} />} />
          <Route path="/leave-requests" element={<LeaveRequestsAdmin auth={auth} />} />
          <Route path="/employees" element={<Employees auth={auth} />} />
          <Route path="/attendance" element={<Attendance auth={auth} />} />
          <Route path="/payroll" element={<Payroll auth={auth} />} />
          <Route path="/accounting" element={<Accounting auth={auth} />} />
          <Route path="/reports" element={<Reports auth={auth} />} />
          <Route path="/settings" element={<Settings auth={auth} onAuthUpdate={updateStoredAuth} />} />
        </Route>

        <Route element={<RequireEmployee isEmployee={isEmployee} />}>
          <Route path="/employee/attendance" element={<EmployeeAttendance auth={auth} />} />
          <Route path="/employee/leave" element={<LeaveRequests auth={auth} />} />
          <Route path="/employee/payslips" element={<Payslips auth={auth} />} />
          <Route path="/employee/profile" element={<EmployeeProfile user={auth?.user} />} />
          <Route path="/employee/settings" element={<Settings auth={auth} onAuthUpdate={updateStoredAuth} />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isLoggedIn ? getHomePath(auth.user) : '/login'} replace />} />
    </Routes>
  )
}

function RequireSuperAdmin({ isSuperAdmin }) {
  return isSuperAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function RequireCompanyAdmin({ user }) {
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/companies" replace />
  return isCompanyAdminRole(user?.role) ? <Outlet /> : <Navigate to="/employee/attendance" replace />
}

function RequireEmployee({ isEmployee }) {
  return isEmployee ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function AppShell({ auth, onAuthUpdate, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showTaskflowPrompt, setShowTaskflowPrompt] = useState(true)
  const isEmployee = isEmployeeRole(auth?.user?.role)
  const pages = auth?.user?.role === 'SUPER_ADMIN' ? superAdminPages : isEmployee ? employeePages : companyAdminPages
  const activePage = getActivePage(location.pathname, pages)
  const pageTitle = pages[activePage]?.title ?? 'Dashboard Overview'

  function handleNavigate(page) {
    navigate(pages[page].path)
  }

  return (
    <>
      <Layout
        activePage={activePage}
        pageTitle={pageTitle}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        token={auth.token}
        user={auth.user}
        variant={auth?.user?.role === 'SUPER_ADMIN' ? 'super-admin' : isEmployee ? 'employee' : 'company-admin'}
      />
      {showTaskflowPrompt && <TaskflowPrompt onDismiss={() => setShowTaskflowPrompt(false)} />}
    </>
  )
}

function TaskflowPrompt({ onDismiss }) {
  return (
    <aside className="taskflow-slide-in fixed bottom-5 left-5 z-50 w-[calc(100vw-2.5rem)] max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
      <div className="flex gap-4 p-5">
        <img src={taskflowImage} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-extrabold leading-snug text-gray-950">Stop drowning in scattered work and operational chaos.</p>
            <button type="button" aria-label="Dismiss Taskflow prompt" className="rounded p-1 text-xl font-bold leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={onDismiss}>
              ×
            </button>
          </div>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-600">Plan projects, track real-time progress, and keep your team moving with Taskflow.</p>
          <a
            href="https://task-flow-1-ytvo.onrender.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-700"
          >
            Create Taskflow Account
          </a>
        </div>
      </div>
    </aside>
  )
}

function getActivePage(pathname, pages) {
  const page = Object.entries(pages).find(([, config]) => config.path === pathname)
  return page?.[0] ?? Object.keys(pages)[0]
}

function getHomePath(user) {
  if (user?.role === 'SUPER_ADMIN') return '/companies'
  return isEmployeeRole(user?.role) ? '/employee/attendance' : '/dashboard'
}

function isEmployeeRole(role) {
  return role === 'EMPLOYEE' || role === 'staff' || role === 'employee'
}

function isCompanyAdminRole(role) {
  return role === 'COMPANY_ADMIN' || role === 'HR'
}

function formatAuthError(error) {
  if (!error.details) return error.message
  const reason = error.details.reason ? ` Reason: ${error.details.reason}` : ''
  const appeal = error.details.appealMessage ? ` ${error.details.appealMessage}` : ''
  return `${error.message}.${reason}${appeal}`
}

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
