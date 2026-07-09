jest.mock('~/services/location')

const locationService = require('~/services/location')
const { getCountries } = require('~/controllers/location')

describe('Location controller', () => {
  const mockRequest = {}
  let mockResponse

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
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
