import { z } from 'zod'

export const assignSalarySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    currency: z.string().min(3).max(3).default('NGN'),
    effectiveAt: z.coerce.date().optional(),
  }),
})

export const generatePayrollSchema = z.object({
  body: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000),
    employeeId: z.string().uuid().optional(),
    bonus: z.coerce.number().min(0).default(0),
    deductions: z.coerce.number().min(0).default(0),
  }),
})

export const updatePayrollStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['paid', 'unpaid']),
  }),
})
