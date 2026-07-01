const mongoose = require('mongoose')

const Offer = require('~/models/offer')

describe('Offer model', () => {
  const objectId = () => new mongoose.Types.ObjectId()

  const getValidOfferData = () => ({
    price: 10,
    proficiencyLevel: 'Beginner',
    title: 'English for beginners',
    description: 'English lessons for beginners',
    languages: ['English'],
    authorRole: 'tutor',
    author: objectId(),
    subject: objectId(),
    category: objectId(),
    FAQ: [
      {
        question: 'How long is the lesson?',
        answer: 'One hour.'
      }
    ]
  })

  it('should validate offer with required fields', () => {
    const offer = new Offer(getValidOfferData())

    const error = offer.validateSync()

    expect(error).toBeUndefined()
  })

  it('should require mandatory fields', () => {
    const offer = new Offer({})

    const error = offer.validateSync()

    expect(error.errors.price).toBeDefined()
    expect(error.errors.proficiencyLevel).toBeDefined()
    expect(error.errors.title).toBeDefined()
    expect(error.errors.description).toBeDefined()
    expect(error.errors.languages).toBeDefined()
    expect(error.errors.authorRole).toBeDefined()
    expect(error.errors.author).toBeDefined()
    expect(error.errors.subject).toBeDefined()
    expect(error.errors.category).toBeDefined()
  })

  it('should require price to be at least 1', () => {
    const offer = new Offer({
      ...getValidOfferData(),
      price: 0
    })

    const error = offer.validateSync()

    expect(error.errors.price).toBeDefined()
  })

  it('should trim title, description and FAQ fields', () => {
    const offer = new Offer({
      ...getValidOfferData(),
      title: '  English for beginners  ',
      description: '  English lessons for beginners  ',
      FAQ: [
        {
          question: '  How long is the lesson?  ',
          answer: '  One hour.  '
        }
      ]
    })

    offer.validateSync()

    expect(offer.title).toBe('English for beginners')
    expect(offer.description).toBe('English lessons for beginners')
    expect(offer.FAQ[0].question).toBe('How long is the lesson?')
    expect(offer.FAQ[0].answer).toBe('One hour.')
  })

  it('should validate title and description max length', () => {
    const offer = new Offer({
      ...getValidOfferData(),
      title: 'a'.repeat(101),
      description: 'a'.repeat(1001)
    })

    const error = offer.validateSync()

    expect(error.errors.title).toBeDefined()
    expect(error.errors.description).toBeDefined()
  })

  it('should require FAQ question and answer when FAQ item exists', () => {
    const offer = new Offer({
      ...getValidOfferData(),
      FAQ: [{}]
    })

    const error = offer.validateSync()

    expect(error.errors['FAQ.0.question']).toBeDefined()
    expect(error.errors['FAQ.0.answer']).toBeDefined()
  })
})
