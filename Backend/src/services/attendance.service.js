import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'
import { ensureEmployee } from './employee.service.js'

export async function clockIn(companyId, { employeeId, notes }) {
  await ensureEmployee(companyId, employeeId)
  const workDate = startOfDay(new Date())

  const existing = await prisma.attendanceRecord.findUnique({
    where: { companyId_employeeId_workDate: { companyId, employeeId, workDate } },
  })

  if (existing?.clockInAt && !existing.clockOutAt) {
    throw new ApiError(409, 'Employee is already clocked in')
  }

  return prisma.attendanceRecord.upsert({
    where: { companyId_employeeId_workDate: { companyId, employeeId, workDate } },
    update: {
      clockInAt: new Date(),
      clockOutAt: null,
      status: 'clocked_in',
      notes,
    },
    create: {
      companyId,
      employeeId,
      workDate,
      clockInAt: new Date(),
      status: 'clocked_in',
      notes,
    },
    include: { employee: true },
  })
}

export async function clockOut(companyId, { employeeId, notes }) {
  await ensureEmployee(companyId, employeeId)
  const workDate = startOfDay(new Date())

  const record = await prisma.attendanceRecord.findUnique({
    where: { companyId_employeeId_workDate: { companyId, employeeId, workDate } },
  })

  if (!record?.clockInAt) throw new ApiError(400, 'Employee has not clocked in today')
  if (record.clockOutAt) throw new ApiError(409, 'Employee is already clocked out')

  return prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutAt: new Date(),
      status: 'clocked_out',
      notes: notes ?? record.notes,
    },
    include: { employee: true },
  })
}

export function getDailyAttendance(companyId, date = new Date()) {
  return prisma.attendanceRecord.findMany({
    where: { companyId, workDate: startOfDay(date) },
    include: { employee: true },
    orderBy: { clockInAt: 'desc' },
  })
}

export function getAttendanceHistory(companyId, employeeId, { from, to }) {
  return prisma.attendanceRecord.findMany({
    where: {
      companyId,
      employeeId,
      ...(from || to ? { workDate: { gte: from, lte: to } } : {}),
    },
    orderBy: { workDate: 'desc' },
  })
}

function startOfDay(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}
