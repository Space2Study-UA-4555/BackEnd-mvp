const getSortOptions = require('~/utils/getSortOptions')

describe('getSortOptions', () => {
  it('should return sort options from JSON string', () => {
    const sort = JSON.stringify({ order: 'desc', orderBy: 'updatedAt' })

    expect(getSortOptions(sort)).toEqual({ updatedAt: 'desc' })
  })

  it('should return sort options from object', () => {
    const sort = { order: 'desc', orderBy: 'updatedAt' }

    expect(getSortOptions(sort)).toEqual({ updatedAt: 'desc' })
  })

  it('should return default sort options when sort is not provided', () => {
    expect(getSortOptions()).toEqual({ updatedAt: 'asc' })
  })
})
