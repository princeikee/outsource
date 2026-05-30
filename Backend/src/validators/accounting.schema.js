import { z } from 'zod'

export const accountingEntrySchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().positive(),
    category: z.string().min(1),
    description: z.string().optional(),
    entryDate: z.coerce.date().optional(),
  }),
})

export const accountingSummarySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
})
