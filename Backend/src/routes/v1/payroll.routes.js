import { Router } from 'express'
import {
  assignSalary,
  generatePayroll,
  listPayroll,
  myPayroll,
  updatePayrollStatus,
} from '../../controllers/payroll.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import {
  assignSalarySchema,
  generatePayrollSchema,
  updatePayrollStatusSchema,
} from '../../validators/payroll.schema.js'

const router = Router()

router.use(authenticate, tenantScope)

router.get('/me', authorize('staff', 'employee'), myPayroll)
router.get('/', authorize('admin', 'HR'), listPayroll)
router.post('/salary', authorize('admin', 'HR'), validate(assignSalarySchema), assignSalary)
router.post('/generate', authorize('admin', 'HR'), validate(generatePayrollSchema), generatePayroll)
router.patch('/:id/status', authorize('admin', 'HR'), validate(updatePayrollStatusSchema), updatePayrollStatus)

export default router
