import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { leaveApi } from '../../services/api'

const emptyForm = {
  type: 'Annual',
  startDate: '',
  endDate: '',
  reason: '',
}

export default function LeaveRequests({ auth }) {
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [auth.token])

  async function loadRequests() {
    setLoading(true)
    setError('')

    try {
      setRequests(await leaveApi.mine(auth.token))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submitRequest(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await leaveApi.create(auth.token, {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim() || undefined,
      })
      setForm(emptyForm)
      await loadRequests()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-1">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800">Request Leave</h3>
          <p className="mt-1 text-sm text-gray-500">Submit time off for HR review.</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <form className="space-y-4" onSubmit={submitRequest}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Leave Type</span>
            <select name="type" value={form.type} onChange={updateField} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Annual</option>
              <option>Sick</option>
              <option>Emergency</option>
              <option>Unpaid</option>
              <option>Other</option>
            </select>
          </label>
          <Field label="Start Date" name="startDate" type="date" value={form.startDate} onChange={updateField} required />
          <Field label="End Date" name="endDate" type="date" value={form.endDate} onChange={updateField} required />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Reason</span>
            <textarea name="reason" value={form.reason} onChange={updateField} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Short reason for your leave request" />
          </label>
          <button type="submit" disabled={isSaving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-70">
            <Icon name="umbrella" className="h-4 w-4" />
            {isSaving ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm xl:col-span-2">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="font-bold text-gray-800">My Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Review Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="5">Loading leave requests...</td></tr>
              ) : requests.length ? (
                requests.map((request) => <LeaveRow key={request.id} request={request} />)
              ) : (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="5">No leave requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function LeaveRow({ request }) {
  const statusClass = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[request.status] || 'bg-gray-100 text-gray-600'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{request.type}</td>
      <td className="px-6 py-4 text-gray-600">{formatDate(request.startDate)} - {formatDate(request.endDate)}</td>
      <td className="max-w-64 truncate px-6 py-4 text-gray-600">{request.reason || 'No reason added'}</td>
      <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusClass}`}>{request.status}</span></td>
      <td className="max-w-64 truncate px-6 py-4 text-gray-600">{request.reviewNote || 'Not reviewed yet'}</td>
    </tr>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </label>
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}
