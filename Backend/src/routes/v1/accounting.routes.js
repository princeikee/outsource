import { Router } from 'express'
import { createEntry, listEntries, summary } from '../../controllers/accounting.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { accountingEntrySchema, accountingSummarySchema } from '../../validators/accounting.schema.js'

const router = Router()

router.use(authenticate, tenantScope)

router.get('/', authorize('admin', 'HR'), listEntries)
router.post('/', authorize('admin'), validate(accountingEntrySchema), createEntry)
router.get('/summary', authorize('admin', 'HR'), validate(accountingSummarySchema), summary)

export default router
