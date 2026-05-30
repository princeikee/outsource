import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as accountingService from '../services/accounting.service.js'

export const createEntry = asyncHandler(async (req, res) => {
  const entry = await accountingService.recordEntry(getTenantId(req), req.validated.body)
  res.status(201).json(entry)
})

export const listEntries = asyncHandler(async (req, res) => {
  res.json(await accountingService.getEntries(getTenantId(req)))
})

export const summary = asyncHandler(async (req, res) => {
  res.json(await accountingService.getSummary(getTenantId(req), req.validated.query))
})
