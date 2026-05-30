import Icon from '../components/Icon'

const attendance = [
  ['Sarah Jenkins', 'Present', '08:45 AM', '05:15 PM', '8h 30m', '-'],
  ['Mike Ross', 'Present', '09:10 AM', '05:45 PM', '8h 35m', 'Late'],
  ['Louis Litt', 'Present', '08:30 AM', '05:00 PM', '8h 30m', '-'],
  ['Harvey Specter', 'Absent', '-', '-', '-', 'Sick Leave'],
  ['Donna Paulsen', 'Present', '08:50 AM', '-', 'In Office', '-'],
  ['Alex Williams', 'Present', '08:40 AM', '05:20 PM', '8h 40m', '-'],
]

export default function Attendance() {
  return (
    <>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {['Today', 'Week', 'Month'].map((item, index) => (
            <button key={item} type="button" className={`rounded-md px-4 py-1.5 text-sm font-medium ${index === 0 ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item}
            </button>
          ))}
        </div>
        <button type="button" className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
          <Icon name="download" className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProgressCard title="Present Today" value="118" suffix="/ 124" color="emerald" width="95%" />
        <ProgressCard title="Late Arrivals" value="8" color="amber" width="15%" />
        <ProgressCard title="Absent" value="4" color="red" width="5%" />
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="font-bold text-gray-800">Daily Attendance Log</h3>
          <span className="text-xs text-gray-500">Showing last 20 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-white font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Total Hours</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((row) => <AttendanceRow key={`${row[0]}-${row[2]}`} row={row} />)}
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h4 className="mb-2 text-sm font-medium text-gray-500">{title}</h4>
      <div className={`text-3xl font-bold ${textColor}`}>
        {value} {suffix && <span className="text-base font-normal text-gray-400">{suffix}</span>}
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width }} />
      </div>
    </div>
  )
}

function AttendanceRow({ row }) {
  const [name, status, inTime, outTime, hours, notes] = row
  const statusColor = status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'

  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
      <td className="px-6 py-4"><span className={`rounded px-2 py-1 text-xs font-semibold ${statusColor}`}>{status}</span></td>
      <td className="px-6 py-4 text-gray-600">{inTime}</td>
      <td className="px-6 py-4 text-gray-600">{outTime}</td>
      <td className="px-6 py-4 text-gray-600">{hours}</td>
      <td className="px-6 py-4 italic text-gray-400">{notes}</td>
    </tr>
  )
}
