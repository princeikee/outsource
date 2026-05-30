import { Router } from 'express'
import accountingRoutes from './v1/accounting.routes.js'
import attendanceRoutes from './v1/attendance.routes.js'
import authRoutes from './v1/auth.routes.js'
import companyRoutes from './v1/company.routes.js'
import dashboardRoutes from './v1/dashboard.routes.js'
import employeeRoutes from './v1/employee.routes.js'
import hrRoutes from './v1/hr.routes.js'
import leaveRoutes from './v1/leave.routes.js'
import payrollRoutes from './v1/payroll.routes.js'
import settingsRoutes from './v1/settings.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/companies', companyRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/employees', employeeRoutes)
router.use('/hr', hrRoutes)
router.use('/leave', leaveRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/payroll', payrollRoutes)
router.use('/accounting', accountingRoutes)
router.use('/settings', settingsRoutes)

export default router
