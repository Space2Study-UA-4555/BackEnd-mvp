const router = require('express').Router()
const asyncWrapper = require('~/middlewares/asyncWrapper')
const isEntityValid = require('~/middlewares/entityValidation')
const idValidation = require('~/middlewares/idValidation')
const Category = require('~/models/category')

const {
  roles: { ADMIN }
} = require('~/consts/auth')

const category = require('~/controllers/category')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')

router.use(authMiddleware)
router.param('id', idValidation)
const params = [{ model: Category, idName: 'id' }]

router.get('/', asyncWrapper(category.getCategories))
router.get('/names', asyncWrapper(category.getCategoryNames))
router.get('/:id', isEntityValid({ params }), asyncWrapper(category.getCategoryById))
router.get('/:id/subjects/names', isEntityValid({ params }), asyncWrapper(category.getSubjectNamesByCategoryId))

router.use(restrictTo(ADMIN))
router.post('/', asyncWrapper(category.createCategory))

module.exports = router
