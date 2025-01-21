import { Router } from 'express'
import { login, register } from './auth.controller'

const router = Router()

router.route('/signin').post(login)
router.route('/signup').post(register)

export default router
