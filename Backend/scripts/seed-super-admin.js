import '../src/config/env.js'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { env } from '../src/config/env.js'
import { prisma } from '../src/config/prisma.js'

if (!env.superAdminEmail || !env.superAdminPassword) {
  throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required')
}

const passwordHash = await bcrypt.hash(env.superAdminPassword, 12)
const platformCompany = await prisma.company.upsert({
  where: { email: 'platform@local' },
  update: { name: 'Platform Administration' },
  create: { name: 'Platform Administration', email: 'platform@local' },
})

const [existing] = await prisma.$queryRaw`
  SELECT id FROM "User"
  WHERE "companyId" = ${platformCompany.id} AND email = ${env.superAdminEmail}
`

if (existing) {
  await prisma.$executeRaw`
    UPDATE "User"
    SET name = ${env.superAdminName}, "passwordHash" = ${passwordHash}, role = 'SUPER_ADMIN'::"UserRole", "isActive" = true, "updatedAt" = NOW()
    WHERE id = ${existing.id}
  `
} else {
  await prisma.$executeRaw`
    INSERT INTO "User" ("id", "companyId", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${platformCompany.id}, ${env.superAdminName}, ${env.superAdminEmail}, ${passwordHash}, 'SUPER_ADMIN'::"UserRole", NOW(), NOW())
  `
}

console.log(`SUPER_ADMIN ready: ${env.superAdminEmail}`)
await prisma.$disconnect()
