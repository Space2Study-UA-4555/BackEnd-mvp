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
