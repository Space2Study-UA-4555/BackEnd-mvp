require('~/initialization/envSetup')

const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const databaseInitialization = require('~/initialization/database')
const authService = require('~/services/auth')
const emailService = require('~/services/email')
const Token = require('~/models/token')
const User = require('~/models/user')
const errors = require('~/consts/errors')
const emailSubject = require('~/consts/emailSubject')
const tokenService = require('~/services/token')
const {
  tokenNames: { CONFIRM_TOKEN, REFRESH_TOKEN, RESET_TOKEN }
} = require('~/consts/auth')

jest.mock('~/services/email', () => ({
  sendEmail: jest.fn()
}))

describe('Auth service', () => {
  const user = {
    role: 'student',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@gmail.com',
    password: 'testpass_135',
    language: 'en'
  }

  beforeAll(async () => {
    await databaseInitialization()
  })

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase()
    }
    jest.clearAllMocks()
  })

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
  })

  it('should signup user, save confirm token and send confirmation email', async () => {
    const result = await authService.signup(
      user.role,
      user.firstName,
      user.lastName,
      user.email,
      user.password,
      user.language
    )

    const createdUser = await User.findOne({ email: user.email }).lean().exec()
    const savedToken = await Token.findOne({ user: result.userId }).lean().exec()

    expect(result).toMatchObject({
      userEmail: user.email
    })
    expect(result.userId.toString()).toBe(createdUser._id.toString())
    expect(savedToken[CONFIRM_TOKEN]).toBeDefined()
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      user.email,
      emailSubject.EMAIL_CONFIRMATION,
      user.language,
      expect.objectContaining({
        confirmToken: savedToken[CONFIRM_TOKEN],
        email: user.email,
        firstName: user.firstName
      })
    )
  })

  it('should store hashed password on signup, not the plain one', async () => {
    await authService.signup(user.role, user.firstName, user.lastName, user.email, user.password, user.language)

    const createdUser = await User.findOne({ email: user.email }).select('+password').lean().exec()

    expect(createdUser.password).not.toBe(user.password)
    expect(await bcrypt.compare(user.password, createdUser.password)).toBe(true)
  })

  it('should login confirmed user and return tokens', async () => {
    await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: true,
      lastLoginAs: user.role
    })

    const result = await authService.login(user.email, user.password)
    const savedToken = await Token.findOne({ refreshToken: result.refreshToken }).lean().exec()
    const updatedUser = await User.findOne({ email: user.email }).select('+isFirstLogin').lean().exec()

    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')
    expect(savedToken).toBeDefined()
    expect(updatedUser.isFirstLogin).toBe(false)
  })

  it('should throw EMAIL_NOT_CONFIRMED for unconfirmed user login', async () => {
    await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: false,
      lastLoginAs: user.role
    })

    await expect(authService.login(user.email, user.password)).rejects.toMatchObject({
      status: 401,
      code: errors.EMAIL_NOT_CONFIRMED.code
    })
  })

  it('should throw INCORRECT_CREDENTIALS for wrong password', async () => {
    await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: true,
      lastLoginAs: user.role
    })

    await expect(authService.login(user.email, 'wrongPassword')).rejects.toMatchObject({
      status: 401,
      code: errors.INCORRECT_CREDENTIALS.code
    })
  })

  it('should throw USER_NOT_FOUND for login if user does not exist', async () => {
    await expect(authService.login(user.email, user.password)).rejects.toMatchObject({
      status: 401,
      code: errors.USER_NOT_FOUND.code
    })
  })

  it('should refresh access token and return new tokens', async () => {
    await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: true,
      lastLoginAs: user.role
    })

    const loginResult = await authService.login(user.email, user.password)
    const savedTokenBeforeRefresh = await Token.findOne({ refreshToken: loginResult.refreshToken }).lean().exec()

    const tokens = await authService.refreshAccessToken(loginResult.refreshToken)
    const savedTokenAfterRefresh = await Token.findOne({ refreshToken: tokens.refreshToken }).lean().exec()

    expect(tokens).toHaveProperty('accessToken')
    expect(tokens).toHaveProperty('refreshToken')
    expect(savedTokenBeforeRefresh).toBeDefined()
    expect(savedTokenAfterRefresh).toBeDefined()
  })

  it('should throw BAD_REFRESH_TOKEN for invalid refresh token', async () => {
    await expect(authService.refreshAccessToken('invalid-refresh-token')).rejects.toMatchObject({
      status: 400,
      code: errors.BAD_REFRESH_TOKEN.code
    })
  })

  it('should logout user and remove refresh token', async () => {
    const createdUser = await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: true,
      lastLoginAs: user.role
    })
    const loginResult = await authService.login(user.email, user.password)
    const savedTokenBeforeLogout = await Token.findOne({
      user: createdUser._id,
      [REFRESH_TOKEN]: loginResult.refreshToken
    })
      .lean()
      .exec()

    await authService.logout(loginResult.refreshToken)

    const savedTokenAfterLogout = await Token.findOne({ [REFRESH_TOKEN]: loginResult.refreshToken })
      .lean()
      .exec()
    expect(savedTokenBeforeLogout).toBeDefined()
    expect(savedTokenAfterLogout).toBeNull()
  })

  it('should save reset token and send reset password email', async () => {
    const createdUser = await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: true,
      lastLoginAs: user.role
    })

    await authService.sendResetPasswordEmail(user.email, user.language)

    const savedToken = await Token.findOne({ user: createdUser._id }).lean().exec()
    expect(savedToken).toBeDefined()
    expect(savedToken[RESET_TOKEN]).toBeDefined()
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      user.email,
      emailSubject.RESET_PASSWORD,
      user.language,
      expect.objectContaining({
        resetToken: savedToken[RESET_TOKEN],
        email: user.email,
        firstName: user.firstName
      })
    )
  })

  it('should throw USER_NOT_FOUND for reset password email if user does not exist', async () => {
    await expect(authService.sendResetPasswordEmail(user.email, user.language)).rejects.toMatchObject({
      status: 404,
      code: errors.USER_NOT_FOUND.code
    })
  })

  it('should update password, remove reset token and send success email', async () => {
    const newPassword = 'newPassword_135'
    const createdUser = await User.create({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      appLanguage: user.language,
      isEmailConfirmed: true,
      lastLoginAs: user.role
    })

    const resetToken = tokenService.generateResetToken({
      id: createdUser._id,
      firstName: user.firstName,
      email: user.email
    })
    await tokenService.saveToken(createdUser._id, resetToken, RESET_TOKEN)

    await authService.updatePassword(resetToken, newPassword, user.language)

    const updatedUser = await User.findOne({ email: user.email }).select('+password').lean().exec()
    const updatedToken = await Token.findOne({ user: createdUser._id }).lean().exec()

    expect(updatedUser.password).not.toBe(newPassword)
    expect(await bcrypt.compare(newPassword, updatedUser.password)).toBe(true)
    expect(updatedToken[RESET_TOKEN]).toBeNull()
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      user.email,
      emailSubject.SUCCESSFUL_PASSWORD_RESET,
      user.language,
      expect.objectContaining({
        firstName: user.firstName
      })
    )
  })

  it('should throw BAD_RESET_TOKEN error', async () => {
    await expect(authService.updatePassword('invalid-token', 'newPassword_135', user.language)).rejects.toMatchObject({
      status: 400,
      code: errors.BAD_RESET_TOKEN.code
    })
  })
})
