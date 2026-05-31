import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as reportService from '../services/report.service.js'

export const generateReport = asyncHandler(async (req, res) => {
  res.json(await reportService.generateReport(getTenantId(req), req.validated.query))
})
