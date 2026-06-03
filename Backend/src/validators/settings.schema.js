import { z } from 'zod'

const optionalNumber = (schema) => z.preprocess((value) => (value === '' ? undefined : value), schema.optional().nullable())

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2),
  }),
})

export const updateCompanySettingsSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    defaultCurrency: z.string().min(3).max(3).default('NGN'),
    timezone: z.string().min(3).default('Africa/Lagos'),
    workStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
    lateGraceMinutes: z.coerce.number().int().min(0).max(120).default(0),
    officeLatitude: optionalNumber(z.coerce.number().min(-90).max(90)),
    officeLongitude: optionalNumber(z.coerce.number().min(-180).max(180)),
    officeRadiusMeters: optionalNumber(z.coerce.number().int().min(10).max(5000)),
  }),
})

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
})
