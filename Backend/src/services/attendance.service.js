import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'
import { ensureEmployee } from './employee.service.js'

export async function clockIn(companyId, user, { employeeId, latitude, longitude, notes }) {
  employeeId = resolveEmployeeId(user, employeeId)
  await ensureEmployee(companyId, employeeId)
  const location = await validateOfficeLocation(companyId, latitude, longitude)
  const workDate = startOfDay(new Date())

  const existing = await prisma.attendanceRecord.findUnique({
    where: { companyId_employeeId_workDate: { companyId, employeeId, workDate } },
  })

  if (existing?.clockInAt && !existing.clockOutAt) {
    throw new ApiError(409, 'Employee is already clocked in')
  }

  const record = await prisma.attendanceRecord.upsert({
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

  await prisma.$executeRaw`
    UPDATE "AttendanceRecord"
    SET "clockInLatitude" = ${latitude},
        "clockInLongitude" = ${longitude},
        "clockInDistanceMeters" = ${location.distanceMeters}
    WHERE id = ${record.id}
      AND "companyId" = ${companyId}
  `

  return findAttendanceRecord(companyId, record.id)
}

export async function clockOut(companyId, user, { employeeId, latitude, longitude, notes }) {
  employeeId = resolveEmployeeId(user, employeeId)
  await ensureEmployee(companyId, employeeId)
  const location = await validateOfficeLocation(companyId, latitude, longitude)
  const workDate = startOfDay(new Date())

  const record = await prisma.attendanceRecord.findUnique({
    where: { companyId_employeeId_workDate: { companyId, employeeId, workDate } },
  })

  if (!record?.clockInAt) throw new ApiError(400, 'Employee has not clocked in today')
  if (record.clockOutAt) throw new ApiError(409, 'Employee is already clocked out')

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutAt: new Date(),
      status: 'clocked_out',
      notes: notes ?? record.notes,
    },
    include: { employee: true },
  })

  await prisma.$executeRaw`
    UPDATE "AttendanceRecord"
    SET "clockOutLatitude" = ${latitude},
        "clockOutLongitude" = ${longitude},
        "clockOutDistanceMeters" = ${location.distanceMeters}
    WHERE id = ${updated.id}
      AND "companyId" = ${companyId}
  `

  return findAttendanceRecord(companyId, updated.id)
}

export async function getDailyAttendance(companyId, date = new Date()) {
  const workDate = startOfDay(date)
  const [records, activeEmployeeCount, company] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { companyId, workDate },
      include: { employee: true },
      orderBy: { clockInAt: 'desc' },
    }),
    prisma.employee.count({ where: { companyId, isActive: true } }),
    getOfficeConfig(companyId),
  ])

  const presentToday = records.length
  const lateArrivals = records.filter((record) => isLateArrival(record.clockInAt, company)).length

  return {
    office: formatOfficeConfig(company),
    summary: {
      activeEmployeeCount,
      presentToday,
      lateArrivals,
      absentToday: Math.max(activeEmployeeCount - presentToday, 0),
    },
    records,
  }
}

export function getAttendanceHistory(companyId, user, employeeId, { from, to }) {
  employeeId = resolveEmployeeId(user, employeeId)

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

function resolveEmployeeId(user, employeeId) {
  if (['EMPLOYEE', 'staff', 'employee'].includes(user.role)) {
    if (!user.employeeId) throw new ApiError(403, 'Your user account is not linked to an employee profile')
    return user.employeeId
  }

  if (!employeeId) throw new ApiError(400, 'employeeId is required for admin attendance actions')
  return employeeId
}

async function validateOfficeLocation(companyId, latitude, longitude) {
  const company = await getOfficeConfig(companyId)
  const office = formatOfficeConfig(company)

  if (!office.isConfigured) {
    throw new ApiError(400, 'Office location is not configured. Ask your company admin to set it in Settings.')
  }

  const distanceMeters = Math.round(calculateDistanceMeters(latitude, longitude, office.latitude, office.longitude))

  if (distanceMeters > office.radiusMeters) {
    throw new ApiError(403, `You are ${distanceMeters}m from the office. Attendance is allowed within ${office.radiusMeters}m of the office premises.`)
  }

  return { distanceMeters }
}

async function getOfficeConfig(companyId) {
  const [company] = await prisma.$queryRaw`
    SELECT "officeLatitude", "officeLongitude", "officeRadiusMeters"
      , "workStartTime", "lateGraceMinutes"
    FROM "Company"
    WHERE id = ${companyId}
    LIMIT 1
  `

  if (!company) throw new ApiError(404, 'Company not found')
  return company
}

function isLateArrival(clockInAt, company) {
  if (!clockInAt) return false
  const [hour, minute] = (company.workStartTime || '09:00').split(':').map(Number)
  const cutoff = new Date(clockInAt)
  cutoff.setHours(hour, minute + Number(company.lateGraceMinutes || 0), 0, 0)
  return clockInAt >= cutoff
}

function formatOfficeConfig(company) {
  const latitude = company.officeLatitude === null || company.officeLatitude === undefined ? null : Number(company.officeLatitude)
  const longitude = company.officeLongitude === null || company.officeLongitude === undefined ? null : Number(company.officeLongitude)
  const radiusMeters = company.officeRadiusMeters ? Number(company.officeRadiusMeters) : null

  return {
    latitude,
    longitude,
    radiusMeters,
    isConfigured: latitude !== null && longitude !== null && Boolean(radiusMeters),
  }
}

function calculateDistanceMeters(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const earthRadiusMeters = 6371000
  const lat1 = toRadians(fromLatitude)
  const lat2 = toRadians(toLatitude)
  const deltaLat = toRadians(toLatitude - fromLatitude)
  const deltaLon = toRadians(toLongitude - fromLongitude)
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

async function findAttendanceRecord(companyId, id) {
  return prisma.attendanceRecord.findFirst({
    where: { companyId, id },
    include: { employee: true },
  })
}
