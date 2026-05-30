import { Router } from 'express'
import { dashboard } from '../../controllers/dashboard.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'

const router = Router()

router.use(authenticate, tenantScope)
router.get('/', authorize('admin', 'HR'), dashboard)

export default router
