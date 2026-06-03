import { asyncHandler } from '../utils/asyncHandler.js'
import * as settingsService from '../services/settings.service.js'

export const settings = asyncHandler(async (req, res) => {
  res.json(await settingsService.getSettings(req.user))
})

export const updateProfile = asyncHandler(async (req, res) => {
  res.json(await settingsService.updateProfile(req.user, req.validated.body))
})

export const updateCompany = asyncHandler(async (req, res) => {
  res.json(await settingsService.updateCompanySettings(req.user, req.validated.body))
})

export const updatePassword = asyncHandler(async (req, res) => {
  res.json(await settingsService.updatePassword(req.user, req.validated.body))
})

export const updatePlatform = asyncHandler(async (req, res) => {
  res.json(await settingsService.updatePlatformSettings(req.user, req.validated.body))
})
