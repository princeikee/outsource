import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe('ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS \'EMPLOYEE\'')
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "officeLatitude" DECIMAL(10,7)')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "officeLongitude" DECIMAL(10,7)')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "officeRadiusMeters" INTEGER')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "defaultCurrency" TEXT NOT NULL DEFAULT \'NGN\'')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT \'Africa/Lagos\'')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "workStartTime" TEXT NOT NULL DEFAULT \'09:00\'')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "lateGraceMinutes" INTEGER NOT NULL DEFAULT 0')
  await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "userId" TEXT')
  await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "departmentId" TEXT')
  await prisma.$executeRawUnsafe('ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clockInLatitude" DECIMAL(10,7)')
  await prisma.$executeRawUnsafe('ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clockInLongitude" DECIMAL(10,7)')
  await prisma.$executeRawUnsafe('ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clockInDistanceMeters" INTEGER')
  await prisma.$executeRawUnsafe('ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clockOutLatitude" DECIMAL(10,7)')
  await prisma.$executeRawUnsafe('ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clockOutLongitude" DECIMAL(10,7)')
  await prisma.$executeRawUnsafe('ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "clockOutDistanceMeters" INTEGER')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Department" (
      "id" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EmploymentDetails" (
      "id" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "salary" DECIMAL(12,2),
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "jobTitle" TEXT,
      "employmentType" TEXT,
      "startDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EmploymentDetails_pkey" PRIMARY KEY ("id")
    )
  `)

  await addConstraint('Department_companyId_fkey', 'ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE')
  await addConstraint('Department_companyId_name_key', 'ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_name_key" UNIQUE ("companyId", "name")')
  await addConstraint('Employee_userId_key', 'ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_key" UNIQUE ("userId")')
  await addConstraint('Employee_userId_fkey', 'ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE')
  await addConstraint('Employee_departmentId_fkey', 'ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE')
  await addConstraint('EmploymentDetails_companyId_fkey', 'ALTER TABLE "EmploymentDetails" ADD CONSTRAINT "EmploymentDetails_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE')
  await addConstraint('EmploymentDetails_employeeId_key', 'ALTER TABLE "EmploymentDetails" ADD CONSTRAINT "EmploymentDetails_employeeId_key" UNIQUE ("employeeId")')
  await addConstraint('EmploymentDetails_employeeId_fkey', 'ALTER TABLE "EmploymentDetails" ADD CONSTRAINT "EmploymentDetails_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE')

  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Department_companyId_idx" ON "Department"("companyId")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Employee_companyId_departmentId_idx" ON "Employee"("companyId", "departmentId")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "EmploymentDetails_companyId_idx" ON "EmploymentDetails"("companyId")')

  if (await columnExists('User', 'employeeId')) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Employee" e
      SET "userId" = u.id
      FROM "User" u
      WHERE u."employeeId" = e.id
        AND e."userId" IS NULL
    `)
  }

  const hasEmployeeDepartment = await columnExists('Employee', 'department')
  const hasEmployeeRole = await columnExists('Employee', 'role')
  const hasEmployeeJobTitle = await columnExists('Employee', 'jobTitle')
  const hasEmployeeHireDate = await columnExists('Employee', 'hireDate')
  const hasSalaryAssignment = await tableExists('SalaryAssignment')

  const employees = await prisma.$queryRawUnsafe(`
    SELECT
      e.id,
      e."companyId",
      ${hasEmployeeDepartment ? 'e.department' : 'NULL'} AS department,
      ${hasEmployeeRole ? 'e.role' : 'NULL'} AS role,
      ${hasEmployeeJobTitle ? 'e."jobTitle"' : 'NULL'} AS "jobTitle",
      ${hasEmployeeHireDate ? 'e."hireDate"' : 'NULL'} AS "hireDate",
      ${hasSalaryAssignment ? 's.amount' : 'NULL'} AS amount,
      ${hasSalaryAssignment ? 's.currency' : 'NULL'} AS currency
    FROM "Employee" e
    ${hasSalaryAssignment ? `LEFT JOIN LATERAL (
      SELECT amount, currency
      FROM "SalaryAssignment"
      WHERE "companyId" = e."companyId"
        AND "employeeId" = e.id
      ORDER BY "effectiveAt" DESC
      LIMIT 1
    ) s ON TRUE` : ''}
  `)

  for (const employee of employees) {
    let departmentId = null
    const departmentName = employee.department?.trim()

    if (departmentName) {
      const [department] = await prisma.$queryRawUnsafe(`
        INSERT INTO "Department" ("id", "companyId", "name", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT ("companyId", "name")
        DO UPDATE SET "updatedAt" = "Department"."updatedAt"
        RETURNING id
      `, crypto.randomUUID(), employee.companyId, departmentName)

      departmentId = department.id

      await prisma.$executeRawUnsafe(`
        UPDATE "Employee"
        SET "departmentId" = $1
        WHERE id = $2
          AND "companyId" = $3
          AND "departmentId" IS NULL
      `, departmentId, employee.id, employee.companyId)
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "EmploymentDetails" ("id", "companyId", "employeeId", "salary", "currency", "jobTitle", "employmentType", "startDate", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT ("employeeId")
      DO UPDATE SET
        "salary" = COALESCE("EmploymentDetails"."salary", EXCLUDED."salary"),
        "currency" = COALESCE("EmploymentDetails"."currency", EXCLUDED."currency"),
        "jobTitle" = COALESCE("EmploymentDetails"."jobTitle", EXCLUDED."jobTitle"),
        "employmentType" = COALESCE("EmploymentDetails"."employmentType", EXCLUDED."employmentType"),
        "startDate" = COALESCE("EmploymentDetails"."startDate", EXCLUDED."startDate"),
        "updatedAt" = NOW()
    `, crypto.randomUUID(), employee.companyId, employee.id, employee.amount, employee.currency || 'NGN', employee.jobTitle, employee.role, employee.hireDate)
  }

  console.log(`Employee relational migration complete. Processed ${employees.length} employees.`)
}

async function addConstraint(name, sql) {
  const exists = await prisma.$queryRawUnsafe('SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1', name)
  if (!exists.length) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (error) {
      if (error?.code === 'P2010' && ['42P07', '42710'].includes(error?.meta?.code)) {
        return
      }

      throw error
    }
  }
}

async function columnExists(tableName, columnName) {
  const result = await prisma.$queryRawUnsafe(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1
    `,
    tableName,
    columnName,
  )

  return result.length > 0
}

async function tableExists(tableName) {
  const result = await prisma.$queryRawUnsafe(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1
    `,
    tableName,
  )

  return result.length > 0
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
