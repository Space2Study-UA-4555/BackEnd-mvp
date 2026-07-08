const {
  countryStateCityApi: { baseUrl, headers, timeout }
} = require('~/configs/config')
const { COUNTRY_STATE_CITY_API_ERROR } = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')
const logger = require('~/logger/logger')

const getCountryData = ({ name, iso2 }) => ({ name, iso2 })
const sortCountriesByName = (countries) =>
  countries.sort((firstCountry, secondCountry) => firstCountry.name.localeCompare(secondCountry.name))

let cachedCountries = null

const locationService = {
  getCountries: async () => {
    try {
      if (cachedCountries) {
        return cachedCountries
      }

      const response = await fetch(`${baseUrl}/countries`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(timeout)
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw createError(response.status, { message: errorBody.message, code: response.statusText })
      }

      const countries = await response.json()

      cachedCountries = sortCountriesByName(countries.map(getCountryData))

      return cachedCountries
    } catch (error) {
      logger.error(error)
      throw createError(502, COUNTRY_STATE_CITY_API_ERROR)
    }
  }
}

module.exports = locationService
