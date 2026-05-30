import { Router } from 'express'
import {
  disableCompanyAdmins,
  enableCompanyAdmins,
  getCompany,
  listCompanies,
  reactivateCompany,
  softDeleteCompany,
  suspendCompany,
} from '../../controllers/company.controller.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { companyIdParam, suspendCompanySchema } from '../../validators/company.schema.js'

const router = Router()

router.use(authenticate, authorize('SUPER_ADMIN'))

router.get('/', listCompanies)
router.get('/:id', validate(companyIdParam), getCompany)
router.patch('/:id/suspend', validate(suspendCompanySchema), suspendCompany)
router.patch('/:id/reactivate', validate(companyIdParam), reactivateCompany)
router.patch('/:id/disable-admins', validate(companyIdParam), disableCompanyAdmins)
router.patch('/:id/enable-admins', validate(companyIdParam), enableCompanyAdmins)
router.patch('/:id/soft-delete', validate(companyIdParam), softDeleteCompany)

export default router
