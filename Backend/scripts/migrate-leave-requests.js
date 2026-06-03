import '../src/config/env.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveStatus') THEN
        CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected');
      END IF;
    END $$;
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LeaveRequest" (
      "id" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "startDate" TIMESTAMP(3) NOT NULL,
      "endDate" TIMESTAMP(3) NOT NULL,
      "reason" TEXT,
      "status" "LeaveStatus" NOT NULL DEFAULT 'pending',
      "reviewedAt" TIMESTAMP(3),
      "reviewedBy" TEXT,
      "reviewNote" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
    )
  `)

  await addConstraint('LeaveRequest_companyId_fkey', 'ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE')
  await addConstraint('LeaveRequest_employeeId_fkey', 'ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE')

  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "LeaveRequest_companyId_status_idx" ON "LeaveRequest"("companyId", "status")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "LeaveRequest_companyId_employeeId_idx" ON "LeaveRequest"("companyId", "employeeId")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "LeaveRequest_companyId_startDate_endDate_idx" ON "LeaveRequest"("companyId", "startDate", "endDate")')

  console.log('Leave request table ready.')
}

async function addConstraint(name, sql) {
  const exists = await prisma.$queryRawUnsafe('SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1', name)
  if (!exists.length) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (error) {
      if (error?.code === 'P2010' && ['42P07', '42710'].includes(error?.meta?.code)) return
      throw error
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
