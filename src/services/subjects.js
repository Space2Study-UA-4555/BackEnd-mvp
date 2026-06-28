const Subject = require('~/models/subject')
const filterAllowedFields = require('~/utils/filterAllowedFields')
const { allowedSubjectFieldsForUpdate } = require('~/validation/services/subject')

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
  },

  updateSubject: async (id, data) => {
    const filteredUpdateData = filterAllowedFields(data, allowedSubjectFieldsForUpdate)
    const subject = await Subject.findById(id).exec()

    for (let field in filteredUpdateData) {
      subject[field] = filteredUpdateData[field]
    }

    await subject.save()
    return await subject.populate({ path: 'category', select: '_id name' })
  },

  deleteSubject: async (id) => {
    await Subject.findByIdAndRemove(id).exec()
  }
}

module.exports = subjectService
