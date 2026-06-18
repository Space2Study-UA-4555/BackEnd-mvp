const {
  countryStateCityApi: { baseUrl, headers, timeout }
} = require('~/configs/config')
const { COUNTRY_STATE_CITY_API_ERROR, COUNTRY_CODE_REQUIRED } = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')
const logger = require('~/logger/logger')

/* -------------------- COUNTRIES -------------------- */

const getCountryData = ({ name, iso2 }) => ({ name, iso2 })

const sortCountriesByName = (countries) => countries.sort((a, b) => a.name.localeCompare(b.name))

let cachedCountries = null

/* -------------------- CITIES -------------------- */

const getCityData = ({ name }) => ({ name })

const sortCitiesByName = (cities) => cities.sort((a, b) => a.name.localeCompare(b.name))

let cachedCities = {} // cache per countryCode

/* -------------------- SERVICE -------------------- */

const locationService = {
  /* -------- COUNTRIES -------- */
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
        let errorBody = {}
        try {
          errorBody = await response.json()
        } catch (_) {
          errorBody = {}
        }

        throw createError(response.status, {
          message: errorBody.message,
          code: response.statusText
        })
      }

      const countries = await response.json()

      cachedCountries = sortCountriesByName(countries.map(getCountryData))

      return cachedCountries
    } catch (error) {
      logger.error(error)
      throw createError(502, COUNTRY_STATE_CITY_API_ERROR)
    }
  },

  /* -------- CITIES -------- */
  getCities: async (countryCode) => {
    try {
      if (!countryCode) {
        throw createError(400, COUNTRY_CODE_REQUIRED)
      }

      if (cachedCities[countryCode]) {
        return cachedCities[countryCode]
      }

      const response = await fetch(`${baseUrl}/countries/${countryCode}/cities`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(timeout)
      })

      if (!response.ok) {
        let errorBody = {}
        try {
          errorBody = await response.json()
        } catch (_) {
          errorBody = {}
        }

        throw createError(response.status, {
          message: errorBody.message,
          code: response.statusText
        })
      }

      const cities = await response.json()

      cachedCities[countryCode] = sortCitiesByName(cities.map(getCityData))

      return cachedCities[countryCode]
    } catch (error) {
      logger.error(error)

      if (error.code === COUNTRY_CODE_REQUIRED.code) {
        throw error
      }

      throw createError(502, COUNTRY_STATE_CITY_API_ERROR)
    }
  }
}

module.exports = locationService
