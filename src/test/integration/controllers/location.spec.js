require('~/initialization/envSetup')

jest.mock('~/configs/config', () => {
  const actual = jest.requireActual('~/configs/config')

  return {
    ...actual,
    countryStateCityApi: {
      baseUrl: 'https://test-country-state-city-api.com/v1',
      timeout: 5000,
      headers: {
        'X-CSCAPI-KEY': 'test-api-key'
      }
    }
  }
})

const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { COUNTRY_CODE_REQUIRED, STATE_CODE_REQUIRED, COUNTRY_STATE_CITY_API_ERROR } = require('~/consts/errors')

const countriesUrl = '/locations/countries'
const statesUrl = '/locations/states'
const citiesUrl = '/locations/cities'

describe('Location controller', () => {
  let app, server

  const mockFailedFetch = () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Upstream failed' })
    })
  }

  const mockSuccessfulFetch = (data) => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(data)
    })
  }

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  // Run 502 tests before 200 tests — location service caches successful responses in memory.
  describe(`GET ${countriesUrl}`, () => {
    it('should throw COUNTRY_STATE_CITY_API_ERROR when API request fails', async () => {
      mockFailedFetch()

      const response = await app.get(countriesUrl)

      expectError(502, COUNTRY_STATE_CITY_API_ERROR, response)
    })

    it('should return countries with name and iso2', async () => {
      mockSuccessfulFetch([
        { name: 'Ukraine', iso2: 'UA' },
        { name: 'Poland', iso2: 'PL' }
      ])

      const response = await app.get(countriesUrl)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual([
        { name: 'Poland', iso2: 'PL' },
        { name: 'Ukraine', iso2: 'UA' }
      ])
    })
  })

  describe(`GET ${statesUrl}`, () => {
    it('should throw COUNTRY_CODE_REQUIRED when countryCode is missing', async () => {
      const response = await app.get(statesUrl)

      expectError(400, COUNTRY_CODE_REQUIRED, response)
    })

    it('should throw COUNTRY_STATE_CITY_API_ERROR when API request fails', async () => {
      mockFailedFetch()

      const response = await app.get(`${statesUrl}?countryCode=UA`)

      expectError(502, COUNTRY_STATE_CITY_API_ERROR, response)
    })

    it('should return states with name and iso2', async () => {
      mockSuccessfulFetch([
        { name: 'Lvivska', iso2: 'LV' },
        { name: 'Kyivska', iso2: 'KV' }
      ])

      const response = await app.get(`${statesUrl}?countryCode=UA`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual([
        { name: 'Kyivska', iso2: 'KV' },
        { name: 'Lvivska', iso2: 'LV' }
      ])
    })
  })

  describe(`GET ${citiesUrl}`, () => {
    it('should throw COUNTRY_CODE_REQUIRED when countryCode is missing', async () => {
      const response = await app.get(`${citiesUrl}?stateCode=KV`)

      expectError(400, COUNTRY_CODE_REQUIRED, response)
    })

    it('should throw STATE_CODE_REQUIRED when stateCode is missing', async () => {
      const response = await app.get(`${citiesUrl}?countryCode=UA`)

      expectError(400, STATE_CODE_REQUIRED, response)
    })

    it('should throw COUNTRY_STATE_CITY_API_ERROR when API request fails', async () => {
      mockFailedFetch()

      const response = await app.get(`${citiesUrl}?countryCode=UA&stateCode=KV`)

      expectError(502, COUNTRY_STATE_CITY_API_ERROR, response)
    })

    it('should return cities with name', async () => {
      mockSuccessfulFetch([{ name: 'Lviv' }, { name: 'Kyiv' }])

      const response = await app.get(`${citiesUrl}?countryCode=UA&stateCode=KV`)

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual([{ name: 'Kyiv' }, { name: 'Lviv' }])
    })
  })
})
