const idValidation = require('~/middlewares/idValidation')
const mongoose = require('mongoose')
const { INVALID_ID } = require('~/consts/errors')

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn()
    }
  }
}))

jest.mock('~/utils/errorsHelper', () => ({
  createError: jest.fn((status, code) => ({ status, code }))
}))

describe('idValidation middleware', () => {
  const next = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call next() for valid ObjectId', () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true)

    idValidation({}, {}, next, '507f1f77bcf86cd799439011')

    expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should throw error for invalid ObjectId', () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false)

    expect(() => idValidation({}, {}, next, 'invalid-id')).toThrow(
      expect.objectContaining({
        status: 400,
        code: INVALID_ID
      })
    )

    expect(next).not.toHaveBeenCalled()
  })

  it('should throw error when id is undefined', () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false)

    expect(() => idValidation({}, {}, next, undefined)).toThrow(
      expect.objectContaining({
        status: 400,
        code: INVALID_ID
      })
    )
  })

  it('should throw error when id is null', () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false)

    expect(() => idValidation({}, {}, next, null)).toThrow(
      expect.objectContaining({
        status: 400,
        code: INVALID_ID
      })
    )
  })
})
