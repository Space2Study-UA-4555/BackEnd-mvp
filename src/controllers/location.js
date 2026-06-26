const locationService = require('~/services/location')

const getCountries = async (req, res, next) => {
  try {
    const countries = await locationService.getCountries()
    res.status(200).json(countries)
  } catch (error) {
    next(error)
  }
}

const getStates = async (req, res, next) => {
  try {
    const { countryCode } = req.query
    const states = await locationService.getStates(countryCode)
    res.status(200).json(states)
  } catch (error) {
    next(error)
  }
}

const getCities = async (req, res, next) => {
  try {
    const { countryCode, stateCode } = req.query
    const cities = await locationService.getCities(countryCode, stateCode)
    res.status(200).json(cities)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCountries,
  getStates,
  getCities
}
