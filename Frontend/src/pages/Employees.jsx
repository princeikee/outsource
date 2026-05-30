import { useEffect, useMemo, useState } from 'react'
import { PrimaryButton } from '../components/Controls'
import Icon from '../components/Icon'
import { employeeApi } from '../services/api'

const emptyForm = {
  name: '',
  email: '',
  role: 'Employee',
  department: '',
  jobTitle: '',
  phone: '',
  salary: '',
  password: '',
  createUser: true,
}

export default function Employees({ auth }) {
  const [employees, setEmployees] = useState([])
  const [error, setError] = useState('')
  const [formMode, setFormMode] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [employeeToRemove, setEmployeeToRemove] = useState(null)
  const [passwordResetEmployee, setPasswordResetEmployee] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [oneTimeLogin, setOneTimeLogin] = useState(null)
  const isAdmin = auth?.user?.role === 'COMPANY_ADMIN'

  useEffect(() => {
    let isMounted = true

    async function loadEmployees() {
      setLoading(true)
      setError('')

      try {
        const data = await employeeApi.list(auth.token)
        if (isMounted) setEmployees(data)
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadEmployees()

    return () => {
      isMounted = false
    }
  }, [auth.token])

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return employees

    return employees.filter((employee) => {
      const values = [employee.firstName, employee.lastName, employee.email, employee.role, employee.department, employee.jobTitle]
      return values.some((value) => value?.toLowerCase().includes(normalizedQuery))
    })
  }, [employees, query])

  function updateField(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function openCreateForm() {
    setForm(emptyForm)
    setSelectedEmployee(null)
    setFormMode('create')
  }

  function openEditForm(employee) {
    setSelectedEmployee(employee)
    setForm({
      ...emptyForm,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      email: employee.email || '',
      role: employee.role || '',
      department: employee.department || '',
      jobTitle: employee.jobTitle || '',
      phone: employee.phone || '',
      salary: '',
      createUser: Boolean(employee.user),
    })
    setFormMode('edit')
  }

  async function openDetails(employee) {
    setError('')
    try {
      const details = await employeeApi.get(auth.token, employee.id)
      setSelectedEmployee(details)
    } catch (detailsError) {
      setError(detailsError.message)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setOneTimeLogin(null)

    try {
      if (formMode === 'create') {
        const result = await employeeApi.create(auth.token, {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role.trim() || undefined,
          department: form.department.trim() || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          salary: form.salary ? Number(form.salary) : undefined,
          createUser: form.createUser,
          password: form.password || undefined,
          userRole: 'EMPLOYEE',
        })

        setEmployees((current) => [result.employee, ...current])
        setOneTimeLogin(result.login ? { ...result.login, title: 'Employee login created' } : null)
      } else {
        const names = splitName(form.name)
        const employee = await employeeApi.update(auth.token, selectedEmployee.id, {
          firstName: names.firstName,
          lastName: names.lastName,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role.trim() || undefined,
          department: form.department.trim() || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          salary: form.salary ? Number(form.salary) : undefined,
        })

        setEmployees((current) => current.map((item) => (item.id === employee.id ? employee : item)))
      }

      closeForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(employee) {
    setError('')

    try {
      await employeeApi.remove(auth.token, employee.id)
      setEmployees((current) => current.filter((item) => item.id !== employee.id))
      if (selectedEmployee?.id === employee.id) setSelectedEmployee(null)
      setEmployeeToRemove(null)
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  async function handleToggleLogin(employee) {
    setError('')
    setOneTimeLogin(null)

    try {
      const updatedEmployee = await employeeApi.setLoginEnabled(auth.token, employee.id, !employee.user?.loginEnabled)
      setEmployees((current) => current.map((item) => (item.id === updatedEmployee.id ? updatedEmployee : item)))
      if (selectedEmployee?.id === updatedEmployee.id) setSelectedEmployee(updatedEmployee)
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    setOneTimeLogin(null)

    try {
      const result = await employeeApi.resetPassword(auth.token, passwordResetEmployee.id, newPassword)
      setEmployees((current) => current.map((item) => (item.id === result.employee.id ? result.employee : item)))
      setOneTimeLogin({ ...result.login, title: 'Password reset successful' })
      setPasswordResetEmployee(null)
      setNewPassword('')
    } catch (resetError) {
      setError(resetError.message)
    }
  }

  function closeForm() {
    setFormMode(null)
    setForm(emptyForm)
  }

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees..."
            className="min-h-11 w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <PrimaryButton icon="user-plus" onClick={openCreateForm}>Add Employee</PrimaryButton>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {oneTimeLogin && <PasswordNotice login={oneTimeLogin} onDismiss={() => setOneTimeLogin(null)} />}

      {isLoading ? (
        <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading employees...</div>
      ) : filteredEmployees.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              isAdmin={isAdmin}
              onDetails={openDetails}
              onEdit={openEditForm}
              onRemove={setEmployeeToRemove}
              onResetPassword={setPasswordResetEmployee}
              onToggleLogin={handleToggleLogin}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
          <Icon name="users" className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <h3 className="font-semibold text-gray-800">No employees yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create the first employee record for this company.</p>
        </div>
      )}

      {formMode && (
        <EmployeeForm
          form={form}
          mode={formMode}
          isSaving={isSaving}
          onChange={updateField}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {selectedEmployee && !formMode && (
        <DetailsModal
          employee={selectedEmployee}
          isAdmin={isAdmin}
          onClose={() => setSelectedEmployee(null)}
          onEdit={openEditForm}
          onResetPassword={setPasswordResetEmployee}
          onToggleLogin={handleToggleLogin}
        />
      )}

      {employeeToRemove && (
        <ConfirmRemoveModal
          employee={employeeToRemove}
          onCancel={() => setEmployeeToRemove(null)}
          onConfirm={() => handleRemove(employeeToRemove)}
        />
      )}

      {passwordResetEmployee && (
        <ResetPasswordModal
          employee={passwordResetEmployee}
          password={newPassword}
          onChange={setNewPassword}
          onClose={() => {
            setPasswordResetEmployee(null)
            setNewPassword('')
          }}
          onSubmit={handleResetPassword}
        />
      )}
    </>
  )
}

function EmployeeCard({ employee, isAdmin, onDetails, onEdit, onRemove, onResetPassword, onToggleLogin }) {
  const name = getEmployeeName(employee)
  const latestSalary = employee.salaryAssignments?.[0]
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <article className="group rounded-lg border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-primary-600 transition group-hover:scale-105">{initials}</div>
      <h4 className="text-lg font-bold text-gray-800">{name}</h4>
      <p className="mb-1 text-sm text-gray-500">{employee.role || 'Employee'}</p>
      <p className="text-xs text-gray-400">{employee.department || 'No department'}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 text-left text-xs">
        <EmployeeMeta label="Salary" value={latestSalary ? money(latestSalary.amount) : 'Not set'} />
        <EmployeeMeta label="Login" value={employee.user ? (employee.user.loginEnabled ? 'Enabled' : 'Disabled') : 'Not created'} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton icon="more-horizontal" label="Details" onClick={() => onDetails(employee)} />
        <ActionButton icon="edit-3" label="Edit" onClick={() => onEdit(employee)} />
        {isAdmin && employee.user && <ActionButton icon="settings" label={employee.user.loginEnabled ? 'Disable Login' : 'Enable Login'} onClick={() => onToggleLogin(employee)} />}
        {isAdmin && employee.user && <ActionButton icon="shield-check" label="Reset Password" onClick={() => onResetPassword(employee)} />}
        {isAdmin && <ActionButton icon="trash-2" label="Remove" tone="danger" onClick={() => onRemove(employee)} />}
      </div>
    </article>
  )
}

function EmployeeForm({ form, isSaving, mode, onChange, onClose, onSubmit }) {
  const isCreate = mode === 'create'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/45 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">{isCreate ? 'Add Employee' : 'Edit Employee'}</h3>
          <button type="button" aria-label="Close form" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          <Field label="Name" name="name" value={form.name} onChange={onChange} placeholder="Jane Smith" required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="jane@company.com" required={isCreate && form.createUser} />
          <Field label="Role" name="role" value={form.role} onChange={onChange} placeholder="Employee" required />
          <Field label="Department" name="department" value={form.department} onChange={onChange} placeholder="Operations" />
          <Field label="Job Title" name="jobTitle" value={form.jobTitle} onChange={onChange} placeholder="Support Associate" />
          <Field label="Phone" name="phone" value={form.phone} onChange={onChange} placeholder="+234..." />
          <Field label="Salary" name="salary" type="number" value={form.salary} onChange={onChange} placeholder={isCreate ? '250000' : 'Leave blank to keep current'} min="0" step="0.01" />
          {isCreate && <Field label="Password" name="password" type="text" value={form.password} onChange={onChange} placeholder="Leave blank to generate" />}

          {isCreate && (
            <label className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <input type="checkbox" name="createUser" checked={form.createUser} onChange={onChange} className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span>
                <span className="block text-sm font-semibold text-gray-800">Create linked login account</span>
                <span className="mt-1 block text-sm text-gray-500">The employee can sign in to attendance, payslips, and profile using this email.</span>
              </span>
            </label>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onClose}>
            Cancel
          </button>
          <PrimaryButton type="submit" icon={isCreate ? 'user-plus' : 'edit-3'} disabled={isSaving}>
            {isSaving ? 'Saving...' : isCreate ? 'Create Employee' : 'Save Changes'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function DetailsModal({ employee, isAdmin, onClose, onEdit, onResetPassword, onToggleLogin }) {
  const latestSalary = employee.salaryAssignments?.[0]
  const details = [
    ['Name', getEmployeeName(employee)],
    ['Email', employee.email || 'Not set'],
    ['Phone', employee.phone || 'Not set'],
    ['Role', employee.role || 'Employee'],
    ['Department', employee.department || 'Not set'],
    ['Job Title', employee.jobTitle || 'Not set'],
    ['Salary', latestSalary ? money(latestSalary.amount) : 'Not set'],
    ['Login', employee.user ? (employee.user.loginEnabled ? 'Enabled' : 'Disabled') : 'Not created'],
  ]

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/45 p-4">
      <section className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">Employee Details</h3>
          <button type="button" aria-label="Close details" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 break-words font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={() => onEdit(employee)}>
            Edit
          </button>
          {isAdmin && employee.user && (
            <>
              <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={() => onToggleLogin(employee)}>
                {employee.user.loginEnabled ? 'Disable Login' : 'Enable Login'}
              </button>
              <button type="button" className="min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" onClick={() => onResetPassword(employee)}>
                Reset Password
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function PasswordNotice({ login, onDismiss }) {
  return (
    <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold">{login.title}</p>
          <p className="mt-1">Email: {login.email} | Password: {login.password}</p>
          <p className="mt-2 font-semibold">Warning: this password can only be viewed once. Share it securely before closing this message.</p>
        </div>
        <button type="button" className="w-fit rounded-md px-2 py-1 font-semibold text-amber-800 hover:bg-amber-100" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </section>
  )
}

function ConfirmRemoveModal({ employee, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <section className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">Remove Employee</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">Are you sure you want to remove this employee?</p>
          <p className="mt-2 font-semibold text-gray-900">{getEmployeeName(employee)}</p>
          <p className="mt-3 text-sm text-red-600">This action cannot be undone.</p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={onConfirm}>
            Remove Employee
          </button>
        </div>
      </section>
    </div>
  )
}

function ResetPasswordModal({ employee, onChange, onClose, onSubmit, password }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
          <button type="button" aria-label="Close reset password" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="mb-4 text-sm text-gray-600">Enter a new password for {getEmployeeName(employee)}.</p>
          <Field
            label="New Password"
            name="newPassword"
            type="text"
            value={password}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Warning: this password can only be viewed once after reset. Share it securely before closing the message.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onClose}>
            Cancel
          </button>
          <PrimaryButton type="submit" icon="shield-check">
            Reset Password
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function Notice({ children, tone }) {
  const toneClass = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-gray-100 bg-white text-gray-700'
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${toneClass}`}>{children}</div>
}

function ActionButton({ icon, label, onClick, tone = 'default' }) {
  const toneClass = tone === 'danger' ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-primary-600'
  return (
    <button type="button" className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-semibold transition ${toneClass}`} onClick={onClick}>
      <Icon name={icon} className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function EmployeeMeta({ label, value }) {
  return (
    <div className="min-w-0 rounded-md bg-gray-50 p-2">
      <p className="font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate font-medium text-gray-700">{value}</p>
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

function getEmployeeName(employee) {
  return `${employee.firstName} ${employee.lastName}`.trim()
}

function splitName(name) {
  const parts = name.trim().split(/\s+/)
  const firstName = parts.shift() || ''
  return {
    firstName,
    lastName: parts.join(' ') || firstName,
  }
}

function money(value) {
  return new Intl.NumberFormat('en-NG', {
    currency: 'NGN',
    style: 'currency',
  }).format(Number(value || 0))
}
