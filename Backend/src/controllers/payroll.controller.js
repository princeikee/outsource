import { emitToCompany } from '../sockets/index.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as payrollService from '../services/payroll.service.js'

export const assignSalary = asyncHandler(async (req, res) => {
  const salary = await payrollService.assignSalary(getTenantId(req), req.validated.body)
  res.status(201).json(salary)
})

export const generatePayroll = asyncHandler(async (req, res) => {
  const companyId = getTenantId(req)
  const records = await payrollService.generatePayroll(companyId, req.validated.body)
  emitToCompany(companyId, 'payroll:generated', records)
  res.status(201).json(records)
})

export const listPayroll = asyncHandler(async (req, res) => {
  res.json(await payrollService.getPayrollRecords(getTenantId(req), req.query))
})

export const myPayroll = asyncHandler(async (req, res) => {
  if (!req.user.employeeId) {
    return res.json([])
  }

  res.json(await payrollService.getEmployeePayrollRecords(getTenantId(req), req.user.employeeId))
})

export const updatePayrollStatus = asyncHandler(async (req, res) => {
  const companyId = getTenantId(req)
  const record = await payrollService.updatePayrollStatus(companyId, req.validated.params.id, req.validated.body.status)
  emitToCompany(companyId, 'payroll:updated', record)
  res.json(record)
})
