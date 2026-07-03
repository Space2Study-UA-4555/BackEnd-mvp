const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { UNAUTHORIZED, FORBIDDEN, DOCUMENT_NOT_FOUND, FIELD_IS_NOT_DEFINED } = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')

const Category = require('~/models/category')

const {
  roles: { ADMIN }
} = require('~/consts/auth')

const endpointUrl = '/subjects/'

const adminUserData = {
  role: ADMIN,
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin.subjects@gmail.com',
  password: 'Qwerty123@',
  appLanguage: 'en',
  isEmailConfirmed: true,
  lastLoginAs: ADMIN
}

const studentUserData = {
  role: 'student',
  firstName: 'Student',
  lastName: 'User',
  email: 'student.subjects@gmail.com',
  password: 'Qwerty123@',
  appLanguage: 'en',
  isEmailConfirmed: true,
  lastLoginAs: 'student'
}

describe('Subject controller', () => {
  let app, server, accessToken, studentAccessToken, category

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    accessToken = await testUserAuthentication(app, adminUserData)
    studentAccessToken = await testUserAuthentication(app, studentUserData)
    category = await Category.create({
      name: 'Languages'
    })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe(`POST ${endpointUrl}`, () => {
    it('should create subject for admin', async () => {
      const subjectData = {
        name: 'English',
        category: category._id.toString()
      }

      const response = await app
        .post(endpointUrl)
        .send(subjectData)
        .set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        _id: expect.any(String),
        name: subjectData.name,
        category: {
          _id: subjectData.category,
          name: category.name
        },
        totalOffers: {
          student: 0,
          tutor: 0
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.post(endpointUrl)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN for non-admin user', async () => {
      const response = await app
        .post(endpointUrl)
        .send({
          name: 'English',
          category: category._id.toString()
        })
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(403, FORBIDDEN, response)
    })

    it('should throw FIELD_IS_NOT_DEFINED for missing required field', async () => {
      const subjectData = {
        name: 'English'
      }

      const response = await app
        .post(endpointUrl)
        .send(subjectData)
        .set('Cookie', [`accessToken=${accessToken}`])

      expectError(422, FIELD_IS_NOT_DEFINED('category'), response)
    })

    it('should throw DOCUMENT_NOT_FOUND for non-existing category id', async () => {
      const subjectData = {
        name: 'English',
        category: '000000000000000000000000'
      }

      const response = await app
        .post(endpointUrl)
        .send(subjectData)
        .set('Cookie', [`accessToken=${accessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Category']), response)
    })
  })
})
