import crypto from 'node:crypto'
import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'

export async function createLeaveRequest(companyId, employeeId, data) {
  if (!employeeId) throw new ApiError(400, 'Employee account is required to request leave')

  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  if (endDate < startDate) throw new ApiError(400, 'End date cannot be before start date')

  await ensureEmployee(companyId, employeeId)

  const [request] = await prisma.$queryRawUnsafe(`
    INSERT INTO "LeaveRequest" ("id", "companyId", "employeeId", "type", "startDate", "endDate", "reason", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id, "companyId", "employeeId", type, "startDate", "endDate", reason, status::text AS status, "createdAt", "updatedAt"
  `, crypto.randomUUID(), companyId, employeeId, data.type, startDate, endDate, data.reason || null)

  return request
}

export function getMyLeaveRequests(companyId, employeeId) {
  if (!employeeId) throw new ApiError(400, 'Employee account is required')
  return prisma.$queryRawUnsafe(`
    SELECT id, type, "startDate", "endDate", reason, status::text AS status, "reviewedAt", "reviewNote", "createdAt"
    FROM "LeaveRequest"
    WHERE "companyId" = $1 AND "employeeId" = $2
    ORDER BY "createdAt" DESC
  `, companyId, employeeId)
}

export function getLeaveRequests(companyId, status) {
  const params = [companyId]
  const statusClause = status ? 'AND lr.status = $2::"LeaveStatus"' : ''
  if (status) params.push(status)

  return prisma.$queryRawUnsafe(`
    SELECT
      lr.id,
      lr.type,
      lr."startDate",
      lr."endDate",
      lr.reason,
      lr.status::text AS status,
      lr."reviewedAt",
      lr."reviewNote",
      lr."createdAt",
      e.id AS "employeeId",
      CONCAT(e."firstName", ' ', e."lastName") AS "employeeName",
      e.email AS "employeeEmail"
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e.id = lr."employeeId" AND e."companyId" = lr."companyId"
    WHERE lr."companyId" = $1 ${statusClause}
    ORDER BY lr."createdAt" DESC
  `, ...params)
}

export async function reviewLeaveRequest(companyId, id, reviewerId, { note, status }) {
  const [request] = await prisma.$queryRawUnsafe(`
    UPDATE "LeaveRequest"
    SET status = $1::"LeaveStatus",
        "reviewNote" = $2,
        "reviewedAt" = NOW(),
        "reviewedBy" = $3,
        "updatedAt" = NOW()
    WHERE id = $4 AND "companyId" = $5
    RETURNING id, type, "startDate", "endDate", reason, status::text AS status, "reviewedAt", "reviewNote", "createdAt"
  `, status, note || null, reviewerId, id, companyId)

  if (!request) throw new ApiError(404, 'Leave request not found')
  return request
}

async function ensureEmployee(companyId, employeeId) {
  const [employee] = await prisma.$queryRawUnsafe('SELECT id FROM "Employee" WHERE id = $1 AND "companyId" = $2 LIMIT 1', employeeId, companyId)
  if (!employee) throw new ApiError(404, 'Employee not found')
  return employee
}
