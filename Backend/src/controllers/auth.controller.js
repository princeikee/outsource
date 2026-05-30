import { asyncHandler } from '../utils/asyncHandler.js'
import * as authService from '../services/auth.service.js'

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerCompany(req.validated.body)
  res.status(201).json(result)
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.validated.body)
  res.json(result)
})

export const appeal = asyncHandler(async (req, res) => {
  const result = await authService.submitCompanyAppeal(req.validated.body)
  res.status(201).json(result)
})
