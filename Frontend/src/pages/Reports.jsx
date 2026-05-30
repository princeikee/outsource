import Icon from '../components/Icon'

const reports = [
  ['Employee Headcount', 'PDF, XLSX', 'users', 'bg-blue-50 text-blue-600'],
  ['Financial Summary', 'PDF, CSV', 'bar-chart-3', 'bg-green-50 text-green-600'],
  ['Payroll Summary', 'PDF, XLSX', 'banknote', 'bg-purple-50 text-purple-600'],
  ['Attendance Analysis', 'PDF, CSV', 'calendar-check', 'bg-orange-50 text-orange-600'],
  ['Leave Balance', 'XLSX', 'umbrella', 'bg-pink-50 text-pink-600'],
  ['Audit Trail', 'PDF, CSV', 'shield-check', 'bg-gray-100 text-gray-600'],
]

export default function Reports() {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(([title, formats, icon, color]) => <ReportCard key={title} title={title} formats={formats} icon={icon} color={color} />)}
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Generate Custom Report</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select options={['Select Module', 'HR', 'Payroll', 'Accounting']} />
          <Select options={['Select Date Range', 'This Month', 'Last Month', 'This Year']} />
          <Select options={['Select Format', 'PDF', 'Excel (XLSX)', 'CSV']} />
          <button type="button" className="min-h-11 rounded-lg bg-primary-600 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700">Generate</button>
        </div>
      </section>
    </>
  )
}

function Select({ options }) {
  return (
    <select className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  )
}

function ReportCard({ color, formats, icon, title }) {
  return (
    <article className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <button type="button" aria-label={`Download ${title}`} className="rounded p-2 text-gray-400 opacity-100 transition hover:bg-gray-100 hover:text-primary-600 sm:opacity-0 sm:group-hover:opacity-100">
          <Icon name="download" className="h-5 w-5" />
        </button>
      </div>
      <h4 className="mb-1 font-bold text-gray-800">{title}</h4>
      <p className="mb-4 text-xs text-gray-500">Available formats: {formats}</p>
      <button type="button" className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-primary-600">
        Generate
      </button>
    </article>
  )
}
