const User = require('~/models/user')

describe('User model', () => {
  const getValidUserData = () => ({
    role: ['tutor'],
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@gmail.com',
    password: 'Qwerty123@'
  })

  it('should validate user with address including state', () => {
    const user = new User({
      ...getValidUserData(),
      address: {
        country: 'Ukraine',
        state: 'Kyiv Oblast',
        city: 'Kyiv'
      }
    })

    const error = user.validateSync()

    expect(error).toBeUndefined()
    expect(typeof user.address.state).toBe('string')
    expect(user.address).toEqual({
      country: 'Ukraine',
      state: 'Kyiv Oblast',
      city: 'Kyiv'
    })
  })

  it('should validate user when address.state is omitted', () => {
    const user = new User({
      ...getValidUserData(),
      address: {
        country: 'Ukraine',
        city: 'Kyiv'
      }
    })

    const error = user.validateSync()

    expect(error).toBeUndefined()
    expect(user.address.state).toBeUndefined()
    expect(user.address.country).toBe('Ukraine')
    expect(user.address.city).toBe('Kyiv')
  })

  it('should validate user with only country in address', () => {
    const user = new User({
      ...getValidUserData(),
      address: {
        country: 'United States'
      }
    })

    const error = user.validateSync()

    expect(error).toBeUndefined()
    expect(user.address.country).toBe('United States')
    expect(user.address.state).toBeUndefined()
    expect(user.address.city).toBeUndefined()
  })

  it('should validate user without address field', () => {
    const user = new User(getValidUserData())

    const error = user.validateSync()

    expect(error).toBeUndefined()
    expect(user.address?.country).toBeUndefined()
    expect(user.address?.state).toBeUndefined()
    expect(user.address?.city).toBeUndefined()
  })
})
