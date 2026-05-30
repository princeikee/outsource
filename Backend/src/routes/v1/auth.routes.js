import { Router } from 'express'
import { appeal, login, register } from '../../controllers/auth.controller.js'
import { validate } from '../../middleware/validate.middleware.js'
import { appealSchema, loginSchema, registerSchema } from '../../validators/auth.schema.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/appeal', validate(appealSchema), appeal)

export default router
