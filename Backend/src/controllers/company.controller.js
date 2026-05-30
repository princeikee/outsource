import { asyncHandler } from '../utils/asyncHandler.js'
import * as companyService from '../services/company.service.js'

export const listCompanies = asyncHandler(async (req, res) => {
  res.json(await companyService.listCompanies())
})

export const getCompany = asyncHandler(async (req, res) => {
  res.json(await companyService.getCompany(req.validated.params.id))
})

export const suspendCompany = asyncHandler(async (req, res) => {
  res.json(await companyService.suspendCompany(req.validated.params.id, req.validated.body, req.user.sub))
})

export const reactivateCompany = asyncHandler(async (req, res) => {
  res.json(await companyService.reactivateCompany(req.validated.params.id))
})

export const disableCompanyAdmins = asyncHandler(async (req, res) => {
  res.json(await companyService.disableCompanyAdmins(req.validated.params.id))
})

export const enableCompanyAdmins = asyncHandler(async (req, res) => {
  res.json(await companyService.enableCompanyAdmins(req.validated.params.id))
})

export const softDeleteCompany = asyncHandler(async (req, res) => {
  res.json(await companyService.softDeleteCompany(req.validated.params.id, req.body))
})
