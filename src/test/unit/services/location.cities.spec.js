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

describe('Location service — getCities', () => {
  let locationService

  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn()
    locationService = require('~/services/location')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch cities from Country State City API', async () => {
    const cities = [{ name: 'Kyiv' }, { name: 'Lviv' }]

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(cities)
    })

    const result = await locationService.getCities('UA')

    expect(global.fetch).toHaveBeenCalledWith('https://test-country-state-city-api.com/v1/countries/UA/cities', {
      method: 'GET',
      signal: expect.any(AbortSignal),
      headers: {
        'X-CSCAPI-KEY': 'test-api-key'
      }
    })

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

    const result = await locationService.getCities('UA')

    expect(result).toEqual([{ name: 'Kyiv' }, { name: 'Lviv' }])
  })

  it('should return cities sorted by name', async () => {
    const cities = [{ name: 'Lviv' }, { name: 'Kyiv' }]

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(cities)
    })

    const result = await locationService.getCities('UA')

    expect(result).toEqual([{ name: 'Kyiv' }, { name: 'Lviv' }])
  })

  it('should return cached cities after first API request', async () => {
    const cities = [{ name: 'Kyiv' }]

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(cities)
    })

    const first = await locationService.getCities('UA')
    const second = await locationService.getCities('UA')

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

    await expect(locationService.getCities('UA')).rejects.toMatchObject({
      status: 502,
      code: errors.COUNTRY_STATE_CITY_API_ERROR.code
    })

    expect(json).toHaveBeenCalled()
  })

  it('should throw error when API request is rejected', async () => {
    const error = new Error('Network error')
    global.fetch.mockRejectedValue(error)

    await expect(locationService.getCities('UA')).rejects.toMatchObject({
      status: 502,
      code: errors.COUNTRY_STATE_CITY_API_ERROR.code
    })
  })

  it('should throw error when countryCode is missing', async () => {
    await expect(locationService.getCities()).rejects.toMatchObject({
      status: 400,
      code: errors.COUNTRY_CODE_REQUIRED.code
    })
  })
})
