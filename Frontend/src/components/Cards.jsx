import Icon from './Icon'

export function KpiCard({ colorClasses, icon, sub, title, trend = '+2.5%', value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-lg p-3 ${colorClasses}`}>
          <Icon name={icon} className="h-6 w-6" />
        </div>
        <span className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-400">{trend}</span>
      </div>
      <h4 className="mb-1 text-sm font-medium text-gray-500">{title}</h4>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{sub}</p>
    </div>
  )
}

export function ActivityItem({ desc, icon, time, title }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Icon name={icon} className="h-4 w-4" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <div className="whitespace-nowrap text-xs text-gray-400">{time}</div>
    </div>
  )
}

export function EventCard({ color, date, time, title }) {
  return (
    <div className="flex h-32 flex-col justify-between rounded-lg border border-gray-100 bg-white p-4 transition hover:shadow-md">
      <div className={`w-fit rounded px-2 py-1 text-xs font-bold uppercase tracking-wider ${color}`}>{date}</div>
      <div>
        <h4 className="mb-1 font-bold text-gray-800">{title}</h4>
        <p className="flex items-center gap-1 text-sm text-gray-500">
          <Icon name="clock" className="h-3 w-3" />
          {time}
        </p>
      </div>
    </div>
  )
}

export function SectionCard({ children, className = '' }) {
  return <section className={`rounded-xl border border-gray-100 bg-white shadow-sm ${className}`}>{children}</section>
}
