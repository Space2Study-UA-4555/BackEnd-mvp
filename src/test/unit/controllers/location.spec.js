jest.mock('~/services/location')

const locationService = require('~/services/location')
const { getCountries, getCities, getStates } = require('~/controllers/location')

describe('Location controller', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCountries', () => {
    const mockRequest = {}
    let mockResponse

    beforeEach(() => {
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
    })

    it('should return countries with status 200', async () => {
      const countries = [{ name: 'Ukraine', iso2: 'UA' }]

      locationService.getCountries.mockResolvedValue(countries)

      await getCountries(mockRequest, mockResponse)

      expect(locationService.getCountries).toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(countries)
    })

    it('should return empty countries list with status 200', async () => {
      locationService.getCountries.mockResolvedValue([])

      await getCountries(mockRequest, mockResponse)

      expect(locationService.getCountries).toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith([])
    })
  })

  describe('getCities', () => {
    let mockRequest
    let mockResponse

    beforeEach(() => {
      mockRequest = { query: { countryCode: 'UA', stateCode: 'KV' } }
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
    })

    it('should return cities with status 200', async () => {
      const cities = [{ name: 'Kyiv' }]
      locationService.getCities.mockResolvedValue(cities)

      await getCities(mockRequest, mockResponse)

      expect(locationService.getCities).toHaveBeenCalledWith('UA', 'KV')
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(cities)
    })

    it('should return empty cities list with status 200', async () => {
      locationService.getCities.mockResolvedValue([])

      await getCities(mockRequest, mockResponse)

      expect(locationService.getCities).toHaveBeenCalledWith('UA', 'KV')
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith([])
    })
  })

  describe('getStates', () => {
    let mockRequest
    let mockResponse

    beforeEach(() => {
      mockRequest = { query: { countryCode: 'UA' } }
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
    })

    it('should return states with status 200', async () => {
      const states = [{ name: 'Kyivska', iso2: 'KV' }]
      locationService.getStates.mockResolvedValue(states)

      await getStates(mockRequest, mockResponse)

      expect(locationService.getStates).toHaveBeenCalledWith('UA')
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith(states)
    })

    it('should return empty states list with status 200', async () => {
      locationService.getStates.mockResolvedValue([])

      await getStates(mockRequest, mockResponse)

      expect(locationService.getStates).toHaveBeenCalledWith('UA')
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith([])
    })
  })
})
