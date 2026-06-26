const Category = require('~/models/category')

const categoryService = {
  createCategory: async (data) => {
    const { name, appearance, totalOffers } = data

    const category = await Category.create({
      name,
      appearance,
      totalOffers
    })

    return category
  }
}

module.exports = categoryService
