import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { payrollApi } from '../services/api'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Payroll({ auth }) {
  const today = new Date()
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [isGenerating, setGenerating] = useState(false)
  const [period, setPeriod] = useState({ month: today.getMonth() + 1, year: today.getFullYear() })
  const [form, setForm] = useState({ bonus: '', deductions: '' })

  useEffect(() => {
    let isMounted = true

    async function loadPayroll() {
      setLoading(true)
      setError('')

      try {
        const data = await payrollApi.list(auth.token, period)
        if (isMounted) setRecords(data)
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPayroll()

    return () => {
      isMounted = false
    }
  }, [auth.token, period])

  const summary = useMemo(() => {
    return records.reduce((totals, record) => ({
      gross: totals.gross + Number(record.grossAmount),
      deductions: totals.deductions + Number(record.deductions),
      net: totals.net + Number(record.netAmount),
      paid: totals.paid + (record.status === 'paid' ? 1 : 0),
      pending: totals.pending + (record.status === 'paid' ? 0 : 1),
    }), { gross: 0, deductions: 0, net: 0, paid: 0, pending: 0 })
  }, [records])

  function updatePeriod(event) {
    const { name, value } = event.target
    setPeriod((current) => ({ ...current, [name]: Number(value) }))
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleGenerate(event) {
    event.preventDefault()
    setGenerating(true)
    setError('')

    try {
      const data = await payrollApi.generate(auth.token, {
        month: period.month,
        year: period.year,
        bonus: form.bonus ? Number(form.bonus) : 0,
        deductions: form.deductions ? Number(form.deductions) : 0,
      })
      setRecords(data)
    } catch (generateError) {
      setError(generateError.message)
    } finally {
      setGenerating(false)
    }
  }

  async function markPaid(record) {
    setError('')

    try {
      const updated = await payrollApi.updateStatus(auth.token, record.id, 'paid')
      setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  return (
    <>
      {error && <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="mb-8 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-6 xl:flex-row xl:items-end">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Payroll Period</h3>
            <p className="text-sm text-gray-500">{monthNames[period.month - 1]} {period.year} payroll snapshots</p>
          </div>

          <form className="grid grid-cols-1 gap-3 md:grid-cols-5" onSubmit={handleGenerate}>
            <SelectField label="Month" name="month" value={period.month} onChange={updatePeriod}>
              {monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </SelectField>
            <Field label="Year" name="year" type="number" value={period.year} onChange={updatePeriod} min="2000" />
            <Field label="Bonus" name="bonus" type="number" value={form.bonus} onChange={updateForm} min="0" step="0.01" placeholder="0" />
            <Field label="Deductions" name="deductions" type="number" value={form.deductions} onChange={updateForm} min="0" step="0.01" placeholder="0" />
            <button type="submit" className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60" disabled={isGenerating}>
              <Icon name="plus-circle" className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Payroll'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-100 bg-gray-50/50 md:grid-cols-5 md:divide-x md:divide-y-0">
          <SummaryStat label="Total Gross Pay" value={money(summary.gross)} />
          <SummaryStat label="Total Deductions" value={money(summary.deductions)} />
          <SummaryStat label="Net Pay Total" value={money(summary.net)} accent />
          <SummaryStat label="Pending" value={summary.pending} />
          <SummaryStat label="Paid" value={summary.paid} />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-bold text-gray-800">Payroll Records</h3>
          <span className="text-sm text-gray-500">{records.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-gray-50 font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Base/Gross Salary</th>
                <th className="px-6 py-3">Deductions</th>
                <th className="px-6 py-3">Net Salary</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Paid At</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="8">Loading payroll...</td></tr>
              ) : records.length ? (
                records.map((record) => <PayrollRow key={record.id} record={record} onMarkPaid={markPaid} />)
              ) : (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="8">No payroll records for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function PayrollRow({ onMarkPaid, record }) {
  const employee = `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim()
  const statusLabel = record.status === 'paid' ? 'Paid' : 'Pending'
  const statusClass = record.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'

  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{employee || 'Employee'}</td>
      <td className="px-6 py-4 text-gray-600">{monthNames[record.month - 1]} {record.year}</td>
      <td className="px-6 py-4 text-gray-600">{money(record.grossAmount)}</td>
      <td className="px-6 py-4 text-red-500">-{money(record.deductions)}</td>
      <td className="px-6 py-4 font-bold text-gray-800">{money(record.netAmount)}</td>
      <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>{statusLabel}</span></td>
      <td className="px-6 py-4 text-gray-500">{record.paidAt ? new Date(record.paidAt).toLocaleDateString() : '-'}</td>
      <td className="px-6 py-4 text-right">
        {record.status === 'paid' ? (
          <span className="text-xs font-semibold text-gray-400">Completed</span>
        ) : (
          <button type="button" className="text-sm font-semibold text-primary-600 hover:text-primary-800" onClick={() => onMarkPaid(record)}>Mark Paid</button>
        )}
      </td>
    </tr>
  )
}

function SummaryStat({ accent, label, value }) {
  return (
    <div className="p-6 text-center">
      <p className="mb-1 text-sm text-gray-500">{label}</p>
      <h4 className={`text-2xl font-bold ${accent ? 'text-emerald-600' : 'text-gray-800'}`}>{value}</h4>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <input {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </label>
  )
}

function SelectField({ children, label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
        {children}
      </select>
    </label>
  )
}

function money(value) {
  return new Intl.NumberFormat('en-NG', {
    currency: 'NGN',
    style: 'currency',
  }).format(Number(value || 0))
}
