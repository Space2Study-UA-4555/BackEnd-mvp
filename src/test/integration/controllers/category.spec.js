const Category = require('~/models/category')

describe('Category model', () => {
  it('should trim category name', () => {
    const category = new Category({
      name: '   Frontend   ',
      appearance: {
        icon: 'icon',
        color: '#FFFFFF'
      }
    })

    category.validateSync()

    expect(category.name).toBe('Frontend')
  })

  it('should throw validation error when name is missing', () => {
    const category = new Category({
      appearance: {
        icon: 'icon',
        color: '#FFFFFF'
      }
    })

    const error = category.validateSync()

    expect(error.errors.name).toBeDefined()
  })

  it('should throw validation error when name is longer than 50 characters', () => {
    const category = new Category({
      name: 'a'.repeat(51),
      appearance: {
        icon: 'icon',
        color: '#FFFFFF'
      }
    })

    const error = category.validateSync()

    expect(error.errors.name).toBeDefined()
  })

  it('should throw validation error when color is not valid hex', () => {
    const category = new Category({
      name: 'Frontend',
      appearance: {
        icon: 'icon',
        color: 'green'
      }
    })

    const error = category.validateSync()

    expect(error.errors['appearance.color']).toBeDefined()
  })
})
