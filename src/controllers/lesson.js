const lessonService = require('~/services/lesson')
const getCategoriesOptions = require('~/utils/getCategoriesOption')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')

const getLessons = async (req, res) => {
  const { id: author } = req.user
  const { title, sort, skip, limit, categories } = req.query
  const categoriesOptions = getCategoriesOptions(categories)

  const match = getMatchOptions({
    author,
    title: getRegex(title),
    category: categoriesOptions
  })
  const sortOptions = getSortOptions(sort)

  const lessons = await lessonService.getLessons(match, sortOptions, parseInt(skip), parseInt(limit))

  res.status(200).json(lessons)
}

const getLessonById = async (req, res) => {
  const { id } = req.params

  const lesson = await lessonService.getLessonById(id)

  res.status(200).json(lesson)
}

const createLesson = async (req, res) => {
  const { id: author } = req.user
  const data = req.body

  const newLesson = await lessonService.createLesson(author, data)

  res.status(201).json(newLesson)
}

const deleteLesson = async (req, res) => {
  const userId = req.user.id
  const { id } = req.params

  await lessonService.deleteLesson(id, userId)

  res.status(204).end()
}

const updateLesson = async (req, res) => {
  const { id } = req.params
  const { id: currentUserId } = req.user
  const data = req.body

  const updatedLesson = await lessonService.updateLesson(id, currentUserId, data)

  res.status(200).json(updatedLesson)
}

module.exports = {
  getLessons,
  getLessonById,
  createLesson,
  deleteLesson,
  updateLesson
}
