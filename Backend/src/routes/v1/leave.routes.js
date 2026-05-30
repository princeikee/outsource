import { Router } from 'express'
import {
  createLeaveRequest,
  listLeaveRequests,
  myLeaveRequests,
  reviewLeaveRequest,
} from '../../controllers/leave.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import {
  createLeaveRequestSchema,
  listLeaveRequestsSchema,
  reviewLeaveRequestSchema,
} from '../../validators/leave.schema.js'

const router = Router()

router.use(authenticate, tenantScope)

router.get('/me', authorize('staff', 'employee'), myLeaveRequests)
router.post('/', authorize('staff', 'employee'), validate(createLeaveRequestSchema), createLeaveRequest)
router.get('/', authorize('admin', 'HR'), validate(listLeaveRequestsSchema), listLeaveRequests)
router.patch('/:id/review', authorize('admin', 'HR'), validate(reviewLeaveRequestSchema), reviewLeaveRequest)

export default router
