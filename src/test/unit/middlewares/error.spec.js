const errorMiddleware = require('~/middlewares/error')
const errors = require('~/consts/errors')

jest.mock('~/logger/logger', () => ({
  error: jest.fn()
}))

describe('Error middleware', () => {
  let mockResponse
  const mockRequest = {}
  const mockNextFunc = jest.fn()

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    jest.clearAllMocks()
  })

  it('should return custom error response with status, code and message', () => {
    const error = {
      status: 401,
      code: errors.UNAUTHORIZED.code,
      message: errors.UNAUTHORIZED.message
    }

    errorMiddleware(error, mockRequest, mockResponse, mockNextFunc)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 401,
      code: errors.UNAUTHORIZED.code,
      message: errors.UNAUTHORIZED.message
    })
  })

  it('should return INTERNAL_SERVER_ERROR when error has no status and code', () => {
    const error = new Error('Unexpected error')

    errorMiddleware(error, mockRequest, mockResponse, mockNextFunc)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 500,
      code: errors.INTERNAL_SERVER_ERROR.code,
      message: error.message
    })
  })

  it('should return DOCUMENT_ALREADY_EXISTS for Mongo duplicate key error', () => {
    const error = {
      name: 'MongoServerError',
      code: 11000,
      message: 'E11000 duplicate key error collection: users index: email_1 dup key: { email: "test@gmail.com" }'
    }

    errorMiddleware(error, mockRequest, mockResponse, mockNextFunc)

    expect(mockResponse.status).toHaveBeenCalledWith(409)
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 409,
      ...errors.DOCUMENT_ALREADY_EXISTS('email')
    })
  })

  it('should return MONGO_SERVER_ERROR for non-duplicate Mongo error', () => {
    const error = {
      name: 'MongoServerError',
      code: 123,
      message: 'Mongo failed'
    }

    errorMiddleware(error, mockRequest, mockResponse, mockNextFunc)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 500,
      ...errors.MONGO_SERVER_ERROR(error.message)
    })
  })

  it('should return VALIDATION_ERROR for validation error', () => {
    const error = {
      name: 'ValidationError',
      code: 11000,
      message: 'ValidationError'
    }

    errorMiddleware(error, mockRequest, mockResponse, mockNextFunc)

    expect(mockResponse.status).toHaveBeenCalledWith(409)
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 409,
      ...errors.VALIDATION_ERROR(error.message)
    })
  })
})
