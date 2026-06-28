jest.mock('~/services/subjects')

const subjectService = require('~/services/subjects')
const { createSubject, getSubjects, getSubjectById, updateSubject } = require('~/controllers/subjects')

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

  it('should get subjects and return status 200', async () => {
    const mockData = {
      items: [{ _id: 'subjectId', name: 'English' }],
      count: 1
    }
    const mockRequest = {
      query: {
        name: 'Eng',
        sort: '{"order":"asc","orderBy":"name"}',
        skip: '0',
        limit: '10'
      }
    }

    subjectService.getSubjects.mockResolvedValue(mockData)

    await getSubjects(mockRequest, mockResponse)

    expect(subjectService.getSubjects).toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith(mockData)
  })

  it('should pass name and category filters to service', async () => {
    const mockRequest = {
      query: {
        name: 'Eng',
        categories: 'categoryId',
        skip: '0',
        limit: '10'
      }
    }

    subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

    await getSubjects(mockRequest, mockResponse)

    const [matchArg] = subjectService.getSubjects.mock.calls[0]
    expect(matchArg).toMatchObject({
      name: { $regex: 'Eng' },
      category: ['categoryId']
    })
  })

  it('should use default name search when name is not provided', async () => {
    const mockRequest = {
      query: {
        skip: '0',
        limit: '10'
      }
    }

    subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

    await getSubjects(mockRequest, mockResponse)

    const [matchArg] = subjectService.getSubjects.mock.calls[0]
    expect(matchArg).toMatchObject({
      name: { $regex: '.*' }
    })
    expect(matchArg.category).toBeUndefined()
  })

  it('should pass default pagination to service when skip and limit are not provided', async () => {
    const mockRequest = {
      query: {}
    }

    subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

    await getSubjects(mockRequest, mockResponse)

    expect(subjectService.getSubjects).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 0, 10)
  })

  it('should get subject by id and return status 200', async () => {
    const subjectId = 'subjectId'
    const subject = {
      _id: subjectId,
      name: 'English',
      category: {
        _id: 'categoryId',
        name: 'Languages'
      }
    }
    const mockRequest = {
      params: {
        id: subjectId
      }
    }

    subjectService.getSubjectById.mockResolvedValue(subject)

    await getSubjectById(mockRequest, mockResponse)

    expect(subjectService.getSubjectById).toHaveBeenCalledWith(subjectId)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith(subject)
  })

  it('should update subject and return status 200', async () => {
    const subjectId = 'subjectId'
    const updateData = {
      name: 'Spanish',
      category: 'categoryId'
    }
    const updatedSubject = {
      _id: subjectId,
      ...updateData
    }
    const mockRequest = {
      params: {
        id: subjectId
      },
      body: updateData
    }

    subjectService.updateSubject.mockResolvedValue(updatedSubject)

    await updateSubject(mockRequest, mockResponse)

    expect(subjectService.updateSubject).toHaveBeenCalledWith(subjectId, updateData)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith(updatedSubject)
  })
})
