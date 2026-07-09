const locationService = require('~/services/location')

const getCountries = async (req, res) => {
  const countries = await locationService.getCountries()
  res.status(200).json(countries)
}

const getStates = async (req, res) => {
  const { countryCode } = req.query
  const states = await locationService.getStates(countryCode)
  res.status(200).json(states)
}

const getCities = async (req, res) => {
  const { countryCode, stateCode } = req.query
  const cities = await locationService.getCities(countryCode, stateCode)
  res.status(200).json(cities)
}

module.exports = {
  getCountries,
  getStates,
  getCities
}
