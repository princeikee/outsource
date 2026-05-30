import ApiError from './ApiError.js'

export function getTenantId(req) {
  if (!req.user?.companyId) {
    throw new ApiError(401, 'Tenant context missing')
  }

  return req.user.companyId
}

export function assertSameTenant(req, companyId) {
  if (getTenantId(req) !== companyId) {
    throw new ApiError(403, 'Cross-company access denied')
  }
}
