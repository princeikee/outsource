import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'

export async function generateReport(companyId, query) {
  const period = resolvePeriod(query)
  const handlers = {
    accounting: accountingReport,
    attendance: attendanceReport,
    hr: hrReport,
    leave: leaveReport,
    payroll: payrollReport,
  }

  return handlers[query.module](companyId, period)
}

async function hrReport(companyId, period) {
  const [employees, departments, newHires, activeCount] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId },
      include: { department: true, employmentDetails: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.employee.count({ where: { companyId, createdAt: { gte: period.from, lte: period.to } } }),
    prisma.employee.count({ where: { companyId, isActive: true } }),
  ])

  return {
    module: 'hr',
    title: 'Employee Headcount',
    period,
    summary: [
      metric('Total Employees', employees.length),
      metric('Active Employees', activeCount),
      metric('Departments', departments.length),
      metric('New Hires In Period', newHires),
    ],
    rows: employees.map((employee) => ({
      Department: employee.department?.name || 'Unassigned',
      Email: employee.email || '-',
      Employee: fullName(employee),
      'Employment Type': employee.employmentDetails?.employmentType || '-',
      'Job Title': employee.employmentDetails?.jobTitle || '-',
      Status: employee.isActive ? 'Active' : 'Inactive',
    })),
    secondaryRows: departments.map((department) => ({
      Department: department.name,
      Employees: department._count.employees,
    })),
  }
}

async function accountingReport(companyId, period) {
  const [entries, totals] = await Promise.all([
    prisma.accountingEntry.findMany({
      where: { companyId, entryDate: { gte: period.from, lte: period.to } },
      orderBy: { entryDate: 'desc' },
    }),
    prisma.accountingEntry.groupBy({
      by: ['type'],
      where: { companyId, entryDate: { gte: period.from, lte: period.to } },
      _sum: { amount: true },
    }),
  ])

  const income = Number(totals.find((item) => item.type === 'income')?._sum.amount || 0)
  const expenses = Number(totals.find((item) => item.type === 'expense')?._sum.amount || 0)

  return {
    module: 'accounting',
    title: 'Financial Summary',
    period,
    summary: [
      metric('Total Income', income, true),
      metric('Total Expenses', expenses, true),
      metric('Net Balance', income - expenses, true),
      metric('Transactions', entries.length),
    ],
    rows: entries.map((entry) => ({
      Amount: Number(entry.amount),
      Category: entry.category,
      Date: entry.entryDate,
      Description: entry.description || '-',
      Type: entry.type,
    })),
  }
}

async function payrollReport(companyId, period) {
  const rows = await prisma.$queryRaw`
    SELECT
      pr.id,
      pr.month,
      pr.year,
      pr."grossAmount",
      pr.deductions,
      pr."netAmount",
      pr.status::text AS status,
      pr."paidAt",
      e."firstName",
      e."lastName",
      e.email
    FROM "PayrollRecord" pr
    JOIN "Employee" e ON e.id = pr."employeeId"
    WHERE pr."companyId" = ${companyId}
      AND make_date(pr.year, pr.month, 1) >= date_trunc('month', ${period.from}::timestamp)
      AND make_date(pr.year, pr.month, 1) <= date_trunc('month', ${period.to}::timestamp)
    ORDER BY pr.year DESC, pr.month DESC, e."firstName" ASC
  `

  const gross = sum(rows, 'grossAmount')
  const deductions = sum(rows, 'deductions')
  const net = sum(rows, 'netAmount')
  const paidCount = rows.filter((row) => row.status === 'paid').length

  return {
    module: 'payroll',
    title: 'Payroll Summary',
    period,
    summary: [
      metric('Payroll Records', rows.length),
      metric('Paid Records', paidCount),
      metric('Pending Records', rows.length - paidCount),
      metric('Net Payroll', net, true),
      metric('Gross Payroll', gross, true),
      metric('Deductions', deductions, true),
    ],
    rows: rows.map((row) => ({
      Deductions: Number(row.deductions),
      Employee: `${row.firstName} ${row.lastName}`,
      Gross: Number(row.grossAmount),
      Month: monthName(row.month),
      Net: Number(row.netAmount),
      'Paid At': row.paidAt || '-',
      Status: row.status,
      Year: row.year,
    })),
  }
}

