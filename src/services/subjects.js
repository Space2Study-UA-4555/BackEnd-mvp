const Subject = require('~/models/subject')

const subjectService = {
  createSubject: async (data) => {
    const { name, category } = data

    const subject = await Subject.create({
      name,
      category
    })

    return await subject.populate({ path: 'category', select: '_id name' })
  },

  getSubjects: async (match, sort, skip = 0, limit = 10) => {
    const items = await Subject.find(match)
      .collation({ locale: 'en', strength: 1 })
      .populate({ path: 'category', select: '_id name' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()
    const count = await Subject.countDocuments(match)

    return { items, count }
  },

  getSubjectById: async (id) => {
    return await Subject.findById(id).populate({ path: 'category', select: '_id name' }).lean().exec()
  }
}

module.exports = subjectService
