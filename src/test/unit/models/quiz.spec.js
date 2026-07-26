const mongoose = require('mongoose')

const Quiz = require('~/models/quiz')
const {
  enums: { RESOURCES_TYPES_ENUM }
} = require('~/consts/validation')

describe('Quiz model', () => {
  const objectId = () => new mongoose.Types.ObjectId()

  const getValidQuizData = () => ({
    title: 'JavaScript Basics',
    description: 'A quick quiz covering JS fundamentals.',
    items: [objectId()],
    author: objectId(),
    category: objectId(),
    resourceType: RESOURCES_TYPES_ENUM[3],
    settings: {}
  })

  it('should validate quiz with valid data', () => {
    const quiz = new Quiz(getValidQuizData())

    const error = quiz.validateSync()

    expect(error).toBeUndefined()
  })

  it('should require mandatory fields', () => {
    const quiz = new Quiz({})

    const error = quiz.validateSync()

    expect(error.errors.title).toBeDefined()
    expect(error.errors.items).toBeUndefined()
    expect(error.errors.author).toBeDefined()
    expect(error.errors.resourceType).toBeUndefined()
  })

  it('should trim title and description fields', () => {
    const quiz = new Quiz({
      ...getValidQuizData(),
      title: '  JavaScript Basics  ',
      description: '  A quick quiz covering JS fundamentals.  '
    })

    quiz.validateSync()

    expect(quiz.title).toBe('JavaScript Basics')
    expect(quiz.description).toBe('A quick quiz covering JS fundamentals.')
  })

  it('should validate title and description max length', () => {
    const quiz = new Quiz({
      ...getValidQuizData(),
      title: 'a'.repeat(101),
      description: 'a'.repeat(151)
    })

    const error = quiz.validateSync()

    expect(error.errors.title).toBeDefined()
    expect(error.errors.description).toBeDefined()
  })

  it('should set default resourceType', () => {
    const quiz = new Quiz({
      title: 'Test Quiz',
      items: [objectId()],
      author: objectId()
    })

    expect(quiz.resourceType).toBe(RESOURCES_TYPES_ENUM[3])
  })

  it('should reject invalid resourceType', () => {
    const quiz = new Quiz({
      ...getValidQuizData(),
      resourceType: 'invalidType'
    })

    const error = quiz.validateSync()

    expect(error.errors.resourceType).toBeDefined()
  })

  it('should set default settings', () => {
    const quiz = new Quiz({
      title: 'Test Quiz',
      items: [objectId()],
      author: objectId()
    })

    expect(quiz.settings).toEqual({})
  })

  it('should validate without category', () => {
    const quizData = getValidQuizData()
    delete quizData.category

    const quiz = new Quiz(quizData)

    const error = quiz.validateSync()

    expect(error).toBeUndefined()
  })
})
