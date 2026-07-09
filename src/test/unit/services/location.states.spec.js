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

describe('Location service — getStates', () => {
  let locationService

  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn()
    locationService = require('~/services/location')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch states from Country State City API', async () => {
    const states = [{ name: 'Kyivska' }, { name: 'Lvivska' }]

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

    expect(result).toEqual([{ name: 'Kyivska' }, { name: 'Lvivska' }])
  })

  it('should map only name field from API response', async () => {
    const states = [
      { id: 1, name: 'Kyivska', population: 3000000 },
      { id: 2, name: 'Lvivska', population: 700000 }
    ]

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(states)
    })

    const result = await locationService.getStates('UA')

    expect(result).toEqual([{ name: 'Kyivska' }, { name: 'Lvivska' }])
  })

  it('should return states sorted by name', async () => {
    const states = [{ name: 'Lvivska' }, { name: 'Kyivska' }]

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(states)
    })

    const result = await locationService.getStates('UA')

    expect(result).toEqual([{ name: 'Kyivska' }, { name: 'Lvivska' }])
  })

  it('should return cached states after first API request', async () => {
    const states = [{ name: 'Kyivska' }]

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
