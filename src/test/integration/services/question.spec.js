const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const User = require('~/models/user')
const Category = require('~/models/resourcesCategory')
const Question = require('~/models/question')
const questionService = require('~/services/question.js')
const mongoose = require('mongoose')

describe('Question service', () => {
  let server, user, category

  beforeAll(async () => {
    ({ server } = await serverInit())
  })

  beforeEach(async () => {
    user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test4@email.com',
      password: '12345qwerty',
      role: ['tutor']
    })

    category = await Category.create({
      name: 'Frontend',
      author: user._id
    })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  it('should get question by id', async () => {
    const questionData = {
      title: 'What is React?',
      text: 'Explain React',
      answers: [
        {
          text: 'Library',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const createdQuestion = await questionService.createQuestion(
      user._id,
      questionData
    )

    const question = await questionService.getQuestionById(
      createdQuestion._id
    )

    expect(question).not.toBeNull()
    expect(question._id.toString()).toBe(
      createdQuestion._id.toString()
    )
    expect(question.title).toBe(questionData.title)
    expect(question.text).toBe(questionData.text)
  })

  it('should return null when question does not exist', async () => {
    const id = new mongoose.Types.ObjectId()

    const question = await questionService.getQuestionById(id)

    expect(question).toBeNull()
  })

  it('should get all questions', async () => {
    await questionService.createQuestion(user._id, {
      title: 'Question 1',
      text: 'Text 1',
      answers: [],
      type: 'openAnswer',
      category: category._id
    })

    await questionService.createQuestion(user._id, {
      title: 'Question 2',
      text: 'Text 2',
      answers: [],
      type: 'openAnswer',
      category: category._id
    })

    const result = await questionService.getQuestions({}, {})

    expect(result.count).toBe(2)
    expect(result.items).toHaveLength(2)
  })

  it('should apply skip and limit', async () => {
    for (let i = 1; i <= 3; i++) {
      await questionService.createQuestion(user._id, {
        title: `Question ${i}`,
        text: `Text ${i}`,
        answers: [],
        type: 'openAnswer',
        category: category._id
      })
    }

    const result = await questionService.getQuestions(
      {},
      {},
      1,
      1
    )

    expect(result.count).toBe(3)
    expect(result.items).toHaveLength(1)
  })

  it('should create question', async () => {  
    const questionData = {
      title: 'What is React?',
      text: 'Explain React',
      answers: [
        {
          text: 'Library',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const question = await questionService.createQuestion(
      user._id,
      questionData
    )

    const savedQuestion = await Question.findById(question._id)

    expect(savedQuestion).not.toBeNull()
    expect(savedQuestion.title).toBe(questionData.title)
    expect(savedQuestion.text).toBe(questionData.text)

    expect(savedQuestion.author.toString()).toBe(
      user._id.toString()
    )

    expect(savedQuestion.category.toString()).toBe(
      category._id.toString()
    )

  })

  it('should update question', async () => {
    const questionDataOriginal = {
      title: 'What is Node.js?',
      text: 'Explain Node.js',
      answers: [
        {
          text: 'Runtime environment',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const questionDataUpdated = {
      title: 'What is Express.js?',
      text: 'Explain Express.js',
      answers: [
        {
          text: 'Web framework',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const question = await questionService.createQuestion(
      user._id,
      questionDataOriginal
    )

    const updatedQuestion = await questionService.updateQuestion(
      question._id,
      user._id.toString(),
      questionDataUpdated
    )

    const savedQuestion = await Question.findById(updatedQuestion._id)

    expect(savedQuestion).not.toBeNull()
    expect(savedQuestion.title).toBe(questionDataUpdated.title)
    expect(savedQuestion.text).toBe(questionDataUpdated.text)

    expect(savedQuestion.author.toString()).toBe(
      user._id.toString()
    )

    expect(savedQuestion.category.toString()).toBe(
      category._id.toString()
    )
  })

  it('should throw an error when updating not your own question', async () => {
    const user2 = await User.create({
      firstName: 'Updatenotown',
      lastName: 'Question',
      email: 'Updatenotown-question@email.com',
      password: '12345qwerty',
      role: ['tutor']
    })

    const questionDataOriginal = {
      title: 'What is Node.js?',
      text: 'Explain Node.js',
      answers: [
        {
          text: 'Runtime environment',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const questionDataUpdated = {
      title: 'What is Express.js?',
      text: 'Explain Express.js',
      answers: [
        {
          text: 'Web framework',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const question = await questionService.createQuestion(
      user._id,
      questionDataOriginal
    )

    await expect(questionService.updateQuestion(
      question._id,
      user2._id.toString(),
      questionDataUpdated
    )).rejects.toThrow('You do not have permission to perform this action.')
  })

  it('should delete question', async () => {
    const questionData = {
      title: 'What is Java?',
      text: 'Explain Java',
      answers: [
        {
          text: 'Programming language',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const question = await questionService.createQuestion(
      user._id,
      questionData
    )

    await questionService.deleteQuestion(question._id, user._id.toString())

    const deletedQuestion = await Question.findById(question._id)

    expect(deletedQuestion).toBeNull()
  })

  it('should not delete question if user is not the author', async () => {
    const anotherUser = await User.create({
      firstName: 'Another',
      lastName: 'User',
      email: 'another-user@email.com',
      password: '12345qwerty',
      role: ['tutor']
    })

    const questionData = {
      title: 'What is Java?',
      text: 'Explain Java',
      answers: [
        {
          text: 'Programming language',
          isCorrect: true
        }
      ],
      type: 'openAnswer',
      category: category._id,
      author: user._id
    }

    const question = await questionService.createQuestion(
      user._id,
      questionData
    )

    await expect(
      questionService.deleteQuestion(
        question._id,
        anotherUser._id.toString()
      )
    ).rejects.toThrow('You do not have permission to perform this action.')

    const savedQuestion = await Question.findById(question._id)

    expect(savedQuestion).not.toBeNull()
  })
})
