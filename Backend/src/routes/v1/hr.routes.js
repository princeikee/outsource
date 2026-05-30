import { Router } from 'express'
import { createPosition, overview } from '../../controllers/hr.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'

const router = Router()

router.use(authenticate, tenantScope)
router.get('/', authorize('admin', 'HR'), overview)
router.post('/positions', authorize('admin', 'HR'), createPosition)

export default router
