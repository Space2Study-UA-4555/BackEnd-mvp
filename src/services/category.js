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
  },

  getCategories: async (match, sort, skip = 0, limit = 10) => {
    const items = await Category.find(match)
      .collation({ locale: 'en', strength: 1 })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

    const count = await Category.countDocuments(match)

    return { items, count }
  },

  getCategoryNames: async () => {
    return await Category.find({}, 'name').collation({ locale: 'en', strength: 1 }).sort({ name: 'asc' }).lean().exec()
  }
}

module.exports = categoryService
