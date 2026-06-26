require('~/initialization/envSetup')

jest.mock('~/services/lesson')

const lessonService = require('~/services/lesson')
const { getLessons, createLesson } = require('~/controllers/lesson')

describe('Lesson controller', () => {
  const mockUser = { id: 'authorId123' }

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getLessons', () => {
    it('should pass title as regex to service for partial match', async () => {
      const mockReq = {
        user: mockUser,
        query: { title: 'Algebra', skip: '0', limit: '10' }
      }

      lessonService.getLessons.mockResolvedValue({ items: [], count: 0 })

      await getLessons(mockReq, mockRes)

      const [matchArg] = lessonService.getLessons.mock.calls[0]
      expect(matchArg).toMatchObject({ title: { $regex: 'Algebra' } })
      expect(matchArg.author).toBe(mockUser.id)
    })

    it('should match all lessons when title is not provided', async () => {
      const mockReq = {
        user: mockUser,
        query: { skip: '0', limit: '10' }
      }

      lessonService.getLessons.mockResolvedValue({ items: [], count: 0 })

      await getLessons(mockReq, mockRes)

      const [matchArg] = lessonService.getLessons.mock.calls[0]
      expect(matchArg).toMatchObject({ title: { $regex: '.*' } })
    })

    it('should respond with status 200 and lessons data', async () => {
      const mockData = { items: [{ title: 'Intro to Algebra' }], count: 1 }
      const mockReq = {
        user: mockUser,
        query: { title: 'Algebra', skip: '0', limit: '10' }
      }

      lessonService.getLessons.mockResolvedValue(mockData)

      await getLessons(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockData)
    })
  })

  describe('createLesson', () => {
    const lessonData = {
      title: 'Test Lesson',
      description: 'Lesson description',
      content: 'Lesson content',
      attachments: [],
      category: null
    }

    it('should pass author and body to service', async () => {
      const mockReq = { user: mockUser, body: lessonData }

      lessonService.createLesson.mockResolvedValue({ _id: 'lessonId', ...lessonData })

      await createLesson(mockReq, mockRes)

      expect(lessonService.createLesson).toHaveBeenCalledWith(mockUser.id, lessonData)
    })

    it('should respond with status 201 and created lesson', async () => {
      const createdLesson = { _id: 'lessonId', ...lessonData }
      const mockReq = { user: mockUser, body: lessonData }

      lessonService.createLesson.mockResolvedValue(createdLesson)

      await createLesson(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(createdLesson)
    })
  })
})
