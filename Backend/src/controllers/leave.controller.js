import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import { emitToCompany } from '../sockets/index.js'
import * as leaveService from '../services/leave.service.js'

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const companyId = getTenantId(req)
  const request = await leaveService.createLeaveRequest(companyId, req.user.employeeId, req.validated.body)
  emitToCompany(companyId, 'leave:created', request)
  res.status(201).json(request)
})

export const myLeaveRequests = asyncHandler(async (req, res) => {
  res.json(await leaveService.getMyLeaveRequests(getTenantId(req), req.user.employeeId))
})

export const listLeaveRequests = asyncHandler(async (req, res) => {
  res.json(await leaveService.getLeaveRequests(getTenantId(req), req.validated.query.status))
})

export const reviewLeaveRequest = asyncHandler(async (req, res) => {
  const companyId = getTenantId(req)
  const request = await leaveService.reviewLeaveRequest(companyId, req.validated.params.id, req.user.sub, req.validated.body)
  emitToCompany(companyId, 'leave:reviewed', request)
  res.json(request)
})
