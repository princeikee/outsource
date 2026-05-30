import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import ApiError from '../utils/ApiError.js'
import { prisma } from '../config/prisma.js'

const employeeSelect = {
  id: true,
  companyId: true,
  userId: true,
  departmentId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  hireDate: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  employmentDetails: {
    select: {
      id: true,
      salary: true,
      currency: true,
      jobTitle: true,
      employmentType: true,
      startDate: true,
    },
  },
  salaryAssignments: {
    orderBy: { effectiveAt: 'desc' },
    select: {
      id: true,
      amount: true,
      currency: true,
      effectiveAt: true,
    },
    take: 1,
  },
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  },
}

export async function getEmployees(companyId) {
  const employees = await prisma.employee.findMany({
    where: { companyId },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    select: employeeSelect,
  })

  return employees.map(serializeEmployee)
}

export async function getEmployee(companyId, id) {
  await ensureEmployee(companyId, id)
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: employeeSelect,
  })

  return serializeEmployee(employee)
}

export async function createEmployee(companyId, data) {
  const {
    createUser = true,
    currency = 'NGN',
    department,
    name,
    password,
    role,
    salary,
    userRole = 'EMPLOYEE',
    jobTitle,
    ...employeeInput
  } = data
  const employeeName = normalizeEmployeeName(name, employeeInput.firstName, employeeInput.lastName)
  const [firstName, ...lastNameParts] = employeeName.split(' ')
  const lastName = lastNameParts.join(' ') || firstName

  if (!employeeInput.email) {
    throw new ApiError(400, 'Email is required when creating an employee')
  }

  const existingUser = await findUserByEmail(employeeInput.email)
  if (existingUser) {
    throw new ApiError(409, 'This email is already in use. Please use another email.')
  }

  const plainPassword = createUser ? password || generatePassword() : null

  const employee = await prisma.$transaction(async (tx) => {
    const departmentRecord = await resolveDepartment(tx, companyId, department)
    const createdUser = createUser
      ? await tx.user.create({
          data: {
            companyId,
            email: employeeInput.email,
            name: employeeName,
            passwordHash: await bcrypt.hash(plainPassword, 12),
            role: userRole,
          },
        })
      : null

    const createdEmployee = await tx.employee.create({
      data: {
        email: employeeInput.email,
        firstName: employeeInput.firstName || firstName,
        hireDate: employeeInput.hireDate,
        lastName: employeeInput.lastName || lastName,
        phone: employeeInput.phone,
        companyId,
        departmentId: departmentRecord?.id,
        userId: createdUser?.id,
      },
      select: employeeSelect,
    })

    await tx.employmentDetails.create({
      data: {
        companyId,
        currency,
        employeeId: createdEmployee.id,
        employmentType: role,
        jobTitle,
        salary,
        startDate: employeeInput.hireDate,
      },
    })

    if (salary) {
      await tx.salaryAssignment.create({
        data: {
          amount: salary,
          companyId,
          currency,
          employeeId: createdEmployee.id,
        },
      })
    }

    return tx.employee.findUnique({
      where: { id: createdEmployee.id },
      select: employeeSelect,
    })
  })

  return {
    employee: serializeEmployee(employee),
    login: createUser
      ? {
          email: employeeInput.email,
          password: plainPassword,
          role: userRole,
        }
      : null,
  }
}

export async function updateEmployee(companyId, id, data) {
  const { currency = 'NGN', department, jobTitle, role, salary, ...employeeData } = data
  await ensureEmployee(companyId, id)

  return prisma.$transaction(async (tx) => {
    const departmentRecord = Object.hasOwn(data, 'department')
      ? await resolveDepartment(tx, companyId, department)
      : undefined
    const employee = await tx.employee.update({
      where: { id },
      data: {
        ...employeeData,
        ...(departmentRecord !== undefined ? { departmentId: departmentRecord?.id || null } : {}),
      },
      include: { user: true },
    })

    if (employee.user) {
      await tx.user.update({
        where: { id: employee.user.id },
        data: {
          ...(employeeData.email ? { email: employeeData.email } : {}),
          ...((employeeData.firstName || employeeData.lastName)
            ? { name: `${employeeData.firstName || employee.firstName} ${employeeData.lastName || employee.lastName}`.trim() }
            : {}),
        },
      })
    }

    if (Object.hasOwn(data, 'salary') || Object.hasOwn(data, 'jobTitle') || Object.hasOwn(data, 'role') || Object.hasOwn(data, 'hireDate')) {
      await tx.employmentDetails.upsert({
        where: { employeeId: id },
        update: {
          ...(Object.hasOwn(data, 'salary') ? { salary } : {}),
          ...(Object.hasOwn(data, 'currency') ? { currency } : {}),
          ...(Object.hasOwn(data, 'jobTitle') ? { jobTitle } : {}),
          ...(Object.hasOwn(data, 'role') ? { employmentType: role } : {}),
          ...(Object.hasOwn(data, 'hireDate') ? { startDate: employeeData.hireDate } : {}),
        },
        create: {
          companyId,
          currency,
          employeeId: id,
          employmentType: role,
          jobTitle,
          salary,
          startDate: employeeData.hireDate,
        },
      })
    }

    if (salary) {
      await tx.salaryAssignment.create({
        data: {
          amount: salary,
          companyId,
          currency,
          employeeId: id,
        },
      })
    }

    const updatedEmployee = await tx.employee.findUnique({
      where: { id },
      select: employeeSelect,
    })

    return serializeEmployee(updatedEmployee)
  })
}

