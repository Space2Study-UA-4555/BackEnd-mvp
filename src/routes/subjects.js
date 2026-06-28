const router = require('express').Router()

const Category = require('~/models/category')
const Subject = require('~/models/subject')

const subjectsController = require('~/controllers/subjects')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const isEntityValid = require('~/middlewares/entityValidation')
const idValidation = require('~/middlewares/idValidation')
const validationMiddleware = require('~/middlewares/validation')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')
const { subjectValidationSchema, updateSubjectValidationSchema } = require('~/validation/schemas/subject')

const body = [{ model: Category, idName: 'category' }]
const params = [{ model: Subject, idName: 'id' }]

const {
  roles: { ADMIN }
} = require('~/consts/auth')

router.use(authMiddleware)
router.param('id', idValidation)

router.get('/', asyncWrapper(subjectsController.getSubjects))
router.get('/:id', isEntityValid({ params }), asyncWrapper(subjectsController.getSubjectById))

router.post(
  '/',
  restrictTo(ADMIN),
  validationMiddleware(subjectValidationSchema),
  isEntityValid({ body }),
  asyncWrapper(subjectsController.createSubject)
)

router.patch(
  '/:id',
  restrictTo(ADMIN),
  validationMiddleware(updateSubjectValidationSchema),
  isEntityValid({ params, body }),
  asyncWrapper(subjectsController.updateSubject)
)

module.exports = router
