import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    companyName: z.string().min(2),
    companyEmail: z.string().email().optional(),
    adminName: z.string().min(2),
    adminEmail: z.string().email(),
    password: z.string().min(8),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    companyId: z.string().uuid().optional(),
    companyEmail: z.string().email().optional(),
  }),
})

export const appealSchema = z.object({
  body: z.object({
    companyId: z.string().uuid().optional(),
    email: z.string().email(),
    message: z.string().min(10).max(2000),
  }),
})
