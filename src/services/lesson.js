const Lesson = require('~/models/lesson')
const { createForbiddenError } = require('~/utils/errorsHelper')

const lessonService = {
  getLessons: async (match, sort, skip = 0, limit = 10) => {
    const items = await Lesson.find(match)
      .collation({ locale: 'en', strength: 1 })
      .populate({ path: 'category', select: '_id name' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()
    const count = await Lesson.countDocuments(match)

    return { items, count }
  },

  getLessonById: async (id) => {
    return await Lesson.findById(id).lean().exec()
  },

  createLesson: async (author, data) => {
    const { title, description, content, attachments, category } = data

    const lesson = await Lesson.create({
      title,
      description,
      content,
      attachments,
      category,
      author
    })

    return await lesson.populate({ path: 'category', select: '_id name' })
  },

  deleteLesson: async (id, currentUser) => {
    const lesson = await Lesson.findById(id).exec()

    const author = lesson.author.toString()

    if (author !== currentUser) {
      throw createForbiddenError()
    }

    await Lesson.findByIdAndRemove(id).exec()
  },

  updateLesson: async (id, currentUserId, data) => {
    const lesson = await Lesson.findById(id).exec()

    const author = lesson.author.toString()

    if (author !== currentUserId) {
      throw createForbiddenError()
    }

    for (let field in data) {
      lesson[field] = data[field]
    }

    await lesson.save()
    return lesson.populate({ path: 'category', select: '_id name' })
  }
}

module.exports = lessonService
