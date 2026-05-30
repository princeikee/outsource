import { prisma } from '../config/prisma.js'

export async function getDashboard(companyId) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = startOfDay(now)

  const [
    employeeStats,
    attendanceToday,
    payrollStats,
    accountingStats,
    monthlyAccounting,
    recentEmployees,
    recentPayroll,
    recentEntries,
  ] = await Promise.all([
    prisma.employee.aggregate({
      where: { companyId },
      _count: { id: true },
    }),
    prisma.attendanceRecord.count({
      where: { companyId, workDate: today },
    }),
    prisma.payrollRecord.aggregate({
      where: { companyId, month, year },
      _count: { id: true },
      _sum: { grossAmount: true, deductions: true, netAmount: true },
    }),
    prisma.accountingEntry.groupBy({
      by: ['type'],
      where: { companyId },
      _sum: { amount: true },
    }),
    prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "entryDate")::int AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense
      FROM "AccountingEntry"
      WHERE "companyId" = ${companyId}
        AND EXTRACT(YEAR FROM "entryDate") = ${year}
      GROUP BY month
      ORDER BY month ASC
    `,
    prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { firstName: true, lastName: true, createdAt: true },
      take: 3,
    }),
    prisma.payrollRecord.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      select: { month: true, year: true, status: true, netAmount: true, updatedAt: true },
      take: 3,
    }),
    prisma.accountingEntry.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { amount: true, category: true, type: true, createdAt: true },
      take: 3,
    }),
  ])

  const income = Number(accountingStats.find((item) => item.type === 'income')?._sum.amount || 0)
  const expense = Number(accountingStats.find((item) => item.type === 'expense')?._sum.amount || 0)
  const pendingPayroll = await prisma.payrollRecord.count({ where: { companyId, status: 'unpaid' } })

  return {
    kpis: {
      employees: employeeStats._count.id,
      attendanceToday,
      pendingPayroll,
      revenue: income - expense,
      payrollNet: Number(payrollStats._sum.netAmount || 0),
    },
    chart: buildMonthlyChart(monthlyAccounting),
    activities: [
      ...recentEmployees.map((employee) => ({
        desc: `${employee.firstName} ${employee.lastName}`,
        icon: 'user-plus',
        time: employee.createdAt,
        title: 'Employee added',
      })),
      ...recentPayroll.map((record) => ({
        desc: `${monthName(record.month)} ${record.year} - ${record.status === 'paid' ? 'Paid' : 'Pending'}`,
        icon: 'banknote',
        time: record.updatedAt,
        title: 'Payroll updated',
      })),
      ...recentEntries.map((entry) => ({
        desc: `${entry.type} - ${formatMoney(entry.amount)}`,
        icon: 'receipt',
        time: entry.createdAt,
        title: entry.category,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5),
    events: [
      { color: 'bg-blue-100 text-blue-700', date: 'Today', time: 'Daily', title: 'Attendance review' },
      { color: 'bg-green-100 text-green-700', date: monthName(month), time: 'Month end', title: 'Payroll generation' },
      { color: 'bg-purple-100 text-purple-700', date: 'This month', time: 'Open', title: `${pendingPayroll} pending payroll records` },
      { color: 'bg-amber-100 text-amber-700', date: 'Current', time: 'Live', title: `${employeeStats._count.id} employees tracked` },
    ],
  }
}

function buildMonthlyChart(rows) {
  const values = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, net: 0 }))
  rows.forEach((row) => {
    values[row.month - 1].net = Number(row.income || 0) - Number(row.expense || 0)
  })
  return values
}

function startOfDay(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function monthName(month) {
  return new Date(2026, month - 1, 1).toLocaleString('en', { month: 'short' })
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-NG', { currency: 'NGN', style: 'currency' }).format(Number(value || 0))
}
