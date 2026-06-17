require('~/initialization/envSetup')

jest.mock('~/services/question')

const questionService = require('~/services/question')
const { getQuestions } = require('~/controllers/question')

describe('Question controller', () => {
  const mockUser = { id: 'authorId123' }

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getQuestions', () => {
    it('should pass title as regex to service for partial match', async () => {
      const mockReq = {
        user: mockUser,
        query: { title: 'Chemical', skip: '0', limit: '10' }
      }

      questionService.getQuestions.mockResolvedValue({ items: [], count: 0 })

      await getQuestions(mockReq, mockRes)

      const [matchArg] = questionService.getQuestions.mock.calls[0]
      expect(matchArg).toMatchObject({ title: { $regex: 'Chemical' } })
      expect(matchArg.author).toBe(mockUser.id)
    })

    it('should match all questions when title is not provided', async () => {
      const mockReq = {
        user: mockUser,
        query: { skip: '0', limit: '10' }
      }

      questionService.getQuestions.mockResolvedValue({ items: [], count: 0 })

      await getQuestions(mockReq, mockRes)

      const [matchArg] = questionService.getQuestions.mock.calls[0]
      expect(matchArg).toMatchObject({ title: { $regex: '.*' } })
    })

    it('should respond with status 200 and questions data', async () => {
      const mockData = { items: [{ title: 'Chemical reactions overview' }], count: 1 }
      const mockReq = {
        user: mockUser,
        query: { title: 'Chemical', skip: '0', limit: '10' }
      }

      questionService.getQuestions.mockResolvedValue(mockData)

      await getQuestions(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockData)
    })
  })
})
