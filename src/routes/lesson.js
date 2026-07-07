const router = require('express').Router()

const Lesson = require('~/models/lesson')

const lessonController = require('~/controllers/lesson')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const isEntityValid = require('~/middlewares/entityValidation')
const idValidation = require('~/middlewares/idValidation')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')

const {
  roles: { TUTOR }
} = require('~/consts/auth')

router.use(authMiddleware)
router.param('id', idValidation)
const params = [{ model: Lesson, idName: 'id' }]

router.get('/', asyncWrapper(lessonController.getLessons))
router.get('/:id', isEntityValid({ params }), asyncWrapper(lessonController.getLessonById))
router.use(restrictTo(TUTOR))
router.post('/', asyncWrapper(lessonController.createLesson))
router.delete('/:id', isEntityValid({ params }), asyncWrapper(lessonController.deleteLesson))
router.patch('/:id', isEntityValid({ params }), asyncWrapper(lessonController.updateLesson))

module.exports = router
