import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'
import { ensureEmployee } from './employee.service.js'

export async function assignSalary(companyId, data) {
  await ensureEmployee(companyId, data.employeeId)

  return prisma.salaryAssignment.create({
    data: { currency: 'NGN', ...data, companyId },
  })
}

export async function generatePayroll(companyId, { bonus = 0, deductions = 0, employeeId, month, year }) {
  const employees = await prisma.employee.findMany({
    where: { companyId, isActive: true, ...(employeeId ? { id: employeeId } : {}) },
  })

  if (!employees.length) throw new ApiError(404, 'No active employees found')

  const records = []

  for (const employee of employees) {
    const salary = await prisma.salaryAssignment.findFirst({
      where: { companyId, employeeId: employee.id },
      orderBy: { effectiveAt: 'desc' },
    })

    if (!salary) continue

    const grossAmount = Number(salary.amount) + bonus
    const netAmount = grossAmount - deductions

    records.push(
      await prisma.payrollRecord.upsert({
        where: {
          companyId_employeeId_month_year: {
            companyId,
            employeeId: employee.id,
            month,
            year,
          },
        },
        update: {
          grossAmount,
          deductions,
          netAmount,
        },
        create: {
          companyId,
          employeeId: employee.id,
          month,
          year,
          grossAmount,
          deductions,
          netAmount,
        },
        include: { employee: true },
      }),
    )
  }

  if (!records.length) throw new ApiError(400, 'No salary assignments found for selected employees')
  return records
}

export async function updatePayrollStatus(companyId, id, status) {
  const record = await prisma.payrollRecord.findFirst({ where: { id, companyId }, include: { employee: true } })
  if (!record) throw new ApiError(404, 'Payroll record not found')

  return prisma.$transaction(async (tx) => {
    const updatedRecord = await tx.payrollRecord.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'paid' ? new Date() : null,
      },
      include: { employee: true },
    })

    if (status === 'paid' && record.status !== 'paid') {
      const employeeName = `${record.employee.firstName} ${record.employee.lastName}`.trim()

      await tx.accountingEntry.create({
        data: {
          amount: updatedRecord.netAmount,
          category: 'payroll',
          companyId,
          description: `Payroll paid for ${employeeName} - ${record.month}/${record.year}`,
          entryDate: updatedRecord.paidAt,
          type: 'expense',
        },
      })
    }

    return updatedRecord
  })
}

export function getPayrollRecords(companyId, { month, year } = {}) {
  return prisma.payrollRecord.findMany({
    where: {
      companyId,
      ...(month ? { month: Number(month) } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    include: { employee: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}

export function getEmployeePayrollRecords(companyId, employeeId) {
  return prisma.payrollRecord.findMany({
    where: { companyId, employeeId },
    include: { employee: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}
