import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { leaveApi } from '../services/api'

const statusLabels = {
  all: 'All requests',
  pending: 'Pending requests',
  approved: 'Approved requests',
  rejected: 'Rejected requests',
}

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

function LeaveRequestsAdmin({ auth }) {
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [reviewNotes, setReviewNotes] = useState({})
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadRequests() {
      setLoading(true)
      setError('')

      try {
        const payload = await leaveApi.list(auth.token, statusFilter === 'all' ? undefined : statusFilter)
        if (isMounted) setRequests(payload)
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadRequests()

    return () => {
      isMounted = false
    }
  }, [auth.token, statusFilter])

  async function reviewLeaveRequest(id, status) {
    setError('')
    setIsSaving(true)

    try {
      const note = (reviewNotes[id] || '').trim()
      await leaveApi.review(auth.token, id, { status, ...(note ? { note } : {}) })
      setReviewNotes((current) => ({ ...current, [id]: '' }))
      const payload = await leaveApi.list(auth.token, statusFilter === 'all' ? undefined : statusFilter)
      setRequests(payload)
    } catch (reviewError) {
      setError(reviewError.message)
    } finally {
      setIsSaving(false)
    }
  }

  function updateReviewNote(id, value) {
    setReviewNotes((current) => ({ ...current, [id]: value }))
  }

  const filteredRequests = requests.filter((request) => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return true
    return [request.employeeName, request.employeeEmail]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  })

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Leave Requests</h3>
            <p className="mt-1 text-sm text-gray-500">Review pending leave requests and view approval history across the company.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-[220px]">
              <label htmlFor="status-filter" className="sr-only">Select request status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                {statusTabs.map((tab) => (
                  <option key={tab.key} value={tab.key}>{tab.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[220px]">
              <label htmlFor="leave-search" className="sr-only">Search employee</label>
              <input
                id="leave-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">{statusLabels[statusFilter]}</p>
              <p className="text-xs text-gray-500">
                Showing {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'}
                {searchTerm ? ` matching "${searchTerm}"` : ''} in this view.
              </p>
              {isLoading ? 'Refreshing...' : 'Updated recently'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-white text-gray-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Leave</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Review Note</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan="7">Loading leave requests...</td>
                  </tr>
                ) : !requests.length ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan="7">No leave requests found.</td>
                  </tr>
                ) : !filteredRequests.length ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan="7">No leave requests match that search.</td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{request.employeeName}</p>
                        <p className="text-xs text-gray-500">{request.employeeEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{request.type}</p>
                        <p className="text-xs text-gray-500">Submitted {formatDate(request.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{formatDate(request.startDate)} – {formatDate(request.endDate)}</td>
                      <td className="max-w-xs px-5 py-4 text-gray-600">{request.reason || 'No reason provided'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusPill(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {request.status === 'pending' ? (
                          <textarea
                            rows="2"
                            value={reviewNotes[request.id] || ''}
                            onChange={(event) => updateReviewNote(request.id, event.target.value)}
                            placeholder="Add a comment"
                            className="w-full min-w-[180px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{request.reviewNote || 'No comment added'}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {request.status === 'pending' ? (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                              onClick={() => reviewLeaveRequest(request.id, 'approved')}
                              disabled={isSaving}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                              onClick={() => reviewLeaveRequest(request.id, 'rejected')}
                              disabled={isSaving}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Reviewed {request.reviewedAt ? formatDate(request.reviewedAt) : '—'}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function statusPill(status) {
  return status === 'approved'
    ? 'bg-green-100 text-green-700'
    : status === 'rejected'
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700'
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default LeaveRequestsAdmin
