const router = require('express').Router()

const Question = require('~/models/question')

const quizController = require('~/controllers/quiz')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const isEntityValid = require('~/middlewares/entityValidation')
const idValidation = require('~/middlewares/idValidation')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')

const {
  roles: { TUTOR }
} = require('~/consts/auth')

router.use(authMiddleware)
router.param('id', idValidation)
const params = [{ model: Question, idName: 'id' }]

router.get('/:id', isEntityValid({ params }), asyncWrapper(quizController.getQuizById))

router.use(restrictTo(TUTOR))
router.delete('/:id', isEntityValid({ params }), asyncWrapper(quizController.deleteQuiz))

module.exports = router
