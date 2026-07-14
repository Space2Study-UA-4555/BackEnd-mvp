require('~/initialization/envSetup')

jest.mock('~/configs/config', () => ({
  config: {
    MONGODB_URL: 'foo'
  },
  countryStateCityApi: {
    baseUrl: 'https://test-country-state-city-api.com/v1',
    timeout: 5000,
    headers: {
      'X-CSCAPI-KEY': 'test-api-key'
    }
  }
}))
const errors = require('~/consts/errors')

describe('Location service', () => {
  let locationService

  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn()
    locationService = require('~/services/location')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCountries', () => {
    it('should fetch countries from Country State City API', async () => {
      const countries = [{ name: 'Ukraine', iso2: 'UA' }]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(countries)
      })

      const result = await locationService.getCountries()

      expect(global.fetch).toHaveBeenCalledWith('https://test-country-state-city-api.com/v1/countries', {
        method: 'GET',
        signal: expect.any(AbortSignal),
        headers: {
          'X-CSCAPI-KEY': 'test-api-key'
        }
      })
      expect(result).toEqual([{ name: 'Ukraine', iso2: 'UA' }])
    })

    it('should return country name and iso2 code from API response', async () => {
      const countries = [
        { id: 1, name: 'Afghanistan', iso2: 'AF', iso3: 'AFG', phonecode: '93' },
        { id: 230, name: 'Ukraine', iso2: 'UA', iso3: 'UKR', phonecode: '380' }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(countries)
      })

      const result = await locationService.getCountries()

      expect(result).toEqual([
        { name: 'Afghanistan', iso2: 'AF' },
        { name: 'Ukraine', iso2: 'UA' }
      ])
    })

    it('should return countries sorted by name', async () => {
      const countries = [
        { name: 'Ukraine', iso2: 'UA' },
        { name: 'Afghanistan', iso2: 'AF' }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(countries)
      })

      const result = await locationService.getCountries()

      expect(result).toEqual([
        { name: 'Afghanistan', iso2: 'AF' },
        { name: 'Ukraine', iso2: 'UA' }
      ])
    })

    it('should return cached countries after first API request', async () => {
      const countries = [{ name: 'Ukraine', iso2: 'UA' }]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(countries)
      })

      const firstResult = await locationService.getCountries()
      const secondResult = await locationService.getCountries()

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(firstResult).toEqual(secondResult)
    })

    it('should throw error when Country State City API request fails', async () => {
      const json = jest.fn()

      global.fetch.mockResolvedValue({
        ok: false,
        json
      })

      await expect(locationService.getCountries()).rejects.toMatchObject({
        status: 502,
        code: errors.COUNTRY_STATE_CITY_API_ERROR.code
      })
      expect(json).toHaveBeenCalled()
    })

    it('should throw error when Country State City API request is rejected', async () => {
      const error = new Error('Network error')

      global.fetch.mockRejectedValue(error)

      await expect(locationService.getCountries()).rejects.toMatchObject({
        status: 502,
        code: errors.COUNTRY_STATE_CITY_API_ERROR.code
      })
    })

    it('should throw error when Country State City API response is empty', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([])
      })
      const result = await locationService.getCountries()

      expect(result).toEqual([])
    })
  })

  describe('getStates', () => {
    it('should fetch states from Country State City API', async () => {
      const states = [
        { name: 'Kyivska', iso2: 'KV' },
        { name: 'Lvivska', iso2: 'LV' }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(states)
      })

      const result = await locationService.getStates('UA')

      expect(global.fetch).toHaveBeenCalledWith('https://test-country-state-city-api.com/v1/countries/UA/states', {
        method: 'GET',
        signal: expect.any(AbortSignal),
        headers: {
          'X-CSCAPI-KEY': 'test-api-key'
        }
      })

      expect(result).toEqual([
        { name: 'Kyivska', iso2: 'KV' },
        { name: 'Lvivska', iso2: 'LV' }
      ])
    })

    it('should map name and iso2 from API response', async () => {
      const states = [
        { id: 1, name: 'Kyivska', iso2: 'KV', population: 3000000 },
        { id: 2, name: 'Lvivska', iso2: 'LV', population: 700000 }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(states)
      })

      const result = await locationService.getStates('UA')

      expect(result).toEqual([
        { name: 'Kyivska', iso2: 'KV' },
        { name: 'Lvivska', iso2: 'LV' }
      ])
    })

    it('should return states sorted by name', async () => {
      const states = [
        { name: 'Lvivska', iso2: 'LV' },
        { name: 'Kyivska', iso2: 'KV' }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(states)
      })

      const result = await locationService.getStates('UA')

      expect(result).toEqual([
        { name: 'Kyivska', iso2: 'KV' },
        { name: 'Lvivska', iso2: 'LV' }
      ])
    })

    it('should return cached states after first API request', async () => {
      const states = [{ name: 'Kyivska', iso2: 'KV' }]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(states)
      })

      const first = await locationService.getStates('UA')
      const second = await locationService.getStates('UA')

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(first).toEqual(second)
    })

    it('should throw error when API returns non-ok response', async () => {
      const json = jest.fn().mockResolvedValue({ message: 'Upstream failed' })

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'UNAUTHORIZED',
        json
      })

      await expect(locationService.getStates('UA')).rejects.toMatchObject({
        status: 502,
        code: errors.COUNTRY_STATE_CITY_API_ERROR.code
      })

      expect(json).toHaveBeenCalled()
    })

    it('should throw error when API request is rejected', async () => {
      const error = new Error('Network error')
      global.fetch.mockRejectedValue(error)

      await expect(locationService.getStates('UA')).rejects.toMatchObject({
        status: 502,
        code: errors.COUNTRY_STATE_CITY_API_ERROR.code
      })
    })

    it('should throw error when countryCode is missing', async () => {
      await expect(locationService.getStates(undefined)).rejects.toMatchObject({
        status: 400,
        code: errors.COUNTRY_CODE_REQUIRED.code
      })
    })
  })

  describe('getCities', () => {
    it('should fetch cities from Country State City API', async () => {
      const cities = [{ name: 'Kyiv' }, { name: 'Lviv' }]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(cities)
      })

      const result = await locationService.getCities('UA', 'KV')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-country-state-city-api.com/v1/countries/UA/states/KV/cities',
        {
          method: 'GET',
          signal: expect.any(AbortSignal),
          headers: {
            'X-CSCAPI-KEY': 'test-api-key'
          }
        }
      )

      expect(result).toEqual([{ name: 'Kyiv' }, { name: 'Lviv' }])
    })

    it('should map only name field from API response', async () => {
      const cities = [
        { id: 1, name: 'Kyiv', population: 3000000 },
        { id: 2, name: 'Lviv', population: 700000 }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(cities)
      })

      const result = await locationService.getCities('UA', 'KV')

      expect(result).toEqual([{ name: 'Kyiv' }, { name: 'Lviv' }])
    })

    it('should return cities sorted by name', async () => {
      const cities = [{ name: 'Lviv' }, { name: 'Kyiv' }]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(cities)
      })

      const result = await locationService.getCities('UA', 'KV')

      expect(result).toEqual([{ name: 'Kyiv' }, { name: 'Lviv' }])
    })

    it('should return cached cities after first API request', async () => {
      const cities = [{ name: 'Kyiv' }]

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(cities)
      })

      const first = await locationService.getCities('UA', 'KV')
      const second = await locationService.getCities('UA', 'KV')

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(first).toEqual(second)
    })

    it('should throw error when API returns non-ok response', async () => {
      const json = jest.fn().mockResolvedValue({ message: 'Upstream failed' })

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'UNAUTHORIZED',
        json
      })

      await expect(locationService.getCities('UA', 'KV')).rejects.toMatchObject({
        status: 502,
        code: errors.COUNTRY_STATE_CITY_API_ERROR.code
      })

      expect(json).toHaveBeenCalled()
    })

    it('should throw error when API request is rejected', async () => {
      const error = new Error('Network error')
      global.fetch.mockRejectedValue(error)

      await expect(locationService.getCities('UA', 'KV')).rejects.toMatchObject({
        status: 502,
        code: errors.COUNTRY_STATE_CITY_API_ERROR.code
      })
    })

    it('should throw error when countryCode is missing', async () => {
      await expect(locationService.getCities(undefined, 'KV')).rejects.toMatchObject({
        status: 400,
        code: errors.COUNTRY_CODE_REQUIRED.code
      })
    })

    it('should throw error when stateCode is missing', async () => {
      await expect(locationService.getCities('UA')).rejects.toMatchObject({
        status: 400,
        code: errors.STATE_CODE_REQUIRED.code
      })
    })
  })
})
