const mongoose = require('mongoose')
const offerAggregateOptions = require('~/utils/offers/offerAggregateOptions')

const findStage = (pipeline, stageName) => pipeline.find((stage) => stageName in stage)

describe('offerAggregateOptions', () => {
  const subjectId = '507f1f77bcf86cd799439011'
  const categoryId = '507f1f77bcf86cd799439012'

  it('should join subjects and categories in the pipeline', () => {
    const pipeline = offerAggregateOptions({}, {})
    const lookupStages = pipeline.filter((stage) => '$lookup' in stage)

    expect(lookupStages).toHaveLength(3)
    expect(lookupStages[0].$lookup.from).toBe('users')
    expect(lookupStages[1].$lookup).toMatchObject({
      from: 'subjects',
      localField: 'subject',
      foreignField: '_id',
      as: 'subject',
      pipeline: [{ $project: { name: 1 } }]
    })
    expect(lookupStages[2].$lookup).toMatchObject({
      from: 'categories',
      localField: 'category',
      foreignField: '_id',
      as: 'category',
      pipeline: [{ $project: { appearance: 1 } }]
    })
  })

  it('should keep offers without subject or category in the list', () => {
    const pipeline = offerAggregateOptions({}, {})
    const unwindStages = pipeline.filter((stage) => '$unwind' in stage)

    expect(unwindStages[1].$unwind).toEqual({
      path: '$subject',
      preserveNullAndEmptyArrays: true
    })
    expect(unwindStages[2].$unwind).toEqual({
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
})
