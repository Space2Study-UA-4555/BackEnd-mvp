require('~/initialization/envSetup')

jest.mock('~/services/lesson')

const lessonService = require('~/services/lesson')
const { getLessons, getLessonById, createLesson, updateLesson, deleteLesson } = require('~/controllers/lesson')

describe('Lesson controller', () => {
  const mockUser = { id: 'authorId123' }

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn().mockReturnThis()
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

  describe('getLessonById', () => {
    it('should pass the id from params to service', async () => {
      const mockReq = { user: mockUser, params: { id: 'lessonId' } }

      lessonService.getLessonById.mockResolvedValue({ _id: 'lessonId' })

      await getLessonById(mockReq, mockRes)

      expect(lessonService.getLessonById).toHaveBeenCalledWith('lessonId')
    })

    it('should respond with status 200 and the lesson', async () => {
      const lesson = { _id: 'lessonId', title: 'Intro to Algebra' }
      const mockReq = { user: mockUser, params: { id: 'lessonId' } }

      lessonService.getLessonById.mockResolvedValue(lesson)

      await getLessonById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(lesson)
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

  describe('updateLesson', () => {
    const updateData = { title: 'Updated title', description: 'Updated description' }

    it('should pass id, current user id and body to service', async () => {
      const mockReq = { user: mockUser, params: { id: 'lessonId' }, body: updateData }

      lessonService.updateLesson.mockResolvedValue({ _id: 'lessonId', ...updateData })

      await updateLesson(mockReq, mockRes)

      expect(lessonService.updateLesson).toHaveBeenCalledWith('lessonId', mockUser.id, updateData)
    })

    it('should respond with status 200 and the updated lesson', async () => {
      const updatedLesson = { _id: 'lessonId', ...updateData }
      const mockReq = { user: mockUser, params: { id: 'lessonId' }, body: updateData }

      lessonService.updateLesson.mockResolvedValue(updatedLesson)

      await updateLesson(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(updatedLesson)
    })
  })

  describe('deleteLesson', () => {
    it('should pass id and current user id to service', async () => {
      const mockReq = { user: mockUser, params: { id: 'lessonId' } }

      lessonService.deleteLesson.mockResolvedValue()

      await deleteLesson(mockReq, mockRes)

      expect(lessonService.deleteLesson).toHaveBeenCalledWith('lessonId', mockUser.id)
    })

    it('should respond with status 204 and end the response', async () => {
      const mockReq = { user: mockUser, params: { id: 'lessonId' } }

      lessonService.deleteLesson.mockResolvedValue()

      await deleteLesson(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(204)
      expect(mockRes.end).toHaveBeenCalled()
    })
  })
})
