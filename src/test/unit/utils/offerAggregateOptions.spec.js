const mongoose = require('mongoose')
const offerAggregateOptions = require('~/utils/offers/offerAggregateOptions')
const { INVALID_ID } = require('~/consts/errors')

const findStage = (pipeline, stageName) => pipeline.find((stage) => stageName in stage)

const findLookup = (pipeline, from) => pipeline.find((stage) => stage.$lookup?.from === from)?.$lookup

const findUnwind = (pipeline, path) => {
  const stage = pipeline.find((item) => {
    const unwind = item.$unwind

    return (typeof unwind === 'string' ? unwind : unwind?.path) === path
  })

  return stage?.$unwind
}

describe('offerAggregateOptions', () => {
  const subjectId = '507f1f77bcf86cd799439011'
  const categoryId = '507f1f77bcf86cd799439012'

  it('should join subjects and categories in the pipeline', () => {
    const pipeline = offerAggregateOptions({}, {})
    const lookupStages = pipeline.filter((stage) => '$lookup' in stage)

    expect(lookupStages).toHaveLength(3)
    expect(findLookup(pipeline, 'users').from).toBe('users')
    expect(findLookup(pipeline, 'subjects')).toMatchObject({
      from: 'subjects',
      localField: 'subject',
      foreignField: '_id',
      as: 'subject',
      pipeline: [{ $project: { name: 1 } }]
    })
    expect(findLookup(pipeline, 'categories')).toMatchObject({
      from: 'categories',
      localField: 'category',
      foreignField: '_id',
      as: 'category',
      pipeline: [{ $project: { appearance: 1 } }]
    })
  })

  it('should keep offers without subject or category in the list', () => {
    const pipeline = offerAggregateOptions({}, {})

    expect(findUnwind(pipeline, '$subject')).toEqual({
      path: '$subject',
      preserveNullAndEmptyArrays: true
    })
    expect(findUnwind(pipeline, '$category')).toEqual({
      path: '$category',
      preserveNullAndEmptyArrays: true
    })
  })

  it('should filter by subjectId when it is passed in query', () => {
    const pipeline = offerAggregateOptions({ subjectId }, {})
    const matchStage = findStage(pipeline, '$match')

    expect(matchStage.$match['subject._id']).toEqual(mongoose.Types.ObjectId(subjectId))
  })

  it('should filter by categoryId when it is passed in query', () => {
    const pipeline = offerAggregateOptions({ categoryId }, {})
    const matchStage = findStage(pipeline, '$match')

    expect(matchStage.$match['category._id']).toEqual(mongoose.Types.ObjectId(categoryId))
  })

  it('should throw INVALID_ID when subjectId is invalid', () => {
    expect(() => offerAggregateOptions({ subjectId: 'invalid-id' }, {})).toThrow(
      expect.objectContaining({
        status: 400,
        code: INVALID_ID.code
      })
    )
  })

  it('should throw INVALID_ID when categoryId is invalid', () => {
    expect(() => offerAggregateOptions({ categoryId: 'invalid-id' }, {})).toThrow(
      expect.objectContaining({
        status: 400,
        code: INVALID_ID.code
      })
    )
  })
})
