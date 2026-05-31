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
    officeLatitude: optionalNumber(z.coerce.number().min(-90).max(90)),
    officeLongitude: optionalNumber(z.coerce.number().min(-180).max(180)),
    officeRadiusMeters: optionalNumber(z.coerce.number().int().min(10).max(5000)),
  }),
})
