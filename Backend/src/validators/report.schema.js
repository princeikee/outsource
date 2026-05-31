import { z } from 'zod'

export const reportQuerySchema = z.object({
  query: z.object({
    module: z.enum(['hr', 'payroll', 'accounting', 'attendance', 'leave']).default('hr'),
    range: z.enum(['today', 'this_week', 'this_month', 'last_month', 'this_year', 'custom']).default('this_month'),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
})
