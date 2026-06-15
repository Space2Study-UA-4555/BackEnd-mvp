const getSortOptions = (sort) => {
  try {
    const parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort
    const { order, orderBy } = parsedSort || {}

    return { [orderBy || 'updatedAt']: order || 'asc' }
  } catch (error) {
    return { updatedAt: 'asc' }
  }
}

module.exports = getSortOptions
