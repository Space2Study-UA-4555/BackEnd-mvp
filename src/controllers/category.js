const categoryService = require('~/services/category')

const createCategory = async (req, res) => {
  const data = req.body

  const newCategory = await categoryService.createCategory(data)

  res.status(201).json(newCategory)
}

module.exports = {
  createCategory
}
