import { useEffect, useState } from 'react'
import { payrollApi } from '../../services/api'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Payslips({ auth }) {
  const [error, setError] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [payslips, setPayslips] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadPayslips() {
      setLoading(true)
      setError('')

      try {
        const data = await payrollApi.mine(auth.token)
        if (isMounted) setPayslips(data)
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPayslips()

    return () => {
      isMounted = false
    }
  }, [auth.token])

  return (
    <>
      {error && <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="font-bold text-gray-800">Payslips</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Gross Salary</th>
                <th className="px-6 py-3">Deductions</th>
                <th className="px-6 py-3">Net Pay</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="6">Loading payslips...</td></tr>
              ) : payslips.length ? (
                payslips.map((record) => <PayslipRow key={record.id} record={record} />)
              ) : (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="6">No payslips yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function PayslipRow({ record }) {
  const statusLabel = record.status === 'paid' ? 'Paid' : 'Pending'
  const statusClass = record.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{monthNames[record.month - 1]} {record.year}</td>
      <td className="px-6 py-4 text-gray-600">{money(record.grossAmount)}</td>
      <td className="px-6 py-4 text-red-500">-{money(record.deductions)}</td>
      <td className="px-6 py-4 font-bold text-gray-800">{money(record.netAmount)}</td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
      </td>
      <td className="px-6 py-4 text-gray-500">{record.paidAt ? new Date(record.paidAt).toLocaleDateString() : '-'}</td>
    </tr>
  )
}

function money(value) {
  return new Intl.NumberFormat('en-NG', {
    currency: 'NGN',
    style: 'currency',
  }).format(Number(value || 0))
}
