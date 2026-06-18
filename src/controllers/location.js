const locationService = require('~/services/location')

/* -------- COUNTRIES -------- */
const getCountries = async (req, res) => {
  const countries = await locationService.getCountries()
  res.status(200).json(countries)
}

/* -------- CITIES -------- */
const getCities = async (req, res) => {
  const { countryCode } = req.query
  const cities = await locationService.getCities(countryCode)
  res.status(200).json(cities)
}

module.exports = {
  getCountries,
  getCities
}
