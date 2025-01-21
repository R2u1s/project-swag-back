import { Router } from 'express'
import { findOne, findMany, createOne, deleteOne, updateOne, findClassesByCourse } from './example.controller.js'

const router = Router()

router.route('/').get(findMany).post(createOne)
router.route('/:id').get(findOne).delete(deleteOne).patch(updateOne)
router.route('/:id/classes').get(findClassesByCourse)

export default router
