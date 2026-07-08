jest.mock('~/models/subject')

const Subject = require('~/models/subject')
const subjectService = require('~/services/subjects')

describe('Subject service', () => {
  const getSubjectFindChain = (items) => {
    const chain = {
      collation: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(items)
    }

    Subject.find.mockReturnValue(chain)

    return chain
  }

  const getSubjectFindByIdChain = (subject) => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(subject)
    }

    Subject.findById.mockReturnValue(chain)

    return chain
  }

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

  it('should get subjects with filters, sorting and pagination', async () => {
    const items = [{ _id: 'subjectId', name: 'English' }]
    const match = { name: { $regex: 'Eng', $options: 'i' } }
    const sort = { name: 'asc' }
    const skip = 0
    const limit = 10
    const findChain = getSubjectFindChain(items)

    Subject.countDocuments.mockResolvedValue(1)

    const result = await subjectService.getSubjects(match, sort, skip, limit)

    expect(Subject.find).toHaveBeenCalledWith(match)
    expect(findChain.collation).toHaveBeenCalledWith({ locale: 'en', strength: 1 })
    expect(findChain.populate).toHaveBeenCalledWith({ path: 'category', select: '_id name' })
    expect(findChain.sort).toHaveBeenCalledWith(sort)
    expect(findChain.skip).toHaveBeenCalledWith(skip)
    expect(findChain.limit).toHaveBeenCalledWith(limit)
    expect(Subject.countDocuments).toHaveBeenCalledWith(match)
    expect(result).toEqual({ items, count: 1 })
  })

  it('should return empty result when no subjects are found', async () => {
    const match = { name: { $regex: 'Unknown', $options: 'i' } }
    const sort = { name: 'asc' }

    getSubjectFindChain([])
    Subject.countDocuments.mockResolvedValue(0)

    const result = await subjectService.getSubjects(match, sort)

    expect(Subject.find).toHaveBeenCalledWith(match)
    expect(Subject.countDocuments).toHaveBeenCalledWith(match)
    expect(result).toEqual({ items: [], count: 0 })
  })

  it('should get subject by id and populate category', async () => {
    const subjectId = 'subjectId'
    const subject = {
      _id: subjectId,
      name: 'English',
      category: {
        _id: 'categoryId',
        name: 'Languages'
      }
    }
    const findByIdChain = getSubjectFindByIdChain(subject)

    const result = await subjectService.getSubjectById(subjectId)

    expect(Subject.findById).toHaveBeenCalledWith(subjectId)
    expect(findByIdChain.populate).toHaveBeenCalledWith({ path: 'category', select: '_id name' })
    expect(findByIdChain.lean).toHaveBeenCalled()
    expect(findByIdChain.exec).toHaveBeenCalled()
    expect(result).toEqual(subject)
  })

  it('should update subject with allowed fields and populate category', async () => {
    const subjectId = 'subjectId'
    const updateData = {
      name: 'Spanish',
      category: 'categoryId'
    }
    const subject = {
      name: 'English',
      category: 'oldCategoryId',
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue({
        _id: subjectId,
        ...updateData,
        category: {
          _id: updateData.category,
          name: 'Languages'
        }
      })
    }

    getSubjectFindByIdChain(subject)

    const result = await subjectService.updateSubject(subjectId, updateData)

    expect(Subject.findById).toHaveBeenCalledWith(subjectId)
    expect(subject.name).toBe(updateData.name)
    expect(subject.category).toBe(updateData.category)
    expect(subject.save).toHaveBeenCalled()
    expect(subject.populate).toHaveBeenCalledWith({ path: 'category', select: '_id name' })
    expect(result).toMatchObject({
      _id: subjectId,
      name: updateData.name,
      category: {
        _id: updateData.category,
        name: 'Languages'
      }
    })
  })

  it('should ignore totalOffers during subject update', async () => {
    const subjectId = 'subjectId'
    const updateData = {
      name: 'Spanish',
      totalOffers: {
        student: 100,
        tutor: 50
      }
    }
    const subject = {
      name: 'English',
      totalOffers: {
        student: 0,
        tutor: 0
      },
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue({
        _id: subjectId,
        name: updateData.name,
        totalOffers: {
          student: 0,
          tutor: 0
        }
      })
    }

    getSubjectFindByIdChain(subject)

    await subjectService.updateSubject(subjectId, updateData)

    expect(subject.name).toBe(updateData.name)
    expect(subject.totalOffers).toEqual({
      student: 0,
      tutor: 0
    })
    expect(subject.save).toHaveBeenCalled()
  })
})
