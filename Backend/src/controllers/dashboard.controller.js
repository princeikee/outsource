import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as dashboardService from '../services/dashboard.service.js'

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await dashboardService.getDashboard(getTenantId(req)))
})
