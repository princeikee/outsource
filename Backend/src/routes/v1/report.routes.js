import { Router } from 'express'
import { generateReport } from '../../controllers/report.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { reportQuerySchema } from '../../validators/report.schema.js'

const router = Router()

router.use(authenticate, tenantScope)

router.get('/', authorize('admin', 'HR'), validate(reportQuerySchema), generateReport)

export default router
