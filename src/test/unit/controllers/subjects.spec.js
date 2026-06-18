jest.mock('~/services/subjects')

const subjectService = require('~/services/subjects')
const { createSubject } = require('~/controllers/subjects')

describe('Subject controller', () => {
  let mockResponse

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create subject and return status 201', async () => {
    const subjectData = {
      name: 'English',
      category: 'categoryId'
    }
    const createdSubject = {
      _id: 'subjectId',
      ...subjectData
    }
    const mockRequest = {
      body: subjectData
    }

    subjectService.createSubject.mockResolvedValue(createdSubject)

    await createSubject(mockRequest, mockResponse)

    expect(subjectService.createSubject).toHaveBeenCalledWith(subjectData)
    expect(mockResponse.status).toHaveBeenCalledWith(201)
    expect(mockResponse.json).toHaveBeenCalledWith(createdSubject)
  })

  it('should pass request body to service unchanged', async () => {
    const subjectData = {
      name: 'English',
      category: 'categoryId',
      totalOffers: {
        student: 100,
        tutor: 50
      }
    }
    const createdSubject = {
      _id: 'subjectId',
      ...subjectData
    }
    const mockRequest = {
      body: subjectData
    }

    subjectService.createSubject.mockResolvedValue(createdSubject)

    await createSubject(mockRequest, mockResponse)

    expect(subjectService.createSubject).toHaveBeenCalledWith(subjectData)
  })
})
