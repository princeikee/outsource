import { prisma } from '../config/prisma.js'

export function recordEntry(companyId, data) {
  return prisma.accountingEntry.create({
    data: { ...data, companyId },
  })
}

export function getEntries(companyId) {
  return prisma.accountingEntry.findMany({
    where: { companyId },
    orderBy: { entryDate: 'desc' },
  })
}

export async function getSummary(companyId, { from, to }) {
  const where = {
    companyId,
    ...(from || to ? { entryDate: { gte: from, lte: to } } : {}),
  }

  const [income, expenses] = await Promise.all([
    prisma.accountingEntry.aggregate({
      where: { ...where, type: 'income' },
      _sum: { amount: true },
    }),
    prisma.accountingEntry.aggregate({
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
    }),
  ])

  const totalIncome = Number(income._sum.amount || 0)
  const totalExpenses = Number(expenses._sum.amount || 0)

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  }
}
