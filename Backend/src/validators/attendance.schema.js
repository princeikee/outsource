import { z } from 'zod'

export const attendanceActionSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid().optional(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    notes: z.string().optional(),
  }),
})

export const attendanceHistorySchema = z.object({
  params: z.object({
    employeeId: z.string().uuid(),
  }),
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
})
