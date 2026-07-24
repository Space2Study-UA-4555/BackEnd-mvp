require('~/initialization/envSetup')

jest.mock('~/models/question')

const Question = require('~/models/question')
const quizService = require('~/services/quiz')

describe('Quiz service', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getQuizById', () => {
    const quizId = 'quizId123'

    it('should return the quiz when found', async () => {
      const mockQuiz = { _id: quizId, title: 'Test quiz', resourceType: 'quizzes' }

      Question.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockQuiz)
          })
        })
      })

      const result = await quizService.getQuizById(quizId)

      expect(Question.findOne).toHaveBeenCalledWith({ _id: quizId, resourceType: 'quizzes' })
      expect(result).toEqual(mockQuiz)
    })

    it('should throw a not found error when no quiz matches the id/resourceType', async () => {
      Question.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null)
          })
        })
      })

      await expect(quizService.getQuizById(quizId)).rejects.toMatchObject({
        status: 404
      })
    })

    it('should propagate a cast error when id has an invalid format', async () => {
      const castError = new Error('Cast to ObjectId failed')
      castError.name = 'CastError'

      Question.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockRejectedValue(castError)
          })
        })
      })

      await expect(quizService.getQuizById('invalid-id-format')).rejects.toThrow('Cast to ObjectId failed')
    })
  })

  describe('deleteQuiz', () => {
    const quizId = 'quizId123'
    const authorId = 'authorId123'

    it('should delete the quiz when it exists and current user is the author', async () => {
      Question.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ author: { toString: () => authorId } })
      })
      Question.findByIdAndRemove.mockReturnValue({
        exec: jest.fn().mockResolvedValue()
      })

      await quizService.deleteQuiz(quizId, authorId)

      expect(Question.findOne).toHaveBeenCalledWith({ _id: quizId, resourceType: 'quizzes' })
      expect(Question.findByIdAndRemove).toHaveBeenCalledWith(quizId)
    })

    it('should throw a not found error when no quiz matches the id/resourceType', async () => {
      Question.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      })

      await expect(quizService.deleteQuiz(quizId, authorId)).rejects.toMatchObject({
        status: 404
      })

      expect(Question.findByIdAndRemove).not.toHaveBeenCalled()
    })

    it('should throw a forbidden error when the current user is not the author', async () => {
      Question.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ author: { toString: () => 'someoneElseId' } })
      })

      await expect(quizService.deleteQuiz(quizId, authorId)).rejects.toMatchObject({
        status: 403
      })

      expect(Question.findByIdAndRemove).not.toHaveBeenCalled()
    })
  })
})
