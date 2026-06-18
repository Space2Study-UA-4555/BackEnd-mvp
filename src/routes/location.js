const router = require('express').Router()
const asyncWrapper = require('~/middlewares/asyncWrapper')
const locationController = require('~/controllers/location')

/* -------- COUNTRIES -------- */
router.get('/countries', asyncWrapper(locationController.getCountries))

/* -------- CITIES -------- */
router.get('/cities', asyncWrapper(locationController.getCities))

module.exports = router
