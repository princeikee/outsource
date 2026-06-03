import { Router } from 'express'
import { settings, updateCompany, updatePassword, updateProfile } from '../../controllers/settings.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'
import { updateCompanySettingsSchema, updatePasswordSchema, updateProfileSchema } from '../../validators/settings.schema.js'

const router = Router()

router.use(authenticate)

router.get('/', settings)
router.patch('/profile', validate(updateProfileSchema), updateProfile)
router.patch('/company', validate(updateCompanySettingsSchema), updateCompany)
router.patch('/password', validate(updatePasswordSchema), updatePassword)

export default router
