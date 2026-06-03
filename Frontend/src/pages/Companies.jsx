import { useEffect, useMemo, useState } from 'react'
import { SearchField } from '../components/Controls'
import { companyApi } from '../services/api'

export default function Companies({ auth }) {
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [suspendCompany, setSuspendCompany] = useState(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [deleteCompany, setDeleteCompany] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    loadCompanies()
  }, [auth.token])

  async function loadCompanies() {
    setLoading(true)
    setError('')

    try {
      setCompanies(await companyApi.list(auth.token))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanies = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return companies
    return companies.filter((company) => [company.name, company.email, company.status].some((field) => field?.toLowerCase().includes(value)))
  }, [companies, query])

  async function viewCompany(company) {
    setError('')
    try {
      setSelectedCompany(await companyApi.get(auth.token, company.id))
    } catch (viewError) {
      setError(viewError.message)
    }
  }

  async function submitSuspension(event) {
    event.preventDefault()
    setError('')

    try {
      const updated = await companyApi.suspend(auth.token, suspendCompany.id, suspensionReason)
      updateCompany(updated)
      setError(`${updated.name} has been suspended. Use Reactivate to undo this action.`)
      setSuspendCompany(null)
      setSuspensionReason('')
    } catch (suspendError) {
      setError(suspendError.message)
    }
  }

  async function reactivate(company) {
    setError('')
    try {
      const updated = await companyApi.reactivate(auth.token, company.id)
      updateCompany(updated)
      setError(`${updated.name} has been reactivated.`)
    } catch (reactivateError) {
      setError(reactivateError.message)
    }
  }

  async function disableAdmins(company) {
    if (!window.confirm(`Disable company admin accounts for ${company.name}?`)) return
    setError('')
    try {
      const result = await companyApi.disableAdmins(auth.token, company.id)
      setError(`${result.disabledAdmins} company admin account(s) disabled.`)
      await loadCompanies()
    } catch (disableError) {
      setError(disableError.message)
    }
  }

  async function enableAdmins(company) {
    if (!window.confirm(`Enable company admin accounts for ${company.name}?`)) return
    setError('')
    try {
      const result = await companyApi.enableAdmins(auth.token, company.id)
      setError(`${result.enabledAdmins} company admin account(s) enabled.`)
      await loadCompanies()
    } catch (enableError) {
      setError(enableError.message)
    }
  }

  async function submitSoftDelete(event) {
    event.preventDefault()
    setError('')
    try {
      const updated = await companyApi.softDelete(auth.token, deleteCompany.id, deleteReason)
      updateCompany(updated)
      setError(`${updated.name} has been deactivated. Use Reactivate to restore access.`)
      setDeleteCompany(null)
      setDeleteReason('')
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  function updateCompany(updated) {
    setCompanies((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
    if (selectedCompany?.id === updated.id) setSelectedCompany({ ...selectedCompany, ...updated })
  }

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tenant Management</h3>
          <p className="mt-1 text-sm text-gray-500">Manage platform access without changing internal company HR, payroll, or accounting records.</p>
        </div>
        <div className="w-full lg:max-w-sm" onChange={(event) => setQuery(event.target.value)}>
          <SearchField placeholder="Search companies..." />
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 font-medium text-gray-500">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Employees</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Moderation</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="7">Loading companies...</td></tr>
              ) : filteredCompanies.length ? (
                filteredCompanies.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    onDisableAdmins={disableAdmins}
                    onEnableAdmins={enableAdmins}
                    onReactivate={reactivate}
                    onSoftDelete={setDeleteCompany}
                    onSuspend={setSuspendCompany}
                    onView={viewCompany}
                  />
                ))
              ) : (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="7">No companies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {suspendCompany && (
        <SuspendModal
          company={suspendCompany}
          reason={suspensionReason}
          onCancel={() => {
            setSuspendCompany(null)
            setSuspensionReason('')
          }}
          onChange={setSuspensionReason}
          onSubmit={submitSuspension}
        />
      )}

      {deleteCompany && (
        <DeleteModal
          company={deleteCompany}
          reason={deleteReason}
          onCancel={() => {
            setDeleteCompany(null)
            setDeleteReason('')
          }}
          onChange={setDeleteReason}
          onSubmit={submitSoftDelete}
        />
      )}

      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onReactivate={reactivate}
        />
      )}
    </>
  )
}

