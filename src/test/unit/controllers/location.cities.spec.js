jest.mock('~/services/location')

const locationService = require('~/services/location')
const { getCities } = require('~/controllers/location')

describe('Location controller — getCities', () => {
  let mockRequest
  let mockResponse

  beforeEach(() => {
    mockRequest = { query: { countryCode: 'UA', stateCode: 'KV' } }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
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
