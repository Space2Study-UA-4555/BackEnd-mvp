jest.mock('~/models/subject')

const Subject = require('~/models/subject')
const subjectService = require('~/services/subjects')

describe('Subject service', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create subject and populate category', async () => {
    const subjectData = {
      name: 'English',
      category: 'categoryId'
    }
    const createdSubject = {
      ...subjectData,
      populate: jest.fn().mockResolvedValue({
        _id: 'subjectId',
        name: subjectData.name,
        category: { _id: subjectData.category, name: 'Languages' }
      })
    }

    Subject.create.mockResolvedValue(createdSubject)

    const result = await subjectService.createSubject(subjectData)

    expect(Subject.create).toHaveBeenCalledWith(subjectData)
    expect(createdSubject.populate).toHaveBeenCalledWith({ path: 'category', select: '_id name' })
    expect(result).toMatchObject({
      _id: 'subjectId',
      name: subjectData.name,
      category: { _id: subjectData.category, name: 'Languages' }
    })
  })

  it('should not pass totalOffers from request data', async () => {
    const subjectData = {
      name: 'English',
      category: 'categoryId',
      totalOffers: {
        student: 100,
        tutor: 50
      }
    }
    const createdSubject = {
      name: subjectData.name,
      category: subjectData.category,
      populate: jest.fn().mockResolvedValue({
        _id: 'subjectId',
        name: subjectData.name,
        category: { _id: subjectData.category, name: 'Languages' },
        totalOffers: {
          student: 0,
          tutor: 0
        }
      })
    }

    Subject.create.mockResolvedValue(createdSubject)

    await subjectService.createSubject(subjectData)

    expect(Subject.create).toHaveBeenCalledWith({
      name: subjectData.name,
      category: subjectData.category
    })
  })
})
