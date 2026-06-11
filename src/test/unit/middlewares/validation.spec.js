const validationMiddleware = require('~/middlewares/validation')
const { BODY_IS_NOT_DEFINED } = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')
const { validateRequired, validateFunc } = require('~/utils/validationHelper')
const { loginValidationSchema } = require('~/validation/schemas/login')

jest.mock('~/utils/validationHelper', () => ({
  validateRequired: jest.fn(),
  validateFunc: {
    type: jest.fn(),
    required: jest.fn(),
    minLength: jest.fn(),
    maxLength: jest.fn(),
    regex: jest.fn()
  }
}))

describe('validationMiddleware', () => {
  const next = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Повертаємо validateRequired до нормальної поведінки
    validateRequired.mockImplementation(() => {})
  })

  it('should throw 422 if req.body is not defined', () => {
    const middleware = validationMiddleware(loginValidationSchema)
    const req = { body: null }

    expect(() => middleware(req, {}, next)).toThrow(createError(422, BODY_IS_NOT_DEFINED))
    expect(next).not.toHaveBeenCalled()
  })

  it('should call validateRequired and validateFunc for valid body', () => {
    const middleware = validationMiddleware(loginValidationSchema)

    const req = {
      body: {
        email: 'test@example.com',
        password: '123456'
      }
    }

    middleware(req, {}, next)

    expect(validateRequired).toHaveBeenCalledWith('email', true, 'test@example.com')
    expect(validateRequired).toHaveBeenCalledWith('password', true, '123456')

    expect(validateFunc.type).toHaveBeenCalledWith('email', 'string', 'test@example.com')
    expect(validateFunc.type).toHaveBeenCalledWith('password', 'string', '123456')

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should throw error if required field is missing', () => {
    validateRequired.mockImplementation(() => {
      throw new Error('Field is required')
    })

    const middleware = validationMiddleware(loginValidationSchema)

    const req = { body: { email: undefined, password: '123456' } }

    expect(() => middleware(req, {}, next)).toThrow('Field is required')
    expect(next).not.toHaveBeenCalled()
  })

  it('should not call validateFunc if field is undefined', () => {
    const middleware = validationMiddleware(loginValidationSchema)

    const req = { body: { email: undefined, password: '123456' } }

    middleware(req, {}, next)

    expect(validateFunc.type).not.toHaveBeenCalledWith('email', 'string', undefined)

    expect(validateFunc.type).toHaveBeenCalledWith('password', 'string', '123456')

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should not call validateFunc if field is an empty string', () => {
    const middleware = validationMiddleware(loginValidationSchema)

    const req = { body: { email: '', password: '123456' } }

    middleware(req, {}, next)

    expect(validateFunc.type).not.toHaveBeenCalledWith('email', 'string', '')
    expect(validateFunc.type).toHaveBeenCalledWith('password', 'string', '123456')
    expect(next).toHaveBeenCalledTimes(1)
  })
})
