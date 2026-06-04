import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Icon from './Icon'
import taskflowLogo from '../assets/taskflowimage.jpeg'
import { leaveApi } from '../services/api'

const superAdminNavGroups = [
  {
    label: 'Platform',
    items: [
      { key: 'companies', label: 'Tenants / Companies', icon: 'building' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

const companyAdminNavGroups = [
  { label: 'Dashboard', items: [{ key: 'dashboard', label: 'Overview', icon: 'layout-dashboard' }] },
  {
    label: 'HR & Workforce',
    items: [
      { key: 'hr', label: 'HR Management', icon: 'users' },
      { key: 'employees', label: 'Employee Management', icon: 'user-check' },
      { key: 'leaveRequests', label: 'Leave Requests', icon: 'umbrella' },
      { key: 'attendance', label: 'Attendance', icon: 'calendar-check' },
      { key: 'payroll', label: 'Payroll', icon: 'banknote' },
    ],
  },
  {
    label: 'Finance & Data',
    items: [
      { key: 'accounting', label: 'Basic Accounting', icon: 'book-open' },
      { key: 'reports', label: 'Reports', icon: 'bar-chart-3' },
    ],
  },
  { label: 'Workspace', items: [{ key: 'settings', label: 'Settings', icon: 'settings' }] },
]

const employeeNavGroups = [
  {
    label: 'My Work',
    items: [
      { key: 'employeeAttendance', label: 'Attendance', icon: 'calendar-check' },
      { key: 'leaveRequests', label: 'Leave Requests', icon: 'umbrella' },
      { key: 'payslips', label: 'Payslips', icon: 'banknote' },
      { key: 'profile', label: 'Profile', icon: 'user-check' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

export default function Layout({ activePage, onLogout, onNavigate, pageTitle, token, user, variant = 'admin' }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationError, setNotificationError] = useState('')
  const [reviewNotes, setReviewNotes] = useState({})
  const navGroups = variant === 'super-admin' ? superAdminNavGroups : variant === 'employee' ? employeeNavGroups : companyAdminNavGroups
  const companyName = user?.company?.name || 'Company Workspace'
  const userName = user?.name || 'User'
  const userRole = user?.role || 'staff'
  const canReviewLeave = userRole === 'COMPANY_ADMIN' || userRole === 'HR'
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleNavigate(page) {
    onNavigate(page)
    setSidebarOpen(false)
  }

  useEffect(() => {
    if (!canReviewLeave || !token) return
    loadNotifications()
  }, [canReviewLeave, token])

  async function loadNotifications() {
    setNotificationError('')
    try {
      setNotifications(await leaveApi.list(token, 'pending'))
    } catch (error) {
      setNotificationError(error.message)
    }
  }

  function updateReviewNote(id, value) {
    setReviewNotes((current) => ({ ...current, [id]: value }))
  }

  async function reviewLeaveRequest(id, status) {
    setNotificationError('')
    try {
      const note = reviewNotes[id]?.trim()
      await leaveApi.review(token, id, { status, ...(note ? { note } : {}) })
      setReviewNotes((current) => ({ ...current, [id]: '' }))
      await loadNotifications()
    } catch (error) {
      setNotificationError(error.message)
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50 text-gray-800">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-20 bg-gray-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col bg-sidebar text-gray-300 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-700/50 p-6">
          <div className="flex items-center gap-3">
            <img src={taskflowLogo} alt="Taskflow ERP logo" className="h-11 w-11 rounded-lg object-cover" />
            <span className="text-xl font-bold tracking-tight text-white">Taskflow ERP</span>
          </div>
          <button type="button" aria-label="Close menu" className="rounded-md p-2 text-gray-400 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)}>
            <Icon name="x" className="h-6 w-6" />
          </button>
        </div>

        <nav className="scrollbar-hide flex-1 overflow-y-auto py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 first:mt-0">{group.label}</div>
              {group.items.map((item) => {
                const active = item.key === activePage
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`flex w-full items-center border-r-3 px-6 py-3 text-left text-sm font-medium transition hover:bg-sidebar-hover hover:text-white ${active ? 'border-primary-400 bg-sidebar-hover text-primary-400' : 'border-transparent'}`}
                    onClick={() => handleNavigate(item.key)}
                  >
                    <Icon name={item.icon} className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-primary-400 to-primary-600 text-sm font-bold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="truncate text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" aria-label="Open menu" className="rounded-md p-2 text-gray-500 hover:text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <h2 className="truncate text-lg font-semibold text-gray-800">{pageTitle}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden min-h-11 items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 sm:flex">
                <Icon name="building-2" className="h-4 w-4 text-primary-600" />
                <span className="max-w-44 truncate">{companyName}</span>
            </div>

            <div className="mx-1 hidden h-6 w-px bg-gray-200 md:block" />
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Icon name="bell" className="h-5 w-5" />
                {notifications.length > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">{notifications.length}</span>}
              </button>
              {isNotificationsOpen && (
                <NotificationsPanel
                  error={notificationError}
                  notifications={notifications}
                  reviewNotes={reviewNotes}
                  onNoteChange={updateReviewNote}
                  onApprove={(id) => reviewLeaveRequest(id, 'approved')}
                  onClose={() => setNotificationsOpen(false)}
                  onDecline={(id) => reviewLeaveRequest(id, 'rejected')}
                />
              )}
            </div>
            <button type="button" aria-label="Logout" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600" onClick={onLogout}>
              <Icon name="log-out" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="scrollbar-hide flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function NotificationsPanel({ error, notifications, reviewNotes, onNoteChange, onApprove, onClose, onDecline }) {
  return (
    <section className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="font-bold text-gray-900">Notifications</h3>
          <p className="text-xs text-gray-500">Pending leave requests</p>
        </div>
        <button type="button" className="rounded px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100" onClick={onClose}>
          Close
        </button>
      </div>

      {error && <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="max-h-96 overflow-y-auto">
        {notifications.length ? (
          notifications.map((request) => (
            <article key={request.id} className="border-b border-gray-100 p-4 last:border-b-0">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{request.employeeName}</p>
                  <p className="mt-1 text-sm text-gray-500">{request.type} leave: {formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
                  {request.reason && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{request.reason}</p>}
                </div>
                <span className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Pending</span>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Review note</label>
                <textarea
                  rows="3"
                  value={reviewNotes[request.id] || ''}
                  onChange={(event) => onNoteChange(request.id, event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Add a short comment for the employee"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="min-h-9 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700" onClick={() => onApprove(request.id)}>
                  Accept
                </button>
                <button type="button" className="min-h-9 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700" onClick={() => onDecline(request.id)}>
                  Decline
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="p-6 text-center text-sm text-gray-500">No pending leave requests.</div>
        )}
      </div>
    </section>
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
