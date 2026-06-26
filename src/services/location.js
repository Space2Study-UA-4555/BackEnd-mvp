const {
  countryStateCityApi: { baseUrl, headers, timeout }
} = require('~/configs/config')
const {
  COUNTRY_STATE_CITY_API_ERROR,
  COUNTRY_CODE_REQUIRED,
  STATE_CODE_REQUIRED
} = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')
const logger = require('~/logger/logger')

const safeParseJson = async (response) => {
  try {
    return await response.json()
  } catch (err) {
    // ignore JSON parse error
    return {}
  }
}

const sortByName = (arr) => arr.sort((a, b) => a.name.localeCompare(b.name))

const getCountryData = ({ name, iso2 }) => ({ name, iso2 })
let cachedCountries = null

const getStateData = ({ name, iso2 }) => ({ name, iso2 })
let cachedStates = {}

const getCityData = ({ name }) => ({ name })
let cachedCities = {}

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
        const errorBody = await safeParseJson(response)

        throw createError(response.status, {
          message: errorBody.message,
          code: response.statusText
        })
      }

      const countries = await safeParseJson(response)
      cachedCountries = sortByName(countries.map(getCountryData))

      return cachedCountries
    } catch (error) {
      logger.error(error)
      throw createError(502, COUNTRY_STATE_CITY_API_ERROR)
    }
  },

  getStates: async (countryCode) => {
    try {
      if (!countryCode) {
        throw createError(400, COUNTRY_CODE_REQUIRED)
      }

      if (cachedStates[countryCode]) {
        return cachedStates[countryCode]
      }

      const response = await fetch(`${baseUrl}/countries/${countryCode}/states`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(timeout)
      })

      if (!response.ok) {
        const errorBody = await safeParseJson(response)

        throw createError(response.status, {
          message: errorBody.message,
          code: response.statusText
        })
      }

      const states = await safeParseJson(response)
      cachedStates[countryCode] = sortByName(states.map(getStateData))

      return cachedStates[countryCode]
    } catch (error) {
      logger.error(error)

      if (error.code === COUNTRY_CODE_REQUIRED.code) {
        throw error
      }

      throw createError(502, COUNTRY_STATE_CITY_API_ERROR)
    }
  },

  getCities: async (countryCode, stateCode) => {
    try {
      if (!countryCode) {
        throw createError(400, COUNTRY_CODE_REQUIRED)
      }

      if (!stateCode) {
        throw createError(400, STATE_CODE_REQUIRED)
      }

      const cacheKey = `${countryCode}-${stateCode}`

      if (cachedCities[cacheKey]) {
        return cachedCities[cacheKey]
      }

      const response = await fetch(
        `${baseUrl}/countries/${countryCode}/states/${stateCode}/cities`,
        {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(timeout)
        }
      )

      if (!response.ok) {
        const errorBody = await safeParseJson(response)

        throw createError(response.status, {
          message: errorBody.message,
          code: response.statusText
        })
      }

      const cities = await safeParseJson(response)
      cachedCities[cacheKey] = sortByName(cities.map(getCityData))

      return cachedCities[cacheKey]
    } catch (error) {
      logger.error(error)

      if (
        error.code === COUNTRY_CODE_REQUIRED.code ||
        error.code === STATE_CODE_REQUIRED.code
      ) {
        throw error
      }

      throw createError(502, COUNTRY_STATE_CITY_API_ERROR)
    }
  }
}

module.exports = locationService
