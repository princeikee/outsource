import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as leaveService from '../services/leave.service.js'

export const createLeaveRequest = asyncHandler(async (req, res) => {
  res.status(201).json(await leaveService.createLeaveRequest(getTenantId(req), req.user.employeeId, req.validated.body))
})

export const myLeaveRequests = asyncHandler(async (req, res) => {
  res.json(await leaveService.getMyLeaveRequests(getTenantId(req), req.user.employeeId))
})

export const listLeaveRequests = asyncHandler(async (req, res) => {
  res.json(await leaveService.getLeaveRequests(getTenantId(req), req.validated.query.status))
})

export const reviewLeaveRequest = asyncHandler(async (req, res) => {
  res.json(await leaveService.reviewLeaveRequest(getTenantId(req), req.validated.params.id, req.user.sub, req.validated.body))
})
