const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { UNAUTHORIZED, INVALID_ID, DOCUMENT_NOT_FOUND } = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')
const {
  roles: { TUTOR }
} = require('~/consts/auth')

const endpointUrl = '/questions/'

const testQuestionData = {
  title: 'Test Question',
  text: 'What is 2+2?',
  answers: [
    { text: 'Three', isCorrect: false },
    { text: 'Four', isCorrect: true }
  ],
  type: 'multipleChoice'
}

describe('Question controller', () => {
  let app, server, accessToken, testQuestion

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    accessToken = await testUserAuthentication(app, { role: TUTOR })

    testQuestion = await app
      .post(endpointUrl)
      .send(testQuestionData)
      .set('Cookie', [`accessToken=${accessToken}`])
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe(`GET ${endpointUrl}:id`, () => {
    it('should return question by id', async () => {
      const response = await app
        .get(endpointUrl + testQuestion.body._id)
        .set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({
        _id: testQuestion.body._id,
        title: testQuestionData.title,
        text: testQuestionData.text,
        type: testQuestionData.type
      })
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl + testQuestion.body._id)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw INVALID_ID for non-ObjectId value', async () => {
      const response = await app
        .get(endpointUrl + 'invalid-id')
        .set('Cookie', [`accessToken=${accessToken}`])

      expectError(400, INVALID_ID, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const nonExistentId = '000000000000000000000000'
      const response = await app
        .get(endpointUrl + nonExistentId)
        .set('Cookie', [`accessToken=${accessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Question']), response)
    })
  })
})
