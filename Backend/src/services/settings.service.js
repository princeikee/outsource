import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'

export async function getSettings(user) {
  const [record] = await prisma.$queryRaw`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role::text AS role,
      u."isActive",
      c.id AS "companyId",
      c.name AS "companyName",
      c.email AS "companyEmail",
      c.status::text AS "companyStatus"
    FROM "User" u
    JOIN "Company" c ON c.id = u."companyId"
    WHERE u.id = ${user.sub}
    LIMIT 1
  `

  if (!record) throw new ApiError(404, 'User settings not found')

  return {
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      isActive: record.isActive,
    },
    company: {
      id: record.companyId,
      name: record.companyName,
      email: record.companyEmail,
      status: record.companyStatus,
    },
  }
}

export async function updateProfile(user, { name }) {
  const [updated] = await prisma.$queryRaw`
    UPDATE "User"
    SET name = ${name.trim()}, "updatedAt" = NOW()
    WHERE id = ${user.sub}
    RETURNING id, name, email, role::text AS role, "isActive"
  `

  if (!updated) throw new ApiError(404, 'User not found')
  return updated
}

export async function updateCompanySettings(user, { email, name }) {
  if (!['COMPANY_ADMIN', 'HR'].includes(user.role)) {
    throw new ApiError(403, 'Only company admins can update company settings')
  }

  const normalizedEmail = email?.trim() || null

  if (normalizedEmail) {
    const [existing] = await prisma.$queryRaw`
      SELECT id FROM "Company"
      WHERE LOWER(email) = LOWER(${normalizedEmail})
        AND id <> ${user.companyId}
      LIMIT 1
    `
    if (existing) throw new ApiError(409, 'This company email is already in use')
  }

  const [updated] = await prisma.$queryRaw`
    UPDATE "Company"
    SET name = ${name.trim()},
        email = ${normalizedEmail},
        "updatedAt" = NOW()
    WHERE id = ${user.companyId}
    RETURNING id, name, email, status::text AS status
  `

  if (!updated) throw new ApiError(404, 'Company not found')
  return updated
}
