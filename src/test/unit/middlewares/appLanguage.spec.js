const langMiddleware = require('~/middlewares/appLanguage')
const { INVALID_LANGUAGE } = require('~/consts/errors')
const {
  enums: { APP_LANG_ENUM }
} = require('~/consts/validation')

describe('Language middleware', () => {
  const mockResponse = {}
  let mockNextFunc

  beforeEach(() => {
    mockNextFunc = jest.fn()
  })

  it('Should throw INVALID_LANGUAGE error when no supported language is accepted', () => {
    const mockRequest = { acceptsLanguages: jest.fn().mockReturnValue(false) }

    const middlewareFunc = () => langMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(middlewareFunc).toThrow(
      expect.objectContaining({
        status: 400,
        code: INVALID_LANGUAGE.code,
        message: INVALID_LANGUAGE.message
      })
    )
    expect(mockNextFunc).not.toHaveBeenCalled()
  })

  it('Should save the detected language to a request object and call next', () => {
    const mockRequest = { acceptsLanguages: jest.fn().mockReturnValue('ua') }

    langMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(mockRequest.lang).toBe('ua')
    expect(mockNextFunc).toHaveBeenCalled()
  })

  it('Should resolve the language against the APP_LANG_ENUM options', () => {
    const mockRequest = { acceptsLanguages: jest.fn().mockReturnValue('en') }

    langMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(mockRequest.acceptsLanguages).toHaveBeenCalledWith(...APP_LANG_ENUM)
  })
})
