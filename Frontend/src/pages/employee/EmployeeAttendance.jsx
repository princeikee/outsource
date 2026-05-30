import Icon from '../../components/Icon'

const history = [
  ['May 23, 2026', '08:45 AM', '05:12 PM', '8h 27m', 'Present'],
  ['May 22, 2026', '08:52 AM', '05:08 PM', '8h 16m', 'Present'],
  ['May 21, 2026', '09:14 AM', '05:30 PM', '8h 16m', 'Late'],
]

export default function EmployeeAttendance() {
  return (
    <>
      <section className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Today's Attendance</h3>
            <p className="text-sm text-gray-500">Clock in and out with your company account.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              <Icon name="clock" className="h-4 w-4" />
              Clock In
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Icon name="check-circle" className="h-4 w-4" />
              Clock Out
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="font-bold text-gray-800">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-white font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((row) => (
                <tr key={row[0]} className="hover:bg-gray-50">
                  {row.map((cell, index) => (
                    <td key={cell} className={`px-6 py-4 ${index === 4 ? 'font-semibold text-emerald-600' : 'text-gray-600'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
