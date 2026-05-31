import { useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import { attendanceApi } from '../../services/api'

export default function EmployeeAttendance({ auth }) {
  const employeeId = auth?.user?.employeeId
  const [history, setHistory] = useState([])
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [isLocating, setLocating] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [auth.token, employeeId])

  async function loadHistory() {
    if (!employeeId) {
      setError('Your user account is not linked to an employee profile.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      setHistory(await attendanceApi.history(auth.token, employeeId))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function captureLocation() {
    setError('')
    setNotice('')

    if (!navigator.geolocation) {
      setError('Location is not supported by this browser.')
      return null
    }

    setLocating(true)

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 })
      })
      const nextLocation = {
        accuracy: Math.round(position.coords.accuracy),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      setLocation(nextLocation)
      return nextLocation
    } catch (locationError) {
      setError(locationError.code === 1 ? 'Please allow location access to clock in or out.' : 'Could not get your location. Try again near the office.')
      return null
    } finally {
      setLocating(false)
    }
  }

  async function submitAttendance(action) {
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const currentLocation = location || await captureLocation()
      if (!currentLocation) return

      const body = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }

      if (action === 'in') {
        await attendanceApi.clockIn(auth.token, body)
        setNotice('Clock in recorded.')
      } else {
        await attendanceApi.clockOut(auth.token, body)
        setNotice('Clock out recorded.')
      }

      await loadHistory()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const todayRecord = useMemo(() => {
    const today = new Date().toDateString()
    return history.find((record) => new Date(record.workDate).toDateString() === today)
  }, [history])

  return (
    <>
      <section className="mb-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Today&apos;s Attendance</h3>
            <p className="mt-1 text-sm text-gray-500">Clock in and out from the office premises using your device location.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill label={todayRecord?.clockInAt ? `Clocked in ${formatTime(todayRecord.clockInAt)}` : 'Not clocked in'} tone={todayRecord?.clockInAt ? 'success' : 'neutral'} />
              <StatusPill label={todayRecord?.clockOutAt ? `Clocked out ${formatTime(todayRecord.clockOutAt)}` : 'Clock out pending'} tone={todayRecord?.clockOutAt ? 'success' : 'warning'} />
              {location && <StatusPill label={`GPS accuracy ${location.accuracy}m`} tone="neutral" />}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={captureLocation} disabled={isLocating || isSubmitting} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Icon name="activity" className="h-4 w-4" />
              {isLocating ? 'Checking...' : 'Check Location'}
            </button>
            <button type="button" onClick={() => submitAttendance('in')} disabled={isLocating || isSubmitting || todayRecord?.clockInAt && !todayRecord?.clockOutAt} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Icon name="clock" className="h-4 w-4" />
              Clock In
            </button>
            <button type="button" onClick={() => submitAttendance('out')} disabled={isLocating || isSubmitting || !todayRecord?.clockInAt || todayRecord?.clockOutAt} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Icon name="check-circle" className="h-4 w-4" />
              Clock Out
            </button>
          </div>
        </div>
      </section>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}

      <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="font-bold text-gray-800">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && <TableMessage text="Loading attendance history..." />}
              {!isLoading && history.length === 0 && <TableMessage text="No attendance records yet." />}
              {!isLoading && history.map((record) => <HistoryRow key={record.id} record={record} />)}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function HistoryRow({ record }) {
  const isComplete = Boolean(record.clockOutAt)

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-gray-600">{formatDate(record.workDate)}</td>
      <td className="px-6 py-4 text-gray-600">{formatTime(record.clockInAt)}</td>
      <td className="px-6 py-4 text-gray-600">{formatTime(record.clockOutAt)}</td>
      <td className="px-6 py-4 text-gray-600">{formatDuration(record.clockInAt, record.clockOutAt)}</td>
      <td className="px-6 py-4 text-gray-600">{formatDistance(record.clockOutDistanceMeters ?? record.clockInDistanceMeters)}</td>
      <td className={`px-6 py-4 font-semibold ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>{isComplete ? 'Completed' : 'Clocked in'}</td>
    </tr>
  )
}

function StatusPill({ label, tone }) {
  const tones = {
    neutral: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  }

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{label}</span>
}

function TableMessage({ text }) {
  return (
    <tr>
      <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">{text}</td>
    </tr>
  )
}

function Notice({ children, tone = 'success' }) {
  const className = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>{children}</div>
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function formatTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDuration(start, end) {
  if (!start || !end) return '-'
  const minutes = Math.max(Math.round((new Date(end) - new Date(start)) / 60000), 0)
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function formatDistance(value) {
  if (value === null || value === undefined) return '-'
  return `${value}m from office`
}
