import crypto from 'node:crypto'
import { prisma } from '../config/prisma.js'
import ApiError from '../utils/ApiError.js'

export async function getHrOverview(companyId) {
  const [departments, employeeCount, openPositions, leaveStats, pendingLeaveRequests, onLeaveToday] = await Promise.all([
    prisma.department.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { employees: true },
        },
        employees: {
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            employmentDetails: {
              select: {
                employmentType: true,
                jobTitle: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.employee.count({ where: { companyId } }),
    getOpenPositions(companyId),
    getLeaveStats(companyId),
    getPendingLeaveRequests(companyId),
    getEmployeesOnLeaveToday(companyId),
  ])

  const openPositionTotal = openPositions.reduce((total, position) => total + position.openings, 0)
  const urgentPositionTotal = openPositions
    .filter((position) => position.priority?.toLowerCase() === 'urgent' || position.priority?.toLowerCase() === 'high')
    .reduce((total, position) => total + position.openings, 0)

  return {
    summary: {
      openPositions: openPositionTotal,
      openPositionsSub: openPositionTotal ? `${urgentPositionTotal} urgent roles to fill` : 'No open positions recorded',
      onLeaveToday: onLeaveToday.length,
      onLeaveTodaySub: onLeaveToday.length ? `${onLeaveToday.length} approved leave record${onLeaveToday.length === 1 ? '' : 's'} today` : 'No leave records for today',
      pendingApprovals: leaveStats.pending,
      pendingApprovalsSub: leaveStats.pending ? `${leaveStats.pending} leave request${leaveStats.pending === 1 ? '' : 's'} pending` : 'No pending approvals',
      employeeCount,
    },
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
      employees: department.employees.map((employee) => ({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        email: employee.email,
        isActive: employee.isActive,
        jobTitle: employee.employmentDetails?.jobTitle,
        role: employee.employmentDetails?.employmentType || 'Employee',
      })),
    })),
    recruitment: {
      openPositions,
      note: 'Recruitment records will appear here when open positions are added.',
    },
    approvals: {
      queues: pendingLeaveRequests.map((request) => ({
        id: request.id,
        title: request.employeeName,
        text: `${request.type} leave from ${formatDate(request.startDate)} to ${formatDate(request.endDate)}`,
        status: 'Pending review',
        type: 'leave',
        reason: request.reason,
      })),
      note: 'Approval queues will appear here when leave or expense approval records exist.',
    },
    leave: {
      onLeaveToday,
      note: 'Leave records will appear here when employees have approved leave.',
    },
  }
}

export async function createOpenPosition(companyId, data) {
  if (!data.title?.trim()) {
    throw new ApiError(400, 'Position title is required')
  }

  const department = await resolveDepartment(companyId, data.department)
  const openings = Math.max(1, Number(data.openings || 1))
  const [position] = await prisma.$queryRawUnsafe(`
    INSERT INTO "RecruitmentPosition" ("id", "companyId", "departmentId", "title", "openings", "status", "priority", "notes", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING
      id,
      title,
      openings,
      status,
      priority,
      notes,
      "createdAt"
  `, crypto.randomUUID(), companyId, department?.id || null, data.title.trim(), openings, data.status || 'Open', data.priority || null, data.notes || null)

  return {
    ...position,
    department: department?.name || 'Unassigned',
    summary: `${position.openings} ${position.openings === 1 ? 'active opening' : 'active openings'}`,
  }
}

async function getOpenPositions(companyId) {
  const positions = await prisma.$queryRawUnsafe(`
    SELECT
      rp.id,
      rp.title,
      rp.openings,
      rp.status,
      rp.priority,
      rp.notes,
      rp."createdAt",
      COALESCE(d.name, 'Unassigned') AS department
    FROM "RecruitmentPosition" rp
    LEFT JOIN "Department" d ON d.id = rp."departmentId" AND d."companyId" = rp."companyId"
    WHERE rp."companyId" = $1
    ORDER BY rp."createdAt" DESC
  `, companyId)

  return positions.map((position) => ({
    ...position,
    summary: `${position.openings} ${position.openings === 1 ? 'active opening' : 'active openings'}`,
  }))
}

async function getLeaveStats(companyId) {
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS pending
    FROM "LeaveRequest"
    WHERE "companyId" = $1 AND status = 'pending'::"LeaveStatus"
  `, companyId)

  return { pending: row?.pending || 0 }
}

function getPendingLeaveRequests(companyId) {
  return prisma.$queryRawUnsafe(`
    SELECT
      lr.id,
      lr.type,
      lr."startDate",
      lr."endDate",
      lr.reason,
      CONCAT(e."firstName", ' ', e."lastName") AS "employeeName"
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e.id = lr."employeeId" AND e."companyId" = lr."companyId"
    WHERE lr."companyId" = $1 AND lr.status = 'pending'::"LeaveStatus"
    ORDER BY lr."createdAt" ASC
    LIMIT 10
  `, companyId)
}

function getEmployeesOnLeaveToday(companyId) {
  return prisma.$queryRawUnsafe(`
    SELECT
      lr.id,
      lr.type,
      lr."startDate",
      lr."endDate",
      CONCAT(e."firstName", ' ', e."lastName") AS "employeeName"
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e.id = lr."employeeId" AND e."companyId" = lr."companyId"
    WHERE lr."companyId" = $1
      AND lr.status = 'approved'::"LeaveStatus"
      AND CURRENT_DATE BETWEEN lr."startDate"::date AND lr."endDate"::date
    ORDER BY e."firstName" ASC
  `, companyId)
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function resolveDepartment(companyId, departmentName) {
  const name = departmentName?.trim()
  if (!name) return null

  const [department] = await prisma.$queryRawUnsafe(`
    INSERT INTO "Department" ("id", "companyId", "name", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT ("companyId", "name")
    DO UPDATE SET "updatedAt" = "Department"."updatedAt"
    RETURNING id, name
  `, crypto.randomUUID(), companyId, name)

  return department
}
