import { asyncHandler } from '../utils/asyncHandler.js'
import { getTenantId } from '../utils/tenant.js'
import * as employeeService from '../services/employee.service.js'

export const listEmployees = asyncHandler(async (req, res) => {
  res.json(await employeeService.getEmployees(getTenantId(req)))
})

export const getEmployee = asyncHandler(async (req, res) => {
  res.json(await employeeService.getEmployee(getTenantId(req), req.validated.params.id))
})

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(getTenantId(req), req.validated.body)
  res.status(201).json(employee)
})

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(getTenantId(req), req.validated.params.id, req.validated.body)
  res.json(employee)
})

export const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(getTenantId(req), req.validated.params.id)
  res.status(204).send()
})

export const assignRoleDepartment = asyncHandler(async (req, res) => {
  const employee = await employeeService.assignRoleDepartment(getTenantId(req), req.validated.params.id, req.validated.body)
  res.json(employee)
})

export const setEmployeeLoginEnabled = asyncHandler(async (req, res) => {
  const employee = await employeeService.setEmployeeLoginEnabled(getTenantId(req), req.validated.params.id, req.validated.body.enabled)
  res.json(employee)
})

export const resetEmployeePassword = asyncHandler(async (req, res) => {
  const result = await employeeService.resetEmployeePassword(getTenantId(req), req.validated.params.id, req.validated.body.password)
  res.json(result)
})
