jest.mock('~/models/offer', () => ({
  aggregate: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndRemove: jest.fn(),
  modelName: 'Offer'
}))

const Offer = require('~/models/offer')
const offerService = require('~/services/offer')
const { DOCUMENT_NOT_FOUND, FORBIDDEN } = require('~/consts/errors')

describe('Offer service', () => {
  const offerId = 'offerId'
  const authorId = 'authorId'
  const notInvolvedUserId = 'notInvolvedUserId'

  const getFindByIdChain = (offer) => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(offer)
    }

    Offer.findById.mockReturnValue(chain)

    return chain
  }

  const getRemoveChain = () => {
    const chain = {
      exec: jest.fn().mockResolvedValue()
    }

    Offer.findByIdAndRemove.mockReturnValue(chain)

    return chain
  }

  const getOffer = (overrides = {}) => ({
    _id: offerId,
    author: {
      toString: jest.fn().mockReturnValue(authorId),
      FAQ: {
        tutor: [{ question: 'Question', answer: 'Answer' }]
      }
    },
    authorRole: 'tutor',
    title: 'English',
    validate: jest.fn().mockResolvedValue(),
    save: jest.fn().mockResolvedValue(),
    ...overrides
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create new offer', async () => {
    const data = {
      price: 100,
      proficiencyLevel: 'Beginner',
      title: 'English',
      description: 'English lessons',
      languages: ['English'],
      subject: 'subjectId',
      category: 'categoryId',
      status: 'active',
      FAQ: [{ question: 'Question', answer: 'Answer' }]
    }
    const createdOffer = {
      _id: offerId,
      author: authorId,
      authorRole: 'tutor',
      ...data
    }

    Offer.create.mockResolvedValue(createdOffer)

    const result = await offerService.createOffer(authorId, 'tutor', data)

    expect(Offer.create).toHaveBeenCalledWith({
      author: authorId,
      authorRole: 'tutor',
      ...data
    })
    expect(result).toBe(createdOffer)
  })

  it('should get all offers', async () => {
    const pipeline = [{ $match: { title: 'English' } }]
    const response = {
      items: [{ _id: offerId, title: 'English' }],
      count: 1
    }
    const aggregateChain = {
      exec: jest.fn().mockResolvedValue([response])
    }

    Offer.aggregate.mockReturnValue(aggregateChain)

    const result = await offerService.getOffers(pipeline)

    expect(Offer.aggregate).toHaveBeenCalledWith(pipeline)
    expect(aggregateChain.exec).toHaveBeenCalled()
    expect(result).toBe(response)
  })

  it('should get an offer by ID', async () => {
    const offer = getOffer()
    const expectedFAQ = offer.author.FAQ.tutor
    const findByIdChain = getFindByIdChain(offer)

    const result = await offerService.getOfferById(offerId)

    expect(Offer.findById).toHaveBeenCalledWith(offerId)
    expect(findByIdChain.populate).toHaveBeenCalledWith([
      {
        path: 'author',
        select: ['firstName', 'lastName', 'totalReviews', 'averageRating', 'photo', 'professionalSummary', 'FAQ']
      },
      { path: 'subject', select: 'name' },
      { path: 'category', select: 'appearance' }
    ])
    expect(findByIdChain.lean).toHaveBeenCalled()
    expect(result.author.FAQ).toEqual(expectedFAQ)
  })

  it('should throw DOCUMENT_NOT_FOUND when offer does not exist', async () => {
    getFindByIdChain(null)

    await expect(offerService.getOfferById(offerId)).rejects.toMatchObject({
      status: 404,
      code: DOCUMENT_NOT_FOUND(['Offer']).code
    })
  })

  it('should update offer when current user is offer author', async () => {
    const offer = getOffer()
    const updateData = {
      title: 'Updated title',
      unknownField: 'ignored'
    }

    getFindByIdChain(offer)

    await offerService.updateOffer(offerId, authorId, updateData)

    expect(Offer.findById).toHaveBeenCalledWith(offerId)
    expect(offer.title).toBe(updateData.title)
    expect(offer.unknownField).toBeUndefined()
    expect(offer.validate).toHaveBeenCalled()
    expect(offer.save).toHaveBeenCalled()
  })

  it('should throw DOCUMENT_NOT_FOUND when updating non-existent offer', async () => {
    getFindByIdChain(null)

    await expect(offerService.updateOffer(offerId, authorId, { title: 'Updated title' })).rejects.toMatchObject({
      status: 404,
      code: DOCUMENT_NOT_FOUND(['Offer']).code
    })
  })

  it('should throw FORBIDDEN when not involved user tries to update offer', async () => {
    const offer = getOffer()

    getFindByIdChain(offer)

    await expect(
      offerService.updateOffer(offerId, notInvolvedUserId, { title: 'Updated title' })
    ).rejects.toMatchObject({
      status: 403,
      code: FORBIDDEN.code
    })
    expect(offer.save).not.toHaveBeenCalled()
  })

  it('should delete offer when current user is offer author', async () => {
    const offer = getOffer()
    const removeChain = getRemoveChain()

    getFindByIdChain(offer)

    await offerService.deleteOffer(offerId, authorId)

    expect(Offer.findById).toHaveBeenCalledWith(offerId)
    expect(Offer.findByIdAndRemove).toHaveBeenCalledWith(offerId)
    expect(removeChain.exec).toHaveBeenCalled()
  })

  it('should throw DOCUMENT_NOT_FOUND when deleting non-existent offer', async () => {
    getFindByIdChain(null)

    await expect(offerService.deleteOffer(offerId, authorId)).rejects.toMatchObject({
      status: 404,
      code: DOCUMENT_NOT_FOUND(['Offer']).code
    })
    expect(Offer.findByIdAndRemove).not.toHaveBeenCalled()
  })

  it('should throw FORBIDDEN when not involved user tries to delete offer', async () => {
    const offer = getOffer()

    getFindByIdChain(offer)

    await expect(offerService.deleteOffer(offerId, notInvolvedUserId)).rejects.toMatchObject({
      status: 403,
      code: FORBIDDEN.code
    })
    expect(Offer.findByIdAndRemove).not.toHaveBeenCalled()
  })
})
