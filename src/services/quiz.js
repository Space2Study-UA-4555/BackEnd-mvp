const Question = require('~/models/question')
const {
  enums: { RESOURCES_TYPES_ENUM }
} = require('~/consts/validation')
const { createForbiddenError, createNotFoundError } = require('~/utils/errorsHelper')

const QUIZ_RESOURCE_TYPE = RESOURCES_TYPES_ENUM[3] // 'quizzes'

const quizService = {
  getQuizById: async (id) => {
    const quiz = await Question.findOne({ _id: id, resourceType: QUIZ_RESOURCE_TYPE })
      .populate({ path: 'category', select: '_id name' })
      .lean()
      .exec()

    if (!quiz) {
      throw createNotFoundError()
    }

    return quiz
  },

  deleteQuiz: async (id, currentUserId) => {
    const quiz = await Question.findOne({ _id: id, resourceType: QUIZ_RESOURCE_TYPE }).exec()

    if (!quiz) {
      throw createNotFoundError()
    }

    const author = quiz.author.toString()

    if (author !== currentUserId) {
      throw createForbiddenError()
    }

    await Question.findByIdAndRemove(id).exec()
  }
}

module.exports = quizService
