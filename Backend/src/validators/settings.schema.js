import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2),
  }),
})

export const updateCompanySettingsSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
  }),
})
