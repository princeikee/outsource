import { Router } from 'express'
import { settings, updateCompany, updateProfile } from '../../controllers/settings.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { updateCompanySettingsSchema, updateProfileSchema } from '../../validators/settings.schema.js'

const router = Router()

router.use(authenticate)

router.get('/', settings)
router.patch('/profile', validate(updateProfileSchema), updateProfile)
router.patch('/company', validate(updateCompanySettingsSchema), updateCompany)

export default router
