import { z } from 'zod'

export const employeeIdParam = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    department: z.string().optional(),
    jobTitle: z.string().optional(),
    hireDate: z.coerce.date().optional(),
    salary: z.coerce.number().positive().optional(),
    currency: z.string().min(3).max(3).default('NGN'),
    createUser: z.coerce.boolean().default(true),
    password: z.string().min(8).optional(),
    userRole: z.enum(['EMPLOYEE', 'staff', 'employee']).default('EMPLOYEE'),
  }).refine((data) => data.name || (data.firstName && data.lastName), {
    message: 'Provide name or firstName and lastName',
  }),
})

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    department: z.string().optional(),
    jobTitle: z.string().optional(),
    hireDate: z.coerce.date().optional(),
    salary: z.coerce.number().positive().optional(),
    currency: z.string().min(3).max(3).default('NGN'),
    isActive: z.boolean().optional(),
  }),
})

export const employeeLoginStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    enabled: z.boolean(),
  }),
})

export const resetEmployeePasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    password: z.string().min(8),
  }),
})

export const assignRoleDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    role: z.string().optional(),
    department: z.string().optional(),
  }).refine((data) => data.role || data.department, {
    message: 'Provide role or department',
  }),
})
