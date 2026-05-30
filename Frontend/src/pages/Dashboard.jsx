import { useEffect, useMemo, useState } from 'react'
import { ActivityItem, EventCard, KpiCard, SectionCard } from '../components/Cards'
import { dashboardApi } from '../services/api'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Dashboard({ auth }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const result = await dashboardApi.overview(auth.token)
        if (isMounted) setData(result)
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [auth.token])

  const chart = useMemo(() => {
    const values = data?.chart?.map((item) => Number(item.net)) || []
    const max = Math.max(...values.map((value) => Math.abs(value)), 1)
    return months.map((month, index) => ({
      height: Math.max(6, Math.round((Math.abs(values[index] || 0) / max) * 100)),
      month,
      value: values[index] || 0,
    }))
  }, [data])

  if (error) {
    return <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
  }

  if (isLoading || !data) {
    return <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading overview...</div>
  }

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Employees" value={data.kpis.employees} sub="Your company workforce" icon="users" colorClasses="bg-primary-50 text-primary-600" trend="Live" />
        <KpiCard title="Net Balance" value={money(data.kpis.revenue)} sub="Recorded income minus expenses" icon="dollar-sign" colorClasses="bg-emerald-50 text-emerald-600" trend="YTD" />
        <KpiCard title="Pending Payroll" value={data.kpis.pendingPayroll} sub={`${money(data.kpis.payrollNet)} current net payroll`} icon="banknote" colorClasses="bg-amber-50 text-amber-600" trend="Open" />
        <KpiCard title="Attendance Today" value={data.kpis.attendanceToday} sub="Clock-ins recorded today" icon="activity" colorClasses="bg-indigo-50 text-indigo-600" trend="Today" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <SectionCard className="p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Accounting Overview</h3>
            <span className="rounded-md bg-gray-50 px-2 py-1 text-sm font-medium text-gray-500">This Year</span>
          </div>
          <div className="flex h-64 items-end justify-between gap-2 px-2">
            {chart.map((bar) => (
              <div key={bar.month} className="group relative flex h-full w-full items-end rounded-t-md bg-primary-100">
                <div className={`w-full rounded-t-md transition-all ${bar.value < 0 ? 'bg-red-400 hover:bg-red-500' : 'bg-primary-500 hover:bg-primary-600'}`} style={{ height: `${bar.height}%` }} />
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {money(bar.value)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-2 text-xs font-medium text-gray-400">
            {months.map((month) => <span key={month}>{month}</span>)}
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <h3 className="mb-6 text-lg font-bold text-gray-800">Recent Activity</h3>
          <div className="space-y-6">
            {data.activities.length ? (
              data.activities.map((activity) => (
                <ActivityItem
                  key={`${activity.title}-${activity.time}`}
                  title={activity.title}
                  desc={activity.desc}
                  time={relativeTime(activity.time)}
                  icon={activity.icon}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="overflow-hidden">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800">Operational Events</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
          {data.events.map((event) => <EventCard key={`${event.title}-${event.date}`} title={event.title} time={event.time} date={event.date} color={event.color} />)}
        </div>
      </SectionCard>
    </>
  )
}

function money(value) {
  return new Intl.NumberFormat('en-NG', {
    currency: 'NGN',
    style: 'currency',
  }).format(Number(value || 0))
}

function relativeTime(value) {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.round(hours / 24)} days ago`
}