export async function deleteEmployee(companyId, id) {
  const employee = await prisma.employee.findFirst({
    where: { id, companyId },
    include: { user: true },
  })
  if (!employee) throw new ApiError(404, 'Employee not found')

  await prisma.$transaction(async (tx) => {
    await tx.employee.delete({ where: { id } })
    if (employee.user) {
      await tx.user.delete({ where: { id: employee.user.id } })
    }
  })
}

export function assignRoleDepartment(companyId, id, data) {
  return updateEmployee(companyId, id, data)
}

export async function setEmployeeLoginEnabled(companyId, id, enabled) {
  const employee = await prisma.employee.findFirst({
    where: { id, companyId },
    include: { user: true },
  })

  if (!employee) throw new ApiError(404, 'Employee not found')
  if (!employee.user) throw new ApiError(404, 'Employee login account not found')

  await prisma.user.update({
    where: { id: employee.user.id },
    data: {
      isActive: enabled,
      passwordHash: enabled ? employee.user.passwordHash.replace(/^DISABLED:/, '') : employee.user.passwordHash,
    },
  })

  return getEmployee(companyId, id)
}

export async function resetEmployeePassword(companyId, id, password) {
  const employee = await prisma.employee.findFirst({
    where: { id, companyId },
    include: { user: true },
  })

  if (!employee) throw new ApiError(404, 'Employee not found')
  if (!employee.user) throw new ApiError(404, 'Employee login account not found')

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: employee.user.id },
    data: { isActive: true, passwordHash },
  })

  return {
    employee: serializeEmployee(await prisma.employee.findUnique({ where: { id }, select: employeeSelect })),
    login: {
      email: employee.user.email,
      password,
      warning: 'This password can only be viewed once. Share it securely before closing this message.',
    },
  }
}

export async function ensureEmployee(companyId, id) {
  const employee = await prisma.employee.findFirst({ where: { id, companyId } })
  if (!employee) throw new ApiError(404, 'Employee not found')
  return employee
}

function normalizeEmployeeName(name, firstName, lastName) {
  return (name || `${firstName || ''} ${lastName || ''}`).trim().replace(/\s+/g, ' ')
}

function generatePassword() {
  return `Emp-${crypto.randomBytes(6).toString('base64url')}`
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

async function resolveDepartment(tx, companyId, department) {
  const name = department?.trim()
  if (!name) return null

  return tx.department.upsert({
    where: {
      companyId_name: {
        companyId,
        name,
      },
    },
    update: {},
    create: {
      companyId,
      name,
    },
  })
}

function serializeEmployee(employee) {
  if (!employee) return employee

  const department = employee.department?.name || null
  const jobTitle = employee.employmentDetails?.jobTitle || null
  const role = employee.employmentDetails?.employmentType || 'Employee'
  const salaryAssignments = employee.salaryAssignments?.length
    ? employee.salaryAssignments
    : employee.employmentDetails?.salary
      ? [{
          id: employee.employmentDetails.id,
          amount: employee.employmentDetails.salary,
          currency: employee.employmentDetails.currency,
          effectiveAt: employee.employmentDetails.startDate || employee.createdAt,
        }]
      : []

  const normalizedEmployee = {
    ...employee,
    department,
    departmentRecord: employee.department,
    jobTitle,
    role,
    salaryAssignments,
  }

  if (!employee.user) return normalizedEmployee

  const { passwordHash, ...user } = employee.user

  return {
    ...normalizedEmployee,
    user: {
      ...user,
      loginEnabled: user.isActive && !passwordHash.startsWith('DISABLED:'),
    },
  }
}