async function attendanceReport(companyId, period) {
  const [records, activeEmployeeCount, company] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { companyId, workDate: { gte: startOfDay(period.from), lte: endOfDay(period.to) } },
      include: { employee: true },
      orderBy: { workDate: 'desc' },
    }),
    prisma.employee.count({ where: { companyId, isActive: true } }),
    getCompanyAttendancePolicy(companyId),
  ])

  const completed = records.filter((record) => record.clockInAt && record.clockOutAt).length
  const late = records.filter((record) => isLateArrival(record.clockInAt, company)).length

  return {
    module: 'attendance',
    title: 'Attendance Analysis',
    period,
    summary: [
      metric('Clock-ins', records.length),
      metric('Completed Days', completed),
      metric('Late Arrivals', late),
      metric('Active Employees', activeEmployeeCount),
    ],
    rows: records.map((record) => ({
      'Clock In': record.clockInAt || '-',
      'Clock Out': record.clockOutAt || '-',
      Date: record.workDate,
      Employee: fullName(record.employee),
      'In Distance': record.clockInDistanceMeters ?? '-',
      'Out Distance': record.clockOutDistanceMeters ?? '-',
      Status: record.status,
    })),
  }
}

async function leaveReport(companyId, period) {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      companyId,
      startDate: { lte: period.to },
      endDate: { gte: period.from },
    },
    include: { employee: true },
    orderBy: { startDate: 'desc' },
  })

  return {
    module: 'leave',
    title: 'Leave Requests',
    period,
    summary: [
      metric('Leave Requests', requests.length),
      metric('Approved', requests.filter((request) => request.status === 'approved').length),
      metric('Pending', requests.filter((request) => request.status === 'pending').length),
      metric('Rejected', requests.filter((request) => request.status === 'rejected').length),
    ],
    rows: requests.map((request) => ({
      Employee: fullName(request.employee),
      'End Date': request.endDate,
      Reason: request.reason || '-',
      'Review Note': request.reviewNote || '-',
      'Start Date': request.startDate,
      Status: request.status,
      Type: request.type,
    })),
  }
}

function resolvePeriod({ from, range, to }) {
  const now = new Date()
  let start
  let end

  if (range === 'custom') {
    if (!from || !to) throw new ApiError(400, 'Select a start and end date for custom reports')
    start = startOfDay(from)
    end = endOfDay(to)
  } else if (range === 'today') {
    start = startOfDay(now)
    end = endOfDay(now)
  } else if (range === 'this_week') {
    start = startOfDay(now)
    start.setDate(start.getDate() - start.getDay())
    end = endOfDay(now)
  } else if (range === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  } else if (range === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
  } else {
    start = new Date(now.getFullYear(), 0, 1)
    end = endOfDay(new Date(now.getFullYear(), 11, 31))
  }

  if (start > end) throw new ApiError(400, 'Report start date cannot be after end date')

  return { from: start, label: `${formatDate(start)} - ${formatDate(end)}`, range, to: end }
}

function metric(label, value, money = false) {
  return { label, money, value }
}

function fullName(employee) {
  return `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || employee?.email || 'Employee'
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0)
}

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfDay(value) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(value)
}

function monthName(month) {
  return new Date(2026, month - 1, 1).toLocaleString('en', { month: 'long' })
}

async function getCompanyAttendancePolicy(companyId) {
  const [company] = await prisma.$queryRaw`
    SELECT "workStartTime", "lateGraceMinutes"
    FROM "Company"
    WHERE id = ${companyId}
    LIMIT 1
  `

  return company || { lateGraceMinutes: 0, workStartTime: '09:00' }
}

function isLateArrival(clockInAt, company) {
  if (!clockInAt) return false
  const [hour, minute] = (company.workStartTime || '09:00').split(':').map(Number)
  const cutoff = new Date(clockInAt)
  cutoff.setHours(hour, minute + Number(company.lateGraceMinutes || 0), 0, 0)
  return clockInAt >= cutoff
}
