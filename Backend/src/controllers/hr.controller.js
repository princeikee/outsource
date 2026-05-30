import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as hrService from '../services/hr.service.js'

export const overview = asyncHandler(async (req, res) => {
  res.json(await hrService.getHrOverview(getTenantId(req)))
})

export const createPosition = asyncHandler(async (req, res) => {
  res.status(201).json(await hrService.createOpenPosition(getTenantId(req), req.body))
})
