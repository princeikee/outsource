import { Router } from 'express'
import {
  assignRoleDepartment,
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  resetEmployeePassword,
  setEmployeeLoginEnabled,
  updateEmployee,
} from '../../controllers/employee.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import {
  assignRoleDepartmentSchema,
  createEmployeeSchema,
  employeeLoginStatusSchema,
  employeeIdParam,
  resetEmployeePasswordSchema,
  updateEmployeeSchema,
} from '../../validators/employee.schema.js'

const router = Router()

router.use(authenticate, tenantScope)

router.get('/', authorize('admin', 'HR'), listEmployees)
router.post('/', authorize('admin', 'HR'), validate(createEmployeeSchema), createEmployee)
router.get('/:id', authorize('admin', 'HR'), validate(employeeIdParam), getEmployee)
router.patch('/:id', authorize('admin', 'HR'), validate(updateEmployeeSchema), updateEmployee)
router.patch('/:id/assignment', authorize('admin', 'HR'), validate(assignRoleDepartmentSchema), assignRoleDepartment)
router.patch('/:id/login', authorize('admin'), validate(employeeLoginStatusSchema), setEmployeeLoginEnabled)
router.post('/:id/reset-password', authorize('admin'), validate(resetEmployeePasswordSchema), resetEmployeePassword)
router.delete('/:id', authorize('admin'), validate(employeeIdParam), deleteEmployee)

export default router
