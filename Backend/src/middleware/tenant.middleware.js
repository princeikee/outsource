import ApiError from '../utils/ApiError.js'

export function tenantScope(req, res, next) {
  if (req.user?.role === 'SUPER_ADMIN') {
    return next(new ApiError(403, 'Super admin cannot access tenant-scoped resources'))
  }

  if (!req.user?.companyId) {
    return next(new ApiError(401, 'Tenant context missing'))
  }

  if (req.body?.companyId && req.body.companyId !== req.user.companyId) {
    return next(new ApiError(403, 'Cross-company writes are not allowed'))
  }

  req.companyId = req.user.companyId
  req.tenantFilter = { companyId: req.user.companyId }
  return next()
}
