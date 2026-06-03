import '../src/config/env.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyStatus') THEN
        CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
      END IF;
    END $$;
  `)

  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "status" "CompanyStatus" NOT NULL DEFAULT \'ACTIVE\'')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3)')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "suspendedBy" TEXT')
  await prisma.$executeRawUnsafe('ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)')

  await prisma.$executeRawUnsafe(`
    UPDATE "Company"
    SET "status" = CASE WHEN "isActive" = true THEN 'ACTIVE'::"CompanyStatus" ELSE 'SUSPENDED'::"CompanyStatus" END
    WHERE "status" IS NULL
  `)

  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Company_status_deletedAt_idx" ON "Company"("status", "deletedAt")')

  console.log('Company moderation fields ready.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