function CompanyRow({ company, onDisableAdmins, onEnableAdmins, onReactivate, onSoftDelete, onSuspend, onView }) {
  const status = company.status || (company.isActive ? 'ACTIVE' : 'SUSPENDED')
  const adminsDisabled = Number(company.adminCount || 0) > 0 && Number(company.activeAdminCount || 0) === 0
  const statusClass = {
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    DEACTIVATED: 'bg-gray-100 text-gray-600',
  }[status] || 'bg-gray-100 text-gray-600'

  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900">{company.name}</div>
        <div className="text-xs text-gray-500">ID: {company.id.slice(0, 8)}</div>
      </td>
      <td className="px-6 py-4 text-gray-600">{company.email || 'Not set'}</td>
      <td className="px-6 py-4 text-gray-600">{company.employeeCount} employees</td>
      <td className="px-6 py-4 text-gray-600">
        <div className="font-medium text-gray-800">{formatDateTime(company.createdAt)}</div>
      </td>
      <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>{status}</span></td>
      <td className="px-6 py-4 text-gray-600">
        {status === 'SUSPENDED' ? (
          <div>
            <div className="font-medium text-gray-800">Suspended</div>
            <div className="max-w-56 truncate text-xs text-gray-500">{company.suspensionReason || 'No reason recorded'}</div>
          </div>
        ) : company.deletedAt ? 'Soft deleted' : 'No active moderation'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <ActionButton label="View" tone="primary" onClick={() => onView(company)} />
          {status === 'SUSPENDED' || status === 'DEACTIVATED' ? (
            <ActionButton label="Reactivate" tone="primary" onClick={() => onReactivate(company)} />
          ) : (
            <ActionButton label="Suspend Access" tone="warning" onClick={() => onSuspend(company)} />
          )}
          {adminsDisabled ? (
            <ActionButton label="Enable Admin" tone="primary" onClick={() => onEnableAdmins(company)} />
          ) : (
            <ActionButton label="Disable Admin" onClick={() => onDisableAdmins(company)} />
          )}
          <ActionButton label="Soft Delete" tone="danger" onClick={() => onSoftDelete(company)} />
        </div>
      </td>
    </tr>
  )
}

function ActionButton({ label, onClick, tone = 'default' }) {
  const styles = {
    default: 'border-gray-200 bg-white text-gray-700 shadow-sm hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700',
    primary: 'border-primary-600 bg-primary-600 text-white shadow-sm hover:border-primary-700 hover:bg-primary-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm hover:border-amber-300 hover:bg-amber-100',
    danger: 'border-red-200 bg-red-50 text-red-700 shadow-sm hover:border-red-300 hover:bg-red-100',
  }
  const className = `inline-flex min-h-9 items-center rounded-lg border px-3 py-2 text-xs font-bold transition ${styles[tone] || styles.default}`
  return <button type="button" className={className} onClick={onClick}>{label}</button>
}

function SuspendModal({ company, onCancel, onChange, onSubmit, reason }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Suspend Company Access</h3>
          <p className="mt-1 text-sm text-gray-500">{company.name}</p>
        </div>
        <div className="p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Suspension reason</span>
            <textarea
              required
              minLength={5}
              rows={4}
              value={reason}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Explain why this company access is being suspended."
            />
          </label>
          <p className="mt-3 text-sm text-gray-500">Users under this company will be blocked from login. Data and history will be preserved.</p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onCancel}>Cancel</button>
          <button type="submit" className="min-h-11 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Suspend Access</button>
        </div>
      </form>
    </div>
  )
}

function DeleteModal({ company, onCancel, onChange, onSubmit, reason }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Soft Delete Company</h3>
          <p className="mt-1 text-sm text-gray-500">{company.name}</p>
        </div>
        <div className="p-6">
          <p className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
            This action cannot be undone by the company. Their access will be deactivated and data will be preserved for platform records.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Reason to notify the company</span>
            <textarea
              required
              minLength={5}
              rows={4}
              value={reason}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Explain why this company account is being deactivated."
            />
          </label>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onCancel}>Cancel</button>
          <button type="submit" className="min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Soft Delete Company</button>
        </div>
      </form>
    </div>
  )
}

function CompanyDetails({ company, onClose, onReactivate }) {
  const canReactivate = company.status === 'SUSPENDED' || company.status === 'DEACTIVATED' || company.deletedAt
  const rows = [
    ['Company', company.name],
    ['Email', company.email || 'Not set'],
    ['Status', company.status],
    ['Account Created', formatDateTime(company.createdAt)],
    ['Employees', company.employeeCount],
    ['Users', company.userCount ?? 'Not loaded'],
    ['Company Admins', `${company.activeAdminCount ?? 0} active of ${company.adminCount ?? 0}`],
    ['Suspension Reason', company.suspensionReason || 'None'],
    ['Suspended At', company.suspendedAt ? new Date(company.suspendedAt).toLocaleString() : 'Not suspended'],
    ['Soft Deleted At', company.deletedAt ? new Date(company.deletedAt).toLocaleString() : 'Not deleted'],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4">
      <section className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Company Details</h3>
          <button type="button" className="rounded px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100" onClick={onClose}>Close</button>
        </div>
        {canReactivate && (
          <div className="border-b border-green-100 bg-green-50 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-green-900">Access can be restored</p>
                <p className="mt-1 text-sm text-green-700">Click Reactivate to unsuspend this company and clear moderation restrictions.</p>
              </div>
              <button
                type="button"
                className="min-h-10 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700"
                onClick={() => onReactivate(company)}
              >
                Reactivate Company
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
              <p className="mt-1 break-words font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return 'Not recorded'

  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
