import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { attendanceApi } from '../services/api'

export default function Attendance({ auth }) {
  const [data, setData] = useState({ records: [], summary: {}, office: {} })
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAttendance()
  }, [auth.token])

  async function loadAttendance() {
    setLoading(true)
    setError('')

    try {
      setData(await attendanceApi.daily(auth.token))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const summary = data.summary || {}
  const records = data.records || []
  const office = data.office || {}

  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Attendance Control</h3>
          <p className="mt-1 text-sm text-gray-500">Today&apos;s clock-ins based on employee location inside the office radius.</p>
        </div>
        <button type="button" onClick={loadAttendance} className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
          <Icon name="activity" className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProgressCard title="Present Today" value={isLoading ? '...' : summary.presentToday || 0} suffix={summary.activeEmployeeCount ? `/ ${summary.activeEmployeeCount}` : ''} color="emerald" width={percentage(summary.presentToday, summary.activeEmployeeCount)} />
        <ProgressCard title="Late Arrivals" value={isLoading ? '...' : summary.lateArrivals || 0} color="amber" width={percentage(summary.lateArrivals, summary.activeEmployeeCount)} />
        <ProgressCard title="Absent" value={isLoading ? '...' : summary.absentToday || 0} color="red" width={percentage(summary.absentToday, summary.activeEmployeeCount)} />
      </div>

      <section className="mb-6 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="font-bold text-gray-900">Office Location Rule</h4>
            <p className="mt-1 text-sm text-gray-500">Employees can clock in and out only when their device location is within the office premises.</p>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${office.isConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {office.isConfigured ? `${office.radiusMeters}m radius active` : 'Set office location in Settings'}
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="font-bold text-gray-800">Daily Attendance Log</h3>
          <span className="text-xs text-gray-500">{records.length} entries today</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-white font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && <TableMessage text="Loading attendance..." />}
              {!isLoading && records.length === 0 && <TableMessage text="No one has clocked in today." />}
              {!isLoading && records.map((record) => <AttendanceRow key={record.id} record={record} />)}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function ProgressCard({ color, suffix = '', title, value, width }) {
  const colorMap = {
    amber: ['text-amber-600', 'bg-amber-500'],
    emerald: ['text-emerald-600', 'bg-emerald-500'],
    red: ['text-red-600', 'bg-red-500'],
  }
  const [textColor, barColor] = colorMap[color]

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <h4 className="mb-2 text-sm font-semibold text-gray-500">{title}</h4>
      <div className={`text-3xl font-bold ${textColor}`}>
        {value} {suffix && <span className="text-base font-normal text-gray-400">{suffix}</span>}
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width }} />
      </div>
    </div>
  )
}

function AttendanceRow({ record }) {
  const name = `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim() || record.employee?.email || 'Employee'
  const isClockedIn = record.status === 'clocked_in'

  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
      <td className="px-6 py-4"><span className={`rounded px-2 py-1 text-xs font-semibold ${isClockedIn ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{isClockedIn ? 'Clocked in' : 'Clocked out'}</span></td>
      <td className="px-6 py-4 text-gray-600">{formatTime(record.clockInAt)}</td>
      <td className="px-6 py-4 text-gray-600">{formatTime(record.clockOutAt)}</td>
      <td className="px-6 py-4 text-gray-600">{formatDuration(record.clockInAt, record.clockOutAt)}</td>
      <td className="px-6 py-4 text-gray-600">{formatDistance(record.clockOutDistanceMeters ?? record.clockInDistanceMeters)}</td>
      <td className="px-6 py-4 italic text-gray-400">{record.notes || '-'}</td>
    </tr>
  )
}

function TableMessage({ text }) {
  return (
    <tr>
      <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">{text}</td>
    </tr>
  )
}

function Notice({ children, tone = 'success' }) {
  const className = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>{children}</div>
}

function percentage(value = 0, total = 0) {
  if (!total) return '0%'
  return `${Math.min(Math.round((Number(value) / Number(total)) * 100), 100)}%`
}

function formatTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDuration(start, end) {
  if (!start) return '-'
  const endDate = end ? new Date(end) : new Date()
  const minutes = Math.max(Math.round((endDate - new Date(start)) / 60000), 0)
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function formatDistance(value) {
  if (value === null || value === undefined) return '-'
  return `${value}m from office`
}
