const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const {
  UNAUTHORIZED,
  FORBIDDEN,
  DOCUMENT_NOT_FOUND,
  FIELD_IS_NOT_DEFINED,
  DOCUMENT_ALREADY_EXISTS,
  INVALID_ID
} = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')

const Category = require('~/models/category')
const Subject = require('~/models/subject')

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
    await Subject.syncIndexes()
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

    it('should throw DOCUMENT_ALREADY_EXISTS for duplicate subject in the same category', async () => {
      const subjectData = {
        name: 'English',
        category: category._id.toString()
      }

      await app
        .post(endpointUrl)
        .send(subjectData)
        .set('Cookie', [`accessToken=${accessToken}`])

      const response = await app
        .post(endpointUrl)
        .send(subjectData)
        .set('Cookie', [`accessToken=${accessToken}`])

      expectError(409, DOCUMENT_ALREADY_EXISTS('name, category'), response)
    })
  })

  describe(`GET ${endpointUrl}`, () => {
    it('should get subjects for authenticated user', async () => {
      await Subject.create({
        name: 'English',
        category: category._id
      })

      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        items: [
          {
            _id: expect.any(String),
            name: 'English',
            category: {
              _id: category._id.toString(),
              name: category.name
            },
            totalOffers: {
              student: 0,
              tutor: 0
            },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }
        ],
        count: 1
      })
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should filter subjects by name', async () => {
      await Subject.create({
        name: 'English',
        category: category._id
      })

      await Subject.create({
        name: 'Spanish',
        category: category._id
      })

      const response = await app.get(`${endpointUrl}?name=Eng`).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.items).toHaveLength(1)
      expect(response.body).toMatchObject({
        items: [
          {
            _id: expect.any(String),
            name: 'English',
            category: {
              _id: category._id.toString(),
              name: category.name
            },
            totalOffers: {
              student: 0,
              tutor: 0
            },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }
        ],
        count: 1
      })
    })

    it('should filter subjects by category', async () => {
      const secondCategory = await Category.create({
        name: 'Math'
      })

      await Subject.create({
        name: 'English',
        category: category._id
      })

      await Subject.create({
        name: 'Algebra',
        category: secondCategory._id
      })

      const response = await app
        .get(`${endpointUrl}?categories=${secondCategory._id.toString()}`)
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.items).toHaveLength(1)
      expect(response.body).toMatchObject({
        items: [
          {
            _id: expect.any(String),
            name: 'Algebra',
            category: {
              _id: secondCategory._id.toString(),
              name: secondCategory.name
            },
            totalOffers: {
              student: 0,
              tutor: 0
            },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }
        ],
        count: 1
      })
    })

    it('should return empty subjects list', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({
        items: [],
        count: 0
      })
    })
  })

  describe(`GET ${endpointUrl}:id`, () => {
    let subject

    beforeEach(async () => {
      subject = await Subject.create({
        name: 'English',
        category: category._id
      })
    })

    it('should return subject by id for authenticated user', async () => {
      const response = await app
        .get(endpointUrl + subject._id.toString())
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        _id: subject._id.toString(),
        name: subject.name,
        category: {
          _id: category._id.toString(),
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
      const response = await app.get(endpointUrl + subject._id.toString())

      expect(response.statusCode).toBe(401)
      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw INVALID_ID for non-ObjectId value', async () => {
      const response = await app.get(endpointUrl + 'invalid-id').set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(400)
      expectError(400, INVALID_ID, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const nonExistentId = '000000000000000000000000'
      const response = await app.get(endpointUrl + nonExistentId).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(404)
      expectError(404, DOCUMENT_NOT_FOUND(['Subject']), response)
    })
  })
})
