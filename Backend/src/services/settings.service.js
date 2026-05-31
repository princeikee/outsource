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
      c.status::text AS "companyStatus",
      c."officeLatitude",
      c."officeLongitude",
      c."officeRadiusMeters"
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
      officeLatitude: record.officeLatitude === null || record.officeLatitude === undefined ? '' : Number(record.officeLatitude),
      officeLongitude: record.officeLongitude === null || record.officeLongitude === undefined ? '' : Number(record.officeLongitude),
      officeRadiusMeters: record.officeRadiusMeters || '',
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

export async function updateCompanySettings(user, { email, name, officeLatitude, officeLongitude, officeRadiusMeters }) {
  if (!['COMPANY_ADMIN', 'HR'].includes(user.role)) {
    throw new ApiError(403, 'Only company admins can update company settings')
  }

  const normalizedEmail = email?.trim() || null
  const normalizedOfficeLatitude = normalizeOptionalNumber(officeLatitude)
  const normalizedOfficeLongitude = normalizeOptionalNumber(officeLongitude)
  const normalizedOfficeRadiusMeters = normalizeOptionalNumber(officeRadiusMeters)

  const hasAnyOfficeValue = normalizedOfficeLatitude !== null || normalizedOfficeLongitude !== null || normalizedOfficeRadiusMeters !== null
  const hasEveryOfficeValue = normalizedOfficeLatitude !== null && normalizedOfficeLongitude !== null && normalizedOfficeRadiusMeters !== null
  if (hasAnyOfficeValue && !hasEveryOfficeValue) {
    throw new ApiError(400, 'Office latitude, longitude, and radius must be filled together')
  }

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
        "officeLatitude" = ${normalizedOfficeLatitude},
        "officeLongitude" = ${normalizedOfficeLongitude},
        "officeRadiusMeters" = ${normalizedOfficeRadiusMeters},
        "updatedAt" = NOW()
    WHERE id = ${user.companyId}
    RETURNING
      id,
      name,
      email,
      status::text AS status,
      "officeLatitude",
      "officeLongitude",
      "officeRadiusMeters"
  `

  if (!updated) throw new ApiError(404, 'Company not found')
  return {
    ...updated,
    officeLatitude: updated.officeLatitude === null || updated.officeLatitude === undefined ? '' : Number(updated.officeLatitude),
    officeLongitude: updated.officeLongitude === null || updated.officeLongitude === undefined ? '' : Number(updated.officeLongitude),
  }
}

function normalizeOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}
