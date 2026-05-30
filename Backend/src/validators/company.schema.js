import { z } from 'zod'

export const companyIdParam = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const suspendCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().min(5),
  }),
})
