require('~/initialization/envSetup')

jest.mock('~/models/question')

const Question = require('~/models/question')
const quizService = require('~/services/quiz')

describe('Quiz service', () => {
  afterEach(() => {
    jest.clearAllMocks()
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
