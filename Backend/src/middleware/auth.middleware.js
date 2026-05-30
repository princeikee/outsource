import ApiError from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/jwt.js'

export function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing authorization token'))
  }

  try {
    req.user = verifyAccessToken(header.slice(7))
    req.companyId = req.user.companyId
    return next()
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'))
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'))
    }

    const allowedRoles = roles.flatMap((role) => roleAliases[role] || role)

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'))
    }

    return next()
  }
}

const roleAliases = {
  admin: ['COMPANY_ADMIN'],
  HR: ['COMPANY_ADMIN', 'HR'],
  staff: ['EMPLOYEE', 'staff', 'employee'],
}
