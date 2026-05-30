import { Router } from 'express'
import {
  attendanceHistory,
  clockIn,
  clockOut,
  dailyAttendance,
} from '../../controllers/attendance.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { tenantScope } from '../../middleware/tenant.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { attendanceActionSchema, attendanceHistorySchema } from '../../validators/attendance.schema.js'

const router = Router()

router.use(authenticate, tenantScope)

router.post('/clock-in', authorize('admin', 'HR', 'staff'), validate(attendanceActionSchema), clockIn)
router.post('/clock-out', authorize('admin', 'HR', 'staff'), validate(attendanceActionSchema), clockOut)
router.get('/daily', authorize('admin', 'HR'), dailyAttendance)
router.get('/employees/:employeeId/history', authorize('admin', 'HR', 'staff'), validate(attendanceHistorySchema), attendanceHistory)

export default router
