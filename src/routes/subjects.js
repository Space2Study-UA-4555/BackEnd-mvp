const router = require('express').Router()

const Category = require('~/models/category')

const subjectsController = require('~/controllers/subjects')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const isEntityValid = require('~/middlewares/entityValidation')
const validationMiddleware = require('~/middlewares/validation')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')
const subjectValidationSchema = require('~/validation/schemas/subject')

const body = [{ model: Category, idName: 'category' }]

const {
  roles: { ADMIN }
} = require('~/consts/auth')

router.use(authMiddleware)

router.get('/', asyncWrapper(subjectsController.getSubjects))

router.post(
  '/',
  restrictTo(ADMIN),
  validationMiddleware(subjectValidationSchema),
  isEntityValid({ body }),
  asyncWrapper(subjectsController.createSubject)
)

module.exports = router
