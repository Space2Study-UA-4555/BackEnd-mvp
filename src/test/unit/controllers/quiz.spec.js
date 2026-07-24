require('~/initialization/envSetup')

jest.mock('~/services/quiz')

const quizService = require('~/services/quiz')
const { deleteQuiz } = require('~/controllers/quiz')

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
