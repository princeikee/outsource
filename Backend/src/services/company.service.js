import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'

export function listCompanies() {
  return prisma.$queryRaw`
    SELECT
      c.id,
      c.name,
      c.email,
      c."isActive",
      c.status::text AS status,
      c."suspensionReason",
      c."suspendedAt",
      c."suspendedBy",
      c."deletedAt",
      c."createdAt",
      COUNT(DISTINCT e.id)::int AS "employeeCount",
      COUNT(DISTINCT u.id)::int AS "adminCount",
      COUNT(DISTINCT u.id) FILTER (WHERE u."isActive" = true)::int AS "activeAdminCount"
    FROM "Company" c
    LEFT JOIN "Employee" e ON e."companyId" = c.id
    LEFT JOIN "User" u ON u."companyId" = c.id AND u.role::text = 'COMPANY_ADMIN'
    WHERE c.email IS NULL OR c.email <> 'platform@local'
    GROUP BY c.id
    ORDER BY c."createdAt" DESC
  `
}

export async function getCompany(id) {
  const [company] = await prisma.$queryRaw`
    SELECT
      c.id,
      c.name,
      c.email,
      c."isActive",
      c.status::text AS status,
      c."suspensionReason",
      c."suspendedAt",
      c."suspendedBy",
      c."deletedAt",
      c."createdAt",
      COUNT(DISTINCT e.id)::int AS "employeeCount",
      COUNT(DISTINCT u.id)::int AS "userCount",
      COUNT(DISTINCT u.id) FILTER (WHERE u.role::text = 'COMPANY_ADMIN')::int AS "adminCount",
      COUNT(DISTINCT u.id) FILTER (WHERE u.role::text = 'COMPANY_ADMIN' AND u."isActive" = true)::int AS "activeAdminCount"
    FROM "Company" c
    LEFT JOIN "Employee" e ON e."companyId" = c.id
    LEFT JOIN "User" u ON u."companyId" = c.id
    WHERE c.id = ${id} AND (c.email IS NULL OR c.email <> 'platform@local')
    GROUP BY c.id
  `

  if (!company) throw new ApiError(404, 'Company not found')
  return company
}

export async function suspendCompany(id, { reason }, suspendedBy) {
  if (!reason?.trim()) throw new ApiError(400, 'Suspension reason is required')

  const [company] = await prisma.$queryRaw`
    UPDATE "Company"
    SET
      "isActive" = false,
      status = 'SUSPENDED'::"CompanyStatus",
      "suspensionReason" = ${reason.trim()},
      "suspendedAt" = NOW(),
      "suspendedBy" = ${suspendedBy},
      "updatedAt" = NOW()
    WHERE id = ${id} AND (email IS NULL OR email <> 'platform@local')
    RETURNING id, name, email, "isActive", status::text AS status, "suspensionReason", "suspendedAt", "suspendedBy", "deletedAt", "createdAt", "updatedAt"
  `

  if (!company) throw new ApiError(404, 'Company not found')
  return company
}

export async function reactivateCompany(id) {
  const [company] = await prisma.$queryRaw`
    UPDATE "Company"
    SET
      "isActive" = true,
      status = 'ACTIVE'::"CompanyStatus",
      "suspensionReason" = NULL,
      "suspendedAt" = NULL,
      "suspendedBy" = NULL,
      "deletedAt" = NULL,
      "updatedAt" = NOW()
    WHERE id = ${id} AND (email IS NULL OR email <> 'platform@local')
    RETURNING id, name, email, "isActive", status::text AS status, "suspensionReason", "suspendedAt", "suspendedBy", "deletedAt", "createdAt", "updatedAt"
  `

  if (!company) throw new ApiError(404, 'Company not found')
  return company
}

export async function disableCompanyAdmins(id) {
  await ensureCompany(id)

  const admins = await prisma.$queryRaw`
    UPDATE "User"
    SET "isActive" = false, "updatedAt" = NOW()
    WHERE "companyId" = ${id} AND role::text = 'COMPANY_ADMIN'
    RETURNING id, name, email, "isActive"
  `

  return { disabledAdmins: admins.length, admins }
}

export async function enableCompanyAdmins(id) {
  await ensureCompany(id)

  const admins = await prisma.$queryRaw`
    UPDATE "User"
    SET "isActive" = true, "updatedAt" = NOW()
    WHERE "companyId" = ${id} AND role::text = 'COMPANY_ADMIN'
    RETURNING id, name, email, "isActive"
  `

  return { enabledAdmins: admins.length, admins }
}

export async function softDeleteCompany(id, { reason } = {}) {
  if (!reason?.trim()) throw new ApiError(400, 'Deletion reason is required')

  const [company] = await prisma.$queryRaw`
    UPDATE "Company"
    SET
      "isActive" = false,
      status = 'DEACTIVATED'::"CompanyStatus",
      "suspensionReason" = ${reason.trim()},
      "deletedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE id = ${id} AND (email IS NULL OR email <> 'platform@local')
    RETURNING id, name, email, "isActive", status::text AS status, "suspensionReason", "suspendedAt", "suspendedBy", "deletedAt", "createdAt", "updatedAt"
  `

  if (!company) throw new ApiError(404, 'Company not found')
  return company
}

async function ensureCompany(id) {
  const [company] = await prisma.$queryRaw`
    SELECT id FROM "Company"
    WHERE id = ${id} AND (email IS NULL OR email <> 'platform@local')
    LIMIT 1
  `

  if (!company) throw new ApiError(404, 'Company not found')
  return company
}
