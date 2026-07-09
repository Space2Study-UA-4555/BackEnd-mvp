require('~/initialization/envSetup')

jest.mock('~/services/offer')
jest.mock('~/utils/offers/offerAggregateOptions')

const offerService = require('~/services/offer')
const offerAggregateOptions = require('~/utils/offers/offerAggregateOptions')
const { getOffers, getOfferById, createOffer, updateOffer, deleteOffer } = require('~/controllers/offer')

describe('Offer controller', () => {
  let mockResponse

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should get offers and return status 200', async () => {
    const mockPipeline = [{ $match: { title: 'English' } }]
    const mockRequest = {
      query: { title: 'English' },
      params: {},
      user: {
        id: 'authorId'
      }
    }
    const offersResponse = { items: [{ _id: 'offerId', title: 'English' }], count: 1 }

    offerAggregateOptions.mockReturnValue(mockPipeline)
    offerService.getOffers.mockResolvedValue(offersResponse)

    await getOffers(mockRequest, mockResponse)

    expect(offerAggregateOptions).toHaveBeenCalledWith(mockRequest.query, mockRequest.params)
    expect(offerService.getOffers).toHaveBeenCalledWith(mockPipeline)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith(offersResponse)
  })

  it('should get offer by id and return status 200', async () => {
    const mockRequest = { params: { id: 'offerId' }, user: { id: 'authorId' } }
    const offerResponse = { _id: 'offerId', title: 'English' }

    offerService.getOfferById.mockResolvedValue(offerResponse)

    await getOfferById(mockRequest, mockResponse)

    expect(offerService.getOfferById).toHaveBeenCalledWith('offerId')
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith(offerResponse)
  })

  it('should create offer and return status 201', async () => {
    const mockRequest = {
      user: { id: 'authorId', role: 'tutor' },
      body: { title: 'English lessons', price: 100 }
    }
    const createdOffer = { _id: 'offerId', title: 'English lessons', price: 100 }

    offerService.createOffer.mockResolvedValue(createdOffer)

    await createOffer(mockRequest, mockResponse)

    expect(offerService.createOffer).toHaveBeenCalledWith('authorId', 'tutor', mockRequest.body)
    expect(mockResponse.status).toHaveBeenCalledWith(201)
    expect(mockResponse.json).toHaveBeenCalledWith(createdOffer)
  })

  it('should update offer and return status 204', async () => {
    const mockRequest = {
      params: { id: 'offerId' },
      user: { id: 'authorId' },
      body: { title: 'Updated English lessons' }
    }

    offerService.updateOffer.mockResolvedValue()

    await updateOffer(mockRequest, mockResponse)

    expect(offerService.updateOffer).toHaveBeenCalledWith('offerId', 'authorId', mockRequest.body)
    expect(mockResponse.status).toHaveBeenCalledWith(204)
    expect(mockResponse.end).toHaveBeenCalled()
  })

  it('should delete offer and return status 204', async () => {
    const mockRequest = {
      params: { id: 'offerId' },
      user: { id: 'authorId' }
    }

    offerService.deleteOffer.mockResolvedValue()

    await deleteOffer(mockRequest, mockResponse)

    expect(offerService.deleteOffer).toHaveBeenCalledWith('offerId', 'authorId')
    expect(mockResponse.status).toHaveBeenCalledWith(204)
    expect(mockResponse.end).toHaveBeenCalled()
  })
})
