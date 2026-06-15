const validationMiddleware = require('~/middlewares/validation')
const errors = require('~/consts/errors')

describe('Validation middleware', () => {
  const next = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

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
    const req = {
      body: {
        token: {}
      }
    }

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
    const req = {
      body: {
        token: {
          credential: 123
        }
      }
    }

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
    const req = {
      body: {
        email: 123
      }
    }

    expect(() => validationMiddleware(schema)(req, {}, next)).toThrow(
      expect.objectContaining({
        status: 422,
        code: errors.FIELD_IS_NOT_OF_PROPER_TYPE('email', 'string').code
      })
    )
    expect(next).not.toHaveBeenCalled()
  })
})
