import { emitToCompany } from '../sockets/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as attendanceService from '../services/attendance.service.js'

export const clockIn = asyncHandler(async (req, res) => {
  const companyId = getTenantId(req)
  const record = await attendanceService.clockIn(companyId, req.user, req.validated.body)
  emitToCompany(companyId, 'attendance:clock-in', record)
  res.status(201).json(record)
})

export const clockOut = asyncHandler(async (req, res) => {
  const companyId = getTenantId(req)
  const record = await attendanceService.clockOut(companyId, req.user, req.validated.body)
  emitToCompany(companyId, 'attendance:clock-out', record)
  res.json(record)
})

export const dailyAttendance = asyncHandler(async (req, res) => {
  res.json(await attendanceService.getDailyAttendance(getTenantId(req)))
})

export const attendanceHistory = asyncHandler(async (req, res) => {
  const { employeeId } = req.validated.params
  res.json(await attendanceService.getAttendanceHistory(getTenantId(req), req.user, employeeId, req.validated.query))
})
