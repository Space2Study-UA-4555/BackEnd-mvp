const subjectService = require('~/services/subjects')
const getCategoriesOptions = require('~/utils/getCategoriesOption')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')

const createSubject = async (req, res) => {
  const data = req.body

  const newSubject = await subjectService.createSubject(data)

  res.status(201).json(newSubject)
}

const getSubjects = async (req, res) => {
  const { name, sort, skip, limit, categories } = req.query
  const categoriesOptions = getCategoriesOptions(categories)

  const match = getMatchOptions({
    name: getRegex(name),
    category: categoriesOptions
  })
  const sortOptions = getSortOptions(sort)

  const subjects = await subjectService.getSubjects(
    match,
    sortOptions,
    parseInt(skip, 10) || 0,
    parseInt(limit, 10) || 10
  )

  res.status(200).json(subjects)
}

const getSubjectById = async (req, res) => {
  const { id } = req.params

  const subject = await subjectService.getSubjectById(id)

  res.status(200).json(subject)
}

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById
}
