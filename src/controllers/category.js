const categoryService = require('~/services/category')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')

const getCategories = async (req, res) => {
  const { name, sort, skip, limit } = req.query

  const match = getMatchOptions({
    name: getRegex(name)
  })

  const sortOptions = getSortOptions(sort)

  const categories = await categoryService.getCategories(
    match,
    sortOptions,
    Number.parseInt(skip, 10) || 0,
    Number.parseInt(limit, 10) || 10
  )

  res.status(200).json(categories)
}

const createCategory = async (req, res) => {
  const data = req.body

  const newCategory = await categoryService.createCategory(data)

  res.status(201).json(newCategory)
}

module.exports = {
  getCategories,
  createCategory
}
