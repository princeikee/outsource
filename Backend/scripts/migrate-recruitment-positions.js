import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RecruitmentPosition" (
      "id" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "departmentId" TEXT,
      "title" TEXT NOT NULL,
      "openings" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'Open',
      "priority" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "RecruitmentPosition_pkey" PRIMARY KEY ("id")
    )
  `)

  await addConstraint('RecruitmentPosition_companyId_fkey', 'ALTER TABLE "RecruitmentPosition" ADD CONSTRAINT "RecruitmentPosition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE')
  await addConstraint('RecruitmentPosition_departmentId_fkey', 'ALTER TABLE "RecruitmentPosition" ADD CONSTRAINT "RecruitmentPosition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE')

  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "RecruitmentPosition_companyId_idx" ON "RecruitmentPosition"("companyId")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "RecruitmentPosition_companyId_departmentId_idx" ON "RecruitmentPosition"("companyId", "departmentId")')

  console.log('Recruitment positions table ready.')
}

async function addConstraint(name, sql) {
  const exists = await prisma.$queryRawUnsafe('SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1', name)
  if (!exists.length) {
    await prisma.$executeRawUnsafe(sql)
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
