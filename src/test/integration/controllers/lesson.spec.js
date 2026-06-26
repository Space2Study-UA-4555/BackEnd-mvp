const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { UNAUTHORIZED, INVALID_ID, DOCUMENT_NOT_FOUND, FORBIDDEN } = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')
const {
  roles: { TUTOR }
} = require('~/consts/auth')

const endpointUrl = '/lessons/'
const nonExistentId = '000000000000000000000000'

const testLessonData = {
  title: 'Test Lesson',
  description: 'A lesson about testing',
  content: 'Lesson content goes here',
  attachments: [],
  category: null
}

const updateLessonData = {
  title: 'Updated Lesson',
  description: 'Updated description'
}

const studentUserData = {
  role: 'student',
  firstName: 'Yamada',
  lastName: 'Kizen',
  email: 'yamakai@gmail.com',
  password: 'ninpopass',
  appLanguage: 'en',
  isEmailConfirmed: true,
  lastLogin: new Date().toJSON(),
  lastLoginAs: 'student'
}

const otherTutorData = {
  role: 'tutor',
  firstName: 'Other',
  lastName: 'Tutor',
  email: 'othertutor@gmail.com',
  password: 'Qwerty123@',
  appLanguage: 'en',
  isEmailConfirmed: true,
  lastLogin: new Date().toJSON(),
  lastLoginAs: 'tutor'
}

describe('Lesson controller', () => {
  let app, server, accessToken, testLesson

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    accessToken = await testUserAuthentication(app, { role: TUTOR })

    testLesson = await app
      .post(endpointUrl)
      .send(testLessonData)
      .set('Cookie', [`accessToken=${accessToken}`])
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe(`POST ${endpointUrl}`, () => {
    it('should create a new lesson', async () => {
      expect(testLesson.statusCode).toBe(201)
      expect(testLesson.body).toMatchObject({
        title: testLessonData.title,
        description: testLessonData.description,
        content: testLessonData.content,
        resourceType: 'lessons'
      })
      expect(testLesson.body._id).toBeDefined()
      expect(testLesson.body.author).toBeDefined()
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.post(endpointUrl).send(testLessonData)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN for non-tutor user', async () => {
      const studentAccessToken = await testUserAuthentication(app, studentUserData)

      const response = await app
        .post(endpointUrl)
        .send(testLessonData)
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(403, FORBIDDEN, response)
    })

    it('should return validation error for missing required fields', async () => {
      const response = await app
        .post(endpointUrl)
        .send({ description: 'No title provided' })
        .set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(409)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe(`GET ${endpointUrl}`, () => {
    it('should return lessons with items and count', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual(
        expect.objectContaining({
          items: expect.any(Array),
          count: expect.any(Number)
        })
      )
      expect(response.body.count).toBe(1)
    })

    it('should filter lessons by title', async () => {
      const response = await app.get(endpointUrl + '?title=Nonexistent').set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.count).toBe(0)
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl)

      expectError(401, UNAUTHORIZED, response)
    })
  })

  describe(`GET ${endpointUrl}:id`, () => {
    it('should return lesson by id', async () => {
      const response = await app.get(endpointUrl + testLesson.body._id).set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        _id: testLesson.body._id,
        title: testLessonData.title,
        description: testLessonData.description
      })
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl + testLesson.body._id)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw INVALID_ID for non-ObjectId value', async () => {
      const response = await app.get(endpointUrl + 'invalid-id').set('Cookie', [`accessToken=${accessToken}`])

      expectError(400, INVALID_ID, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const response = await app.get(endpointUrl + nonExistentId).set('Cookie', [`accessToken=${accessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Lesson']), response)
    })
  })

  describe(`PATCH ${endpointUrl}:id`, () => {
    it('should update lesson by id', async () => {
      const response = await app
        .patch(endpointUrl + testLesson.body._id)
        .send(updateLessonData)
        .set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        _id: testLesson.body._id,
        title: updateLessonData.title,
        description: updateLessonData.description
      })
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.patch(endpointUrl + testLesson.body._id).send(updateLessonData)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN when updating a lesson owned by another tutor', async () => {
      const otherTutorAccessToken = await testUserAuthentication(app, otherTutorData)

      const response = await app
        .patch(endpointUrl + testLesson.body._id)
        .send(updateLessonData)
        .set('Cookie', [`accessToken=${otherTutorAccessToken}`])

      expectError(403, FORBIDDEN, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for non-existent id', async () => {
      const response = await app
        .patch(endpointUrl + nonExistentId)
        .send(updateLessonData)
        .set('Cookie', [`accessToken=${accessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Lesson']), response)
    })
  })

  describe(`DELETE ${endpointUrl}:id`, () => {
    it('should delete lesson by id', async () => {
      const response = await app.delete(endpointUrl + testLesson.body._id).set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(204)
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.delete(endpointUrl + testLesson.body._id)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN when deleting a lesson owned by another tutor', async () => {
      const otherTutorAccessToken = await testUserAuthentication(app, otherTutorData)

      const response = await app
        .delete(endpointUrl + testLesson.body._id)
        .set('Cookie', [`accessToken=${otherTutorAccessToken}`])

      expectError(403, FORBIDDEN, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for non-existent id', async () => {
      const response = await app.delete(endpointUrl + nonExistentId).set('Cookie', [`accessToken=${accessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Lesson']), response)
    })
  })
})
