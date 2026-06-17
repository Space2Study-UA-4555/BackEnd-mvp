const validationMiddleware = require('~/middlewares/validation')
const { BODY_IS_NOT_DEFINED } = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')
const { loginValidationSchema } = require('~/validation/schemas/login')
const errors = require('~/consts/errors')

describe('validationMiddleware', () => {
  const next = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -----------------------------
  //  LOGIN TESTS
  // -----------------------------

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

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should throw error if required field is missing', () => {
    const middleware = validationMiddleware(loginValidationSchema)
    const req = { body: { email: undefined, password: '123456' } }

    expect(() => middleware(req, {}, next)).toThrow()
    expect(next).not.toHaveBeenCalled()
  })

  // -----------------------------------------
  //  NESTED TESTS (from develop)
  // -----------------------------------------

  it('should pass validation for nested object fields', () => {
    const schema = {
      token: {
        type: 'object',
        required: true,
        properties: {
          credential: {
            type: 'string',
            required: true
          }
        }
      }
    }

    const req = {
      body: {
        token: {
          credential: 'valid-google-token'
        }
      }
    }

    validationMiddleware(schema)(req, {}, next)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should throw validation error for missing nested required field', () => {
    const schema = {
      token: {
        type: 'object',
        required: true,
        properties: {
          credential: {
            type: 'string',
            required: true
          }
        }
      }
    }

    const req = { body: { token: {} } }

    expect(() => validationMiddleware(schema)(req, {}, next)).toThrow(
      expect.objectContaining({
        status: 422,
        code: errors.FIELD_IS_NOT_DEFINED('token.credential').code
      })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('should throw validation error for wrong nested field type', () => {
    const schema = {
      token: {
        type: 'object',
        required: true,
        properties: {
          credential: {
            type: 'string',
            required: true
          }
        }
      }
    }

    const req = { body: { token: { credential: 123 } } }

    expect(() => validationMiddleware(schema)(req, {}, next)).toThrow(
      expect.objectContaining({
        status: 422,
        code: errors.FIELD_IS_NOT_OF_PROPER_TYPE('token.credential', 'string').code
      })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('should keep validating top-level fields', () => {
    const schema = {
      email: {
        type: 'string',
        required: true
      }
    }

    const req = { body: { email: 123 } }

    expect(() => validationMiddleware(schema)(req, {}, next)).toThrow(
      expect.objectContaining({
        status: 422,
        code: errors.FIELD_IS_NOT_OF_PROPER_TYPE('email', 'string').code
      })
    )
    expect(next).not.toHaveBeenCalled()
  })
})
