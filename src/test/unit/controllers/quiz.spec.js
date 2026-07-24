require('~/initialization/envSetup')

jest.mock('~/services/quiz')

const quizService = require('~/services/quiz')
const { getQuizById, deleteQuiz } = require('~/controllers/quiz')

describe('Quiz controller', () => {
  const mockUser = { id: 'authorId123' }

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn()
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getQuizById', () => {
    it('should call quizService.getQuizById with id from params', async () => {
      const mockReq = { params: { id: 'quizId123' } }

      quizService.getQuizById.mockResolvedValue({ _id: 'quizId123', title: 'Test quiz' })

      await getQuizById(mockReq, mockRes)

      expect(quizService.getQuizById).toHaveBeenCalledWith('quizId123')
    })

    it('should respond with status 200 and the quiz data', async () => {
      const mockReq = { params: { id: 'quizId123' } }
      const mockQuiz = { _id: 'quizId123', title: 'Test quiz' }

      quizService.getQuizById.mockResolvedValue(mockQuiz)

      await getQuizById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockQuiz)
    })

    it('should propagate errors thrown by quizService', async () => {
      const mockReq = { params: { id: 'quizId123' } }
      const error = new Error('Not found')

      quizService.getQuizById.mockRejectedValue(error)

      await expect(getQuizById(mockReq, mockRes)).rejects.toThrow('Not found')
    })
  })

  describe('deleteQuiz', () => {
    it('should call quizService.deleteQuiz with id and current user id', async () => {
      const mockReq = {
        user: mockUser,
        params: { id: 'quizId123' }
      }

      quizService.deleteQuiz.mockResolvedValue()

      await deleteQuiz(mockReq, mockRes)

      expect(quizService.deleteQuiz).toHaveBeenCalledWith('quizId123', mockUser.id)
    })

    it('should respond with status 204 and no content', async () => {
      const mockReq = {
        user: mockUser,
        params: { id: 'quizId123' }
      }

      quizService.deleteQuiz.mockResolvedValue()

      await deleteQuiz(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(204)
      expect(mockRes.end).toHaveBeenCalled()
    })

    it('should propagate errors thrown by quizService', async () => {
      const mockReq = {
        user: mockUser,
        params: { id: 'quizId123' }
      }
      const error = new Error('Not found')

      quizService.deleteQuiz.mockRejectedValue(error)

      await expect(deleteQuiz(mockReq, mockRes)).rejects.toThrow('Not found')
    })
  })
})
