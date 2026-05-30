import { z } from 'zod'

export const createLeaveRequestSchema = z.object({
  body: z.object({
    type: z.string().min(2),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().max(1000).optional(),
  }),
})

export const listLeaveRequestsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
})

export const reviewLeaveRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    note: z.string().max(1000).optional(),
  }),
})
