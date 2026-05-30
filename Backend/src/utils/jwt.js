import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
      employeeId: user.employeeId,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret)
}
