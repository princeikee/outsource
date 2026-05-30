import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyAppeal" (
      "id" TEXT NOT NULL,
      "companyId" TEXT,
      "email" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyAppeal_pkey" PRIMARY KEY ("id")
    )
  `)

  await addConstraint('CompanyAppeal_companyId_fkey', 'ALTER TABLE "CompanyAppeal" ADD CONSTRAINT "CompanyAppeal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CompanyAppeal_companyId_status_idx" ON "CompanyAppeal"("companyId", "status")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CompanyAppeal_email_idx" ON "CompanyAppeal"("email")')

  console.log('Company appeal table ready.')
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
