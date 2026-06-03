import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'
import { signAccessToken } from '../utils/jwt.js'
import { getPlatformSettings } from './settings.service.js'

const userSelect = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  role: true,
  company: {
    select: { id: true, name: true, email: true },
  },
}

export async function registerCompany({ adminEmail, adminName, companyEmail, companyName, password }) {
  const platformSettings = await getPlatformSettings()
  if (!platformSettings.registrationEnabled) {
    throw new ApiError(403, 'Company registration is currently closed. Contact platform support for access.')
  }

  const existingUser = await findUserByEmail(adminEmail)
  if (existingUser) {
    throw new ApiError(409, 'This email is already in use. Please sign in or use another email.')
  }

  if (companyEmail) {
    const existingCompany = await prisma.company.findUnique({ where: { email: companyEmail } })
    if (existingCompany) {
      throw new ApiError(409, 'This company email is already in use.')
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        email: companyEmail,
        ...(platformSettings.requireCompanyApproval
          ? {
              isActive: false,
              status: 'SUSPENDED',
              suspensionReason: 'Pending super admin approval',
              suspendedAt: new Date(),
              suspendedBy: 'platform-settings',
            }
          : {}),
      },
    })

    const [user] = await tx.$queryRaw`
      INSERT INTO "User" ("id", "companyId", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${company.id}, ${adminName}, ${adminEmail}, ${passwordHash}, 'COMPANY_ADMIN'::"UserRole", NOW(), NOW())
      RETURNING "id", "companyId", NULL::text AS "employeeId", "name", "email", "role"
    `
    user.company = { id: company.id, name: company.name, email: company.email }

    if (platformSettings.requireCompanyApproval) {
      return {
        company: { id: company.id, name: company.name, email: company.email },
        message: 'Company account created and is pending super admin approval.',
        pendingApproval: true,
      }
    }

    return { company: { id: company.id, name: company.name, email: company.email }, user, token: signAccessToken(user) }
  })
}

export async function loginUser({ companyEmail, companyId, email, password }) {
  const filters = ['u.email = $1']
  const params = [email]

  if (companyId) {
    params.push(companyId)
    filters.push(`u."companyId" = $${params.length}`)
  }

  if (companyEmail) {
    params.push(companyEmail)
    filters.push(`c.email = $${params.length}`)
  }

  const users = await prisma.$queryRawUnsafe(`
    SELECT
      u.id,
      u."companyId",
      e.id AS "employeeId",
      u.name,
      u.email,
      u."passwordHash",
      u.role::text AS role,
      u."isActive" AS "userIsActive",
      c.name AS "companyName",
      c.id AS "companyId",
      c.email AS "companyEmail",
      c."isActive" AS "companyIsActive",
      c.status::text AS "companyStatus",
      c."suspensionReason",
      c."suspendedAt",
      e."isActive" AS "employeeIsActive"
    FROM "User" u
    JOIN "Company" c ON c.id = u."companyId"
    LEFT JOIN "Employee" e ON e."userId" = u.id
    WHERE ${filters.join(' AND ')}
  `, ...params)

  if (users.length > 1) {
    throw new ApiError(400, 'Multiple companies use this email. Provide companyId or companyEmail.')
  }

  const user = users[0]

  if (user?.passwordHash?.startsWith('DISABLED:')) {
    throw new ApiError(403, 'Employee login is disabled')
  }

  if (user) {
    if (!user.userIsActive) {
      throw new ApiError(403, 'User account is disabled', buildAppealDetails(user, 'Your administrator account has been disabled.'))
    }
    if (user.companyStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Company access is suspended', buildAppealDetails(user, user.suspensionReason || 'No reason provided'))
    }
    if (user.companyStatus === 'DEACTIVATED' || !user.companyIsActive) {
      throw new ApiError(403, 'Company account is deactivated', buildAppealDetails(user, user.suspensionReason || 'Company account access has been deactivated.'))
    }
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid credentials')
  }

  if (user.employeeId && !user.employeeIsActive) {
    throw new ApiError(403, 'Employee login is disabled')
  }

  const safeUser = {
    id: user.id,
    companyId: user.companyId,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    company: {
      id: user.companyId,
      name: user.companyName,
      email: user.companyEmail,
    },
  }

  return { user: safeUser, token: signAccessToken(user) }
}

export async function submitCompanyAppeal({ companyId, email, message }) {
  const platformSettings = await getPlatformSettings()
  if (!platformSettings.appealsEnabled) {
    throw new ApiError(403, 'Company appeals are currently disabled. Contact platform support directly.')
  }

  const trimmedMessage = message?.trim()
  if (!trimmedMessage) throw new ApiError(400, 'Appeal message is required')

  const company = companyId ? await findCompanyById(companyId) : await findCompanyByUserEmail(email)

  const [appeal] = await prisma.$queryRaw`
    INSERT INTO "CompanyAppeal" ("id", "companyId", "email", "message", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${company?.id || null}, ${email}, ${trimmedMessage}, NOW(), NOW())
    RETURNING id, "companyId", email, message, status, "createdAt"
  `

  return {
    ...appeal,
    notice: 'Your appeal has been submitted. Platform support will review it and contact your company.',
  }
}

async function findUserByEmail(email) {
  if (!email) return null

  const [user] = await prisma.$queryRaw`
    SELECT id FROM "User"
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `

  return user || null
}

async function findCompanyById(id) {
  if (!id) return null
  const [company] = await prisma.$queryRaw`
    SELECT id, name FROM "Company"
    WHERE id = ${id}
    LIMIT 1
  `
  return company || null
}

async function findCompanyByUserEmail(email) {
  if (!email) return null
  const [company] = await prisma.$queryRaw`
    SELECT c.id, c.name
    FROM "User" u
    JOIN "Company" c ON c.id = u."companyId"
    WHERE LOWER(u.email) = LOWER(${email})
    LIMIT 1
  `
  return company || null
}

function buildAppealDetails(user, reason) {
  return {
    appealAllowed: true,
    appealMessage: 'You can submit an appeal from this login page for platform support to review.',
    companyId: user.companyId,
    companyName: user.companyName,
    email: user.email,
    reason,
    suspendedAt: user.suspendedAt,
  }
}
