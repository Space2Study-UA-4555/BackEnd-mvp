const router = require('express').Router()

const asyncWrapper = require('~/middlewares/asyncWrapper')

const {
  roles: { ADMIN }
} = require('~/consts/auth')

const category = require('~/controllers/category')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')

router.use(authMiddleware)

router.get('/', asyncWrapper(category.getCategories))
router.get('/names', asyncWrapper(category.getCategoryNames))

router.use(restrictTo(ADMIN))
router.post('/', asyncWrapper(category.createCategory))

module.exports = router
