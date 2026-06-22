const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const {
  lengths: { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH },
  enums: { ROLE_ENUM }
} = require('~/consts/validation')
const errors = require('~/consts/errors')
const tokenService = require('~/services/token')
const Token = require('~/models/token')
const User = require('~/models/user')
const { expectError } = require('~/test/helpers')
const googleService = require('~/services/google')
const { createError } = require('~/utils/errorsHelper')

jest.mock('~/services/google', () => ({
  validateGoogleToken: jest.fn()
}))
describe('Auth controller', () => {
  let app, server, signupResponse

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    signupResponse = await app.post('/auth/signup').send(user)
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  const user = {
    role: 'student',
    firstName: 'test',
    lastName: 'test',
    email: 'test@gmail.com',
    password: 'testpass_135'
  }

  describe('Signup endpoint', () => {
    it('should throw validation errors for the firstName field', async () => {
      const responseForFormat = await app.post('/auth/signup').send({ ...user, firstName: '12345' })
      const responseForNull = await app.post('/auth/signup').send({ ...user, firstName: null })

      const formatError = errors.NAME_FIELD_IS_NOT_OF_PROPER_FORMAT('firstName')
      const nullError = errors.FIELD_IS_NOT_DEFINED('firstName')
      expectError(422, formatError, responseForFormat)
      expectError(422, nullError, responseForNull)
    })

    it('should throw validation errors for the email format', async () => {
      const responseForFormat = await app.post('/auth/signup').send({ ...user, email: 'test' })
      const responseForType = await app.post('/auth/signup').send({ ...user, email: 312938 })

      const formatError = errors.FIELD_IS_NOT_OF_PROPER_FORMAT('email')
      const typeError = errors.FIELD_IS_NOT_OF_PROPER_TYPE('email', 'string')
      expectError(422, formatError, responseForFormat)
      expectError(422, typeError, responseForType)
    })

    it('should throw validation error for the role value', async () => {
      const signupResponse = await app.post('/auth/signup').send({ ...user, role: 'test' })

      const error = errors.FIELD_IS_NOT_OF_PROPER_ENUM_VALUE('role', ROLE_ENUM)
      expectError(422, error, signupResponse)
    })

    it('should throw validation errors for the password`s length', async () => {
      const responseForMax = await app
        .post('/auth/signup')
        .send({ ...user, password: '1'.repeat(MAX_PASSWORD_LENGTH + 1) })

      const responseForMin = await app
        .post('/auth/signup')
        .send({ ...user, password: '1'.repeat(MIN_PASSWORD_LENGTH - 1) })

      const error = errors.FIELD_IS_NOT_OF_PROPER_LENGTH('password', {
        min: MIN_PASSWORD_LENGTH,
        max: MAX_PASSWORD_LENGTH
      })
      expectError(422, error, responseForMax)
      expectError(422, error, responseForMin)
    })

    it('should throw ALREADY_REGISTERED error', async () => {
      await app.post('/auth/signup').send(user)

      const response = await app.post('/auth/signup').send(user)

      expectError(409, errors.ALREADY_REGISTERED, response)
    })
  })

  describe('SendResetPasswordEmail endpoint', () => {
    it('should throw USER_NOT_FOUND error', async () => {
      const response = await app.post('/auth/forgot-password').send({ email: 'invalid@gmail.com' })

      expectError(404, errors.USER_NOT_FOUND, response)
    })
  })

  describe('UpdatePassword endpoint', () => {
    let resetToken
    beforeEach(() => {
      const { firstName, email, role } = user

      resetToken = tokenService.generateResetToken({ id: signupResponse.body.userId, firstName, email, role })

      Token.findOne = jest.fn().mockResolvedValue({ save: jest.fn().mockResolvedValue(resetToken) })
    })
    afterEach(() => jest.resetAllMocks())

    it('should throw BAD_RESET_TOKEN error', async () => {
      const response = await app.patch('/auth/reset-password/invalid-token').send({ password: 'valid_pass1' })

      expectError(400, errors.BAD_RESET_TOKEN, response)
    })
  })

  describe('GoogleAuth endpoint ', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should signup and login user with valid Google token', async () => {
      const googleUserEmail = 'google-user@gmail.com'

      googleService.validateGoogleToken.mockResolvedValue({
        email: googleUserEmail,
        given_name: user.firstName,
        family_name: user.lastName
      })

      const response = await app.post('/auth/google-auth').send({
        token: {
          credential: 'valid-google-token'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.headers['set-cookie']).toBeDefined()
      expect(googleService.validateGoogleToken).toHaveBeenCalledWith('valid-google-token')
    })

    it('should login existing unconfirmed user and confirm email with valid Google token', async () => {
      googleService.validateGoogleToken.mockResolvedValue({
        email: user.email,
        given_name: user.firstName,
        family_name: user.lastName
      })

      const response = await app.post('/auth/google-auth').send({
        token: {
          credential: 'valid-google-token'
        }
      })

      const updatedUser = await User.findOne({ email: user.email }).select('+isEmailConfirmed').lean().exec()

      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.headers['set-cookie']).toBeDefined()
      expect(updatedUser.isEmailConfirmed).toBe(true)
      expect(googleService.validateGoogleToken).toHaveBeenCalledWith('valid-google-token')
    })

    it('should throw INVALID_GOOGLE_TOKEN error if Google token is invalid ', async () => {
      googleService.validateGoogleToken.mockRejectedValue(createError(401, errors.INVALID_GOOGLE_TOKEN))

      const response = await app.post('/auth/google-auth').send({
        token: {
          credential: 'invalid-google-token'
        }
      })

      expectError(401, errors.INVALID_GOOGLE_TOKEN, response)
      expect(googleService.validateGoogleToken).toHaveBeenCalledWith('invalid-google-token')
    })

    it('should throw validation error if token is missing', async () => {
      const response = await app.post('/auth/google-auth').send({})

      expectError(422, errors.FIELD_IS_NOT_DEFINED('token'), response)
      expect(googleService.validateGoogleToken).not.toHaveBeenCalled()
    })

    it('should throw validation error if credential is missing', async () => {
      const response = await app.post('/auth/google-auth').send({ token: {} })

      expectError(422, errors.FIELD_IS_NOT_DEFINED('token.credential'), response)
      expect(googleService.validateGoogleToken).not.toHaveBeenCalled()
    })
  })

  describe('ConfirmEmail endpoint', () => {
    let confirmToken
    let createdUser

    beforeEach(async () => {
      createdUser = await User.create({
        role: ['student'],
        firstName: 'Test',
        lastName: 'User',
        email: 'confirm@test.com',
        password: '12345qwerty'
      })

      confirmToken = tokenService.generateConfirmToken({
        id: createdUser._id,
        role: 'student'
      })

      await Token.create({
        user: createdUser._id,
        confirmToken
      })
    })

    it('should confirm user email', async () => {
      const response = await app.patch(`/auth/confirm-email/${confirmToken}`)

      const updatedUser = await User.findById(createdUser._id).select('+isEmailConfirmed').lean().exec()

      expect(response.statusCode).toBe(204)
      expect(updatedUser.isEmailConfirmed).toBe(true)
    })

    it('should throw BAD_CONFIRM_TOKEN error', async () => {
      const response = await app.patch('/auth/confirm-email/invalid-token')
      expectError(400, errors.BAD_CONFIRM_TOKEN, response)
    })
  })
})
