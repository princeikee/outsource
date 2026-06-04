import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { reportsApi, employeeApi } from '../services/api'

const reportModules = [
  { color: 'bg-blue-50 text-blue-600', formats: 'CSV, on-screen', icon: 'users', key: 'hr', title: 'Employee Headcount' },
  { color: 'bg-green-50 text-green-600', formats: 'CSV, on-screen', icon: 'bar-chart-3', key: 'accounting', title: 'Financial Summary' },
  { color: 'bg-purple-50 text-purple-600', formats: 'CSV, on-screen', icon: 'banknote', key: 'payroll', title: 'Payroll Summary' },
  { color: 'bg-orange-50 text-orange-600', formats: 'CSV, on-screen', icon: 'calendar-check', key: 'attendance', title: 'Attendance Analysis' },
  { color: 'bg-pink-50 text-pink-600', formats: 'CSV, on-screen', icon: 'umbrella', key: 'leave', title: 'Leave Requests' },
]

const ranges = [
  ['today', 'Today'],
  ['this_week', 'This Week'],
  ['this_month', 'This Month'],
  ['last_month', 'Last Month'],
  ['this_year', 'This Year'],
  ['custom', 'Custom Dates'],
]

export default function Reports({ auth }) {
  const [filters, setFilters] = useState({ from: '', module: 'hr', range: 'this_month', to: '' })
  const [employees, setEmployees] = useState([])
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    generateReport()
    loadEmployees()
  }, [])

  async function generateReport(event, override = {}) {
    event?.preventDefault()
    setLoading(true)
    setError('')

    const nextFilters = { ...filters, ...override }
    setFilters(nextFilters)

    try {
      setReport(await reportsApi.generate(auth.token, nextFilters))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadEmployees() {
    try {
      setEmployees(await employeeApi.list(auth.token))
    } catch (err) {
      // ignore
    }
  }

  const activeModule = useMemo(() => reportModules.find((item) => item.key === filters.module), [filters.module])
  const hasRows = Boolean(report?.rows?.length)

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportModules.map((item) => (
          <ReportCard key={item.key} active={filters.module === item.key} report={item} onGenerate={() => generateReport(null, { module: item.key })} />
        ))}
      </div>

      <section className="mb-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Generate Report</h3>
            <p className="mt-1 text-sm text-gray-500">Reports are generated from records saved inside your company workspace only.</p>
          </div>
          {hasRows && (
            <button type="button" onClick={() => downloadCsv(report)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
              <Icon name="download" className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-5" onSubmit={generateReport}>
          <Select label="Module" value={filters.module} onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value }))}>
            {reportModules.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
          </Select>
          <Select label="Date Range" value={filters.range} onChange={(event) => setFilters((current) => ({ ...current, range: event.target.value }))}>
            {ranges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Field label="From" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} disabled={filters.range !== 'custom'} />
          <Field label="To" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} disabled={filters.range !== 'custom'} />
          <button type="submit" disabled={isLoading} className="mt-auto min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </section>

      {error && <Notice tone="error">{error}</Notice>}

      <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-bold text-gray-900">{report?.title || activeModule?.title || 'Report Results'}</h3>
            <p className="mt-1 text-xs font-medium text-gray-500">{report?.period?.label || 'Select a module and period to generate a report.'}</p>
          </div>
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600 ring-1 ring-gray-200">{report?.rows?.length || 0} records</span>
        </div>

        {report && (
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-6 md:grid-cols-2 xl:grid-cols-4">
            {report.summary?.map((item) => <Metric key={item.label} item={item} />)}
          </div>
        )}

        {!report && <EmptyState title="No report generated yet" text="Choose a module and date range, then generate a report." />}
        {report && !hasRows && <EmptyState title="No data for this period" text={`There is no ${report.title.toLowerCase()} information for ${report.period.label}. Try another date range.`} />}
        {hasRows && <ReportTable rows={report.rows} />}

        {report?.secondaryRows?.length > 0 && (
          <div className="border-t border-gray-100 p-6">
            <h4 className="mb-3 text-sm font-bold text-gray-900">Department Breakdown</h4>
            <ReportTable compact rows={report.secondaryRows} />
          </div>
        )}
      </section>
    </>
  )
}

function ReportCard({ active, onGenerate, report }) {
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md ${active ? 'border-primary-200 ring-2 ring-primary-50' : 'border-gray-100'}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-lg p-3 ${report.color}`}>
          <Icon name={report.icon} className="h-5 w-5" />
        </div>
        <button type="button" aria-label={`Generate ${report.title}`} onClick={onGenerate} className="rounded p-2 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600">
          <Icon name="download" className="h-5 w-5" />
        </button>
      </div>
      <h4 className="mb-1 font-bold text-gray-800">{report.title}</h4>
      <p className="mb-4 text-xs text-gray-500">Output: {report.formats}</p>
      <button type="button" onClick={onGenerate} className="w-full rounded-lg border border-gray-200 py-2 text-sm font-bold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
        Generate
      </button>
    </article>
  )
}

function Select({ children, label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</span>
      <select {...props} className="min-h-11 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
        {children}
      </select>
    </label>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</span>
      <input {...props} className="min-h-11 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-primary-500" />
    </label>
  )
}

function Metric({ item }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase text-gray-500">{item.label}</p>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">{item.money ? formatMoney(item.value) : item.value}</p>
    </div>
  )
}

function ReportTable({ compact = false, rows }) {
  const columns = Object.keys(rows[0] || {})

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${compact ? 'min-w-[360px]' : 'min-w-[900px]'}`}>
        <thead className="bg-white font-medium text-gray-500">
          <tr>
            {columns.map((column) => <th key={column} className="px-6 py-3">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => <td key={column} className="px-6 py-4 text-gray-600">{formatCell(row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ text, title }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon name="bar-chart-3" className="h-6 w-6" />
      </div>
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{text}</p>
    </div>
  )
}

function Notice({ children, tone = 'success' }) {
  const className = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'
  return <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>{children}</div>
}

function downloadCsv(report) {
  const columns = Object.keys(report.rows[0] || {})
  const csv = [
    columns.join(','),
    ...report.rows.map((row) => columns.map((column) => csvCell(formatCell(row[column]))).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.module}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function formatCell(value) {
  if (!value) return '-'
  if (typeof value === 'number') return Number.isInteger(value) ? value : formatMoney(value)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value)
  return value
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-NG', { currency: 'NGN', style: 'currency' }).format(Number(value || 0))
}
