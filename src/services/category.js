const Category = require('~/models/category')

const categoryService = {
  createCategory: async (data) => {
    const { name, appearance } = data

    const category = await Category.create({
      name,
      appearance
    })

    return category
  }
}

module.exports = categoryService
