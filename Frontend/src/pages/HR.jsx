import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { hrApi, leaveApi } from '../services/api'

const departmentColors = [
  'bg-blue-50 text-blue-600',
  'bg-pink-50 text-pink-600',
  'bg-orange-50 text-orange-600',
  'bg-teal-50 text-teal-600',
  'bg-green-50 text-green-600',
  'bg-indigo-50 text-indigo-600',
  'bg-amber-50 text-amber-600',
  'bg-red-50 text-red-600',
]

const emptyHrData = {
  summary: {
    openPositions: 0,
    openPositionsSub: 'No open positions recorded',
    onLeaveToday: 0,
    onLeaveTodaySub: 'No leave records for today',
    pendingApprovals: 0,
    pendingApprovalsSub: 'No pending approvals',
  },
  departments: [],
  recruitment: { openPositions: [], note: 'Recruitment records will appear here when open positions are added.' },
  approvals: { queues: [], note: 'Approval queues will appear here when leave or expense approval records exist.' },
  leave: { onLeaveToday: [], note: 'Leave records will appear here when leave tracking is added.' },
}

const emptyPositionForm = {
  department: '',
  title: '',
  openings: '1',
  status: 'Open',
  priority: '',
  notes: '',
}

export default function HR({ auth }) {
  const [activeView, setActiveView] = useState('overview')
  const [data, setData] = useState(emptyHrData)
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [isPositionFormOpen, setPositionFormOpen] = useState(false)
  const [isSavingPosition, setSavingPosition] = useState(false)
  const [positionForm, setPositionForm] = useState(emptyPositionForm)

  useEffect(() => {
    let isMounted = true

    loadHrData()

    return () => {
      isMounted = false
    }

    async function loadHrData() {
      setLoading(true)
      setError('')

      try {
        const result = await hrApi.overview(auth.token)
        if (isMounted) setData({ ...emptyHrData, ...result })
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
  }, [auth.token])

  async function refreshHrData() {
    const result = await hrApi.overview(auth.token)
    setData({ ...emptyHrData, ...result })
  }

  async function reviewLeaveRequest(id, status) {
    setError('')

    try {
      await leaveApi.review(auth.token, id, { status })
      await refreshHrData()
    } catch (reviewError) {
      setError(reviewError.message)
    }
  }

  function updatePositionField(event) {
    const { name, value } = event.target
    setPositionForm((current) => ({ ...current, [name]: value }))
  }

  async function handleCreatePosition(event) {
    event.preventDefault()
    setSavingPosition(true)
    setError('')

    try {
      await hrApi.createPosition(auth.token, {
        department: positionForm.department.trim() || undefined,
        title: positionForm.title.trim(),
        openings: Number(positionForm.openings || 1),
        status: positionForm.status,
        priority: positionForm.priority.trim() || undefined,
        notes: positionForm.notes.trim() || undefined,
      })
      await refreshHrData()
      setPositionForm(emptyPositionForm)
      setPositionFormOpen(false)
      setActiveView('recruitment')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingPosition(false)
    }
  }

  const summary = data.summary || emptyHrData.summary
  const departments = data.departments || []
  const openPositions = data.recruitment?.openPositions || []
  const approvals = data.approvals?.queues || []

  return (
    <>
      <section className="mb-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">HR Overview</h3>
            <p className="mt-1 text-sm text-gray-500">Workforce operations, recruitment activity, and HR approval queues for this company.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ViewButton active={activeView === 'overview'} label="Overview" onClick={() => setActiveView('overview')} />
            <ViewButton active={activeView === 'recruitment'} label="Recruitment" onClick={() => setActiveView('recruitment')} />
            <ViewButton active={activeView === 'approvals'} label="Approvals" onClick={() => setActiveView('approvals')} />
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatPanel title="Open Positions" value={isLoading ? '...' : summary.openPositions} sub={summary.openPositionsSub} icon="briefcase" tone="blue" onClick={() => setActiveView('recruitment')} />
          <StatPanel title="On Leave Today" value={isLoading ? '...' : summary.onLeaveToday} sub={summary.onLeaveTodaySub} icon="umbrella" tone="purple" />
          <StatPanel title="Pending Approvals" value={isLoading ? '...' : summary.pendingApprovals} sub={summary.pendingApprovalsSub} icon="clock" tone="orange" onClick={() => setActiveView('approvals')} />
        </div>
      </section>

      {activeView === 'overview' && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
            <SectionHeader
              title="Organization Structure"
              subtitle="Departments and current employee distribution from employee records."
              action="Manage Departments"
            />
            {isLoading ? (
              <LoadingBlock text="Loading departments..." />
            ) : departments.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {departments.map((department, index) => (
                  <DepartmentCard
                    key={department.id || department.name}
                    name={department.name}
                    count={department.employeeCount}
                    color={departmentColors[index % departmentColors.length]}
                    onClick={() => setSelectedDepartment(department)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon="users" title="No departments yet" text="Departments will appear here after employees are assigned to departments." />
            )}
          </section>

          <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <SectionHeader title="Operational Queues" subtitle="Quick access to active HR work." />
            <div className="space-y-3">
              <QueueButton icon="briefcase" title="Recruitment" text={`${summary.openPositions} open positions`} onClick={() => setActiveView('recruitment')} />
              <QueueButton icon="clock" title="Approvals" text={`${summary.pendingApprovals} pending approvals`} onClick={() => setActiveView('approvals')} />
              <QueueButton icon="umbrella" title="Leave Monitoring" text={`${summary.onLeaveToday} employees on leave today`} />
            </div>
          </section>
        </div>
      )}

      {activeView === 'recruitment' && (
        <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Recruitment"
            subtitle="Basic open-position management for current hiring needs."
            action="Add Position"
            onAction={() => setPositionFormOpen(true)}
          />
          {openPositions.length ? (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-gray-50 font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Open Positions</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {openPositions.map((position) => (
                    <tr key={position.id || position.department} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{position.department}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="font-medium text-gray-900">{position.title}</span>
                        <span className="ml-2 text-gray-500">{position.summary}</span>
                      </td>
                      <td className="px-6 py-4"><span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{position.status}</span></td>
                      <td className="px-6 py-4 text-right"><button type="button" className="text-sm font-semibold text-primary-600 hover:text-primary-800">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="briefcase" title="No open positions recorded" text={data.recruitment?.note || emptyHrData.recruitment.note} action="Add Position" onAction={() => setPositionFormOpen(true)} />
          )}
        </section>
      )}

      {activeView === 'approvals' && (
        <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Approvals"
            subtitle="Pending HR and finance approvals that need review."
            action="Review All"
          />
            {approvals.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {approvals.map((approval) => (
                <article key={approval.id || approval.title} className="rounded-lg border border-gray-100 bg-gray-50 p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{approval.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">{approval.text}</p>
                    </div>
                    <span className="rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">{approval.status}</span>
                  </div>
                  {approval.reason && <p className="mb-4 text-sm text-gray-500">{approval.reason}</p>}
                  {approval.type === 'leave' ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="min-h-10 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700" onClick={() => reviewLeaveRequest(approval.id, 'approved')}>
                        Approve
                      </button>
                      <button type="button" className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={() => reviewLeaveRequest(approval.id, 'rejected')}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="min-h-10 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                      Open Queue
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon="clock" title="No pending approvals" text={data.approvals?.note || emptyHrData.approvals.note} />
          )}
        </section>
      )}

      {selectedDepartment && (
        <DepartmentPeopleModal
          department={selectedDepartment}
          onClose={() => setSelectedDepartment(null)}
        />
      )}

      {isPositionFormOpen && (
        <PositionFormModal
          form={positionForm}
          isSaving={isSavingPosition}
          onChange={updatePositionField}
          onClose={() => setPositionFormOpen(false)}
          onSubmit={handleCreatePosition}
        />
      )}
    </>
  )
}

function StatPanel({ icon, onClick, sub, title, tone, value }) {
  const toneClasses = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
    purple: 'border-purple-100 bg-purple-50 text-purple-700',
  }

  const content = (
    <>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-1 text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`rounded-lg border p-2 ${toneClasses[tone]}`}><Icon name={icon} className="h-5 w-5" /></div>
      </div>
      <p className="text-sm text-gray-500">{sub}</p>
    </>
  )

  if (!onClick) return <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">{content}</div>

  return (
    <button type="button" className="rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={onClick}>
      {content}
    </button>
  )
}

function SectionHeader({ action, onAction, subtitle, title }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <button type="button" className="text-sm font-semibold text-primary-600 hover:text-primary-800" onClick={onAction}>{action}</button>}
    </div>
  )
}

function ViewButton({ active, label, onClick }) {
  return (
    <button type="button" className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold ${active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} onClick={onClick}>
      {label}
    </button>
  )
}

function QueueButton({ icon, onClick, text, title }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-left hover:bg-gray-100" onClick={onClick}>
      <div className="rounded-lg bg-white p-2 text-primary-600"><Icon name={icon} className="h-4 w-4" /></div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </button>
  )
}

function DepartmentCard({ color, count, name, onClick }) {
  return (
    <button type="button" className="group flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 text-left transition hover:shadow-md" onClick={onClick}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition group-hover:scale-110 ${color}`}>
        {name[0]}
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">{name}</h4>
        <p className="text-xs text-gray-500">{count} employees</p>
      </div>
    </button>
  )
}

function DepartmentPeopleModal({ department, onClose }) {
  const employees = department.employees || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <section className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{department.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{department.employeeCount} employees in this department</p>
          </div>
          <button type="button" aria-label="Close department people" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {employees.length ? (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
              {employees.map((employee) => (
                <div key={employee.id} className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700">
                      {initials(employee.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{employee.name}</p>
                      <p className="truncate text-sm text-gray-500">{employee.email || 'No email recorded'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{employee.jobTitle || employee.role || 'Employee'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="users" title="No employees in this department" text="Assign employees to this department and they will appear here." />
          )}
        </div>
      </section>
    </div>
  )
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function PositionFormModal({ form, isSaving, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Add Position</h3>
          <button type="button" aria-label="Close position form" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          <Field label="Position Title" name="title" value={form.title} onChange={onChange} placeholder="Customer Support Lead" required />
          <Field label="Department" name="department" value={form.department} onChange={onChange} placeholder="Customer Support" />
          <Field label="Openings" name="openings" type="number" min="1" step="1" value={form.openings} onChange={onChange} required />
          <Field label="Status" name="status" value={form.status} onChange={onChange} placeholder="Open" />
          <Field label="Priority" name="priority" value={form.priority} onChange={onChange} placeholder="High, Urgent, Normal" />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              placeholder="Short hiring notes"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Position'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        {...props}
        className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </label>
  )
}

function EmptyState({ action, icon, onAction, text, title }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <Icon name={icon} className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{text}</p>
      {action && <button type="button" className="mt-4 min-h-10 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" onClick={onAction}>{action}</button>}
    </div>
  )
}

function LoadingBlock({ text }) {
  return <div className="rounded-lg border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">{text}</div>
}

function Notice({ children, tone }) {
  const toneClass = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-gray-100 bg-white text-gray-700'
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${toneClass}`}>{children}</div>
}
