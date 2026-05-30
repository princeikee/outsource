import { useEffect, useMemo, useState } from 'react'
import { PrimaryButton } from '../components/Controls'
import Icon from '../components/Icon'
import { accountingApi } from '../services/api'

const emptyForm = {
  amount: '',
  category: '',
  description: '',
  entryDate: new Date().toISOString().slice(0, 10),
  type: 'income',
}

export default function Accounting({ auth }) {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isFormOpen, setFormOpen] = useState(false)
  const [isLoading, setLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [summary, setSummary] = useState({ netBalance: 0, totalExpenses: 0, totalIncome: 0 })

  useEffect(() => {
    let isMounted = true

    async function loadAccounting() {
      setLoading(true)
      setError('')

      try {
        const [entryData, summaryData] = await Promise.all([
          accountingApi.list(auth.token),
          accountingApi.summary(auth.token),
        ])

        if (isMounted) {
          setEntries(entryData)
          setSummary(summaryData)
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAccounting()

    return () => {
      isMounted = false
    }
  }, [auth.token])

  const incomePercent = useMemo(() => {
    const total = summary.totalIncome + summary.totalExpenses
    if (!total) return 50
    return Math.round((summary.totalIncome / total) * 100)
  }, [summary])

  function openForm(type) {
    setForm({ ...emptyForm, type })
    setFormOpen(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const entry = await accountingApi.create(auth.token, {
        ...form,
        amount: Number(form.amount),
        entryDate: form.entryDate,
      })
      const nextSummary = await accountingApi.summary(auth.token)

      setEntries((current) => [entry, ...current])
      setSummary(nextSummary)
      setForm(emptyForm)
      setFormOpen(false)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {error && <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="mb-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Financial Records</h3>
            <p className="mt-1 text-sm text-gray-500">Manual ledger for money entering and leaving your company.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryButton icon="plus" onClick={() => openForm('income')}>Add Income</PrimaryButton>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700" onClick={() => openForm('expense')}>
              <Icon name="plus" className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8">
        <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Accounting Ledger</h3>
              <p className="text-sm text-gray-500">Net Balance = Total Income - Total Expenses</p>
            </div>
            <p className="text-xs font-medium text-gray-400">Based on recorded transactions only</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Summary label="Total Income" value={money(summary.totalIncome)} color="text-emerald-600" />
            <Summary label="Total Expenses" value={money(summary.totalExpenses)} color="text-red-600" />
            <Summary label="Net Balance" value={money(summary.netBalance)} color={summary.netBalance >= 0 ? 'text-gray-900' : 'text-red-600'} />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>Income</span>
              <span>Expenses</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-red-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${incomePercent}%` }} />
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-bold text-gray-800">Accounting Transactions</h3>
          <span className="text-sm text-gray-500">{entries.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-gray-50 font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td className="px-6 py-6 text-gray-500" colSpan="5">Loading accounting entries...</td></tr>
              ) : entries.length ? (
                entries.map((entry) => <TransactionRow key={entry.id} entry={entry} />)
              ) : (
                <tr>
                  <td className="px-6 py-8" colSpan="5">
                    <EmptyLedger />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <AccountingForm form={form} isSaving={isSaving} onChange={updateField} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
      )}
    </>
  )
}

function AccountingForm({ form, isSaving, onChange, onClose, onSubmit }) {
  const isIncome = form.type === 'income'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/45 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">{isIncome ? 'Add Income' : 'Add Expense'}</h3>
          <button type="button" aria-label="Close accounting form" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Type</span>
            <select name="type" value={form.type} onChange={onChange} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <Field label="Amount" name="amount" type="number" value={form.amount} onChange={onChange} placeholder="250000" min="0" step="0.01" required />
          <Field label="Category" name="category" value={form.category} onChange={onChange} placeholder={isIncome ? 'Client payment' : 'Office expense'} required />
          <Field label="Date" name="entryDate" type="date" value={form.entryDate} onChange={onChange} required />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Description</span>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Short note about this transaction" className="min-h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white" onClick={onClose}>Cancel</button>
          <PrimaryButton type="submit" icon="plus" disabled={isSaving}>{isSaving ? 'Saving...' : isIncome ? 'Save Income' : 'Save Expense'}</PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function EmptyLedger() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h4 className="text-base font-bold text-gray-900">No accounting transactions yet</h4>
      <p className="mt-2 text-sm text-gray-500">Start your manual ledger by recording income or expenses. The system does not automatically know company finances; admins record transactions as they happen.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
        <GuideItem title="Income" text="Client payments, sales, service revenue, and other money received." />
        <GuideItem title="Expenses" text="Rent, subscriptions, supplies, transport, payroll, and other money spent." />
        <GuideItem title="Payroll" text="Paid payroll automatically records a payroll expense." />
      </div>
    </div>
  )
}

function GuideItem({ text, title }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  )
}

function Summary({ color, label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function TransactionRow({ entry }) {
  const isExpense = entry.type === 'expense'

  return (
    <tr className="transition hover:bg-gray-50">
      <td className="px-6 py-4 text-gray-600">{new Date(entry.entryDate).toLocaleDateString()}</td>
      <td className="px-6 py-4"><span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${isExpense ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{entry.type}</span></td>
      <td className="px-6 py-4"><span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{entry.category}</span></td>
      <td className="px-6 py-4 font-medium text-gray-900">{entry.description || '-'}</td>
      <td className={`px-6 py-4 text-right font-bold ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>{isExpense ? '-' : '+'}{money(entry.amount)}</td>
    </tr>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </label>
  )
}

function money(value) {
  return new Intl.NumberFormat('en-NG', {
    currency: 'NGN',
    style: 'currency',
  }).format(Number(value || 0))
}
