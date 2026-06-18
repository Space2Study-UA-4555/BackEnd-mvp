// Повністю контролюємо поведінку tokenService через моки
const mockValidateAccessToken = jest.fn()
const mockGenerateTokens = jest.fn()

jest.mock('../../../services/token', () => ({
  validateAccessToken: (...args) => mockValidateAccessToken(...args),
  generateTokens: (...args) => mockGenerateTokens(...args)
}))

const { authMiddleware, restrictTo } = require('~/middlewares/auth')
const { createUnauthorizedError, createForbiddenError } = require('~/utils/errorsHelper')
const tokenService = require('../../../services/token')

describe('Auth middleware', () => {
  let mockNextFunc
  const mockResponse = {}

  beforeEach(() => {
    jest.clearAllMocks()
    mockNextFunc = jest.fn()
  })

  it('Should throw UNAUTHORIZED error when access token is not given', () => {
    const mockRequest = {
      cookies: {},
      headers: {}
    }

    mockValidateAccessToken.mockImplementation(() => {
      throw createUnauthorizedError()
    })

    const middlewareFunc = () => authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(middlewareFunc).toThrow(createUnauthorizedError())
  })

  it('Should throw UNAUTHORIZED error when access token is invalid', () => {
    const mockRequest = {
      cookies: { accessToken: 'invalid_token' },
      headers: {}
    }

    mockValidateAccessToken.mockImplementation(() => {
      throw createUnauthorizedError()
    })

    const middlewareFunc = () => authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(middlewareFunc).toThrow(createUnauthorizedError())
  })

  it('Should save userData from accessToken to a request object', () => {
    const payload = { userId: 'testId' }

    mockGenerateTokens.mockReturnValue({
      accessToken: 'mocked.jwt.token'
    })

    mockValidateAccessToken.mockReturnValue(payload)

    const { accessToken } = tokenService.generateTokens(payload)

    const mockRequest = {
      cookies: { accessToken },
      headers: {}
    }

    authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(mockRequest.user).toEqual(expect.objectContaining(payload))
    expect(mockNextFunc).toHaveBeenCalledTimes(1)
  })
})

describe('restrictTo middleware', () => {
  let mockNextFunc

  beforeEach(() => {
    mockNextFunc = jest.fn()
  })

  it('Should allow access for permitted role', () => {
    const mockRequest = { user: { role: 'admin' } }

    restrictTo('admin')(mockRequest, {}, mockNextFunc)

    expect(mockNextFunc).toHaveBeenCalledTimes(1)
    expect(mockNextFunc).toHaveBeenCalledWith()
  })

  it('Should deny access for non-permitted role', () => {
    const mockRequest = { user: { role: 'student' } }

    restrictTo('admin')(mockRequest, {}, mockNextFunc)

    expect(mockNextFunc).toHaveBeenCalledTimes(1)
    expect(mockNextFunc).toHaveBeenCalledWith(createForbiddenError())
  })
})
