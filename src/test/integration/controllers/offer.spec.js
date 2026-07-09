const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const testUserAuthentication = require('~/utils/testUserAuth')
const Offer = require('~/models/offer')
const User = require('~/models/user')
const Category = require('~/models/category')
const Subject = require('~/models/subject')
const { FORBIDDEN, UNAUTHORIZED, DOCUMENT_NOT_FOUND } = require('~/consts/errors')
const {
  roles: { TUTOR }
} = require('~/consts/auth')

const endpointUrl = '/offers/'
const nonExistentId = '000000000000000000000000'

const offerAuthorUserData = {
  role: TUTOR,
  firstName: 'Offer',
  lastName: 'User',
  email: 'offer.author@gmail.com',
  password: 'Qwerty123@',
  isEmailConfirmed: true,
  lastLoginAs: TUTOR
}

const notInvolvedUserData = {
  role: TUTOR,
  firstName: 'NotInvolved',
  lastName: 'User',
  email: 'not.involved.offer@gmail.com',
  password: 'Qwerty123@',
  isEmailConfirmed: true,
  lastLoginAs: TUTOR
}

describe('Offer controller', () => {
  let app,
    server,
    offerAuthorAccessToken,
    notInvolvedUserAccessToken,
    offer,
    category,
    englishSubject,
    mathSubject,
    scienceCategory,
    offerAuthor

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    offerAuthorAccessToken = await testUserAuthentication(app, offerAuthorUserData)
    notInvolvedUserAccessToken = await testUserAuthentication(app, notInvolvedUserData)
    offerAuthor = await User.findOne({ email: offerAuthorUserData.email }).lean().exec()

    category = await Category.create({
      name: 'Languages',
      appearance: { icon: 'icon', color: '#FFFFFF' }
    })

    englishSubject = await Subject.create({
      name: 'English',
      category: category._id
    })

    mathSubject = await Subject.create({
      name: 'Math',
      category: category._id
    })

    scienceCategory = await Category.create({
      name: 'Science',
      appearance: { icon: 'icon', color: '#000000' }
    })

    offer = await Offer.create({
      author: offerAuthor._id,
      authorRole: TUTOR,
      title: 'English lessons',
      description: 'English lessons description',
      price: 100,
      proficiencyLevel: 'Beginner',
      languages: ['English'],
      subject: englishSubject._id,
      category: category._id,
      FAQ: [{ question: 'Question', answer: 'Answer' }]
    })

    await Offer.create({
      author: offerAuthor._id,
      authorRole: TUTOR,
      title: 'Math lessons',
      description: 'Math lessons description',
      price: 120,
      proficiencyLevel: 'Beginner',
      languages: ['English'],
      subject: mathSubject._id,
      category: scienceCategory._id,
      FAQ: [{ question: 'Question', answer: 'Answer' }]
    })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe(`POST ${endpointUrl}`, () => {
    it('should create offer when user is authenticated', async () => {
      const offerData = {
        price: 120,
        proficiencyLevel: 'Beginner',
        title: 'New English lessons',
        description: 'New English lessons description',
        languages: ['English'],
        subject: englishSubject._id.toString(),
        category: category._id.toString(),
        FAQ: [{ question: 'Question', answer: 'Answer' }]
      }

      const response = await app
        .post(endpointUrl)
        .send(offerData)
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        authorRole: TUTOR,
        title: offerData.title,
        price: offerData.price
      })
    })

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const response = await app.post(endpointUrl).send({ title: 'Unauthorized offer' })

      expectError(401, UNAUTHORIZED, response)
    })
  })

  describe(`GET ${endpointUrl}`, () => {
    it('should get all offers when user is authenticated', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('items')
      expect(response.body).toHaveProperty('count')
      expect(Array.isArray(response.body.items)).toBe(true)
    })

    it('should return subject and category in items', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.items).toHaveLength(2)

      const englishOffer = response.body.items.find((item) => item.title === 'English lessons')

      expect(englishOffer.subject).toMatchObject({
        _id: englishSubject._id.toString(),
        name: 'English'
      })
      expect(englishOffer.category).toMatchObject({
        _id: category._id.toString(),
        appearance: category.appearance
      })
    })

    it('should filter offers by subjectId query param', async () => {
      const response = await app
        .get(`${endpointUrl}?subjectId=${englishSubject._id.toString()}`)
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.count).toBe(1)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0].title).toBe('English lessons')
    })

    it('should filter offers by categoryId query param', async () => {
      const response = await app
        .get(`${endpointUrl}?categoryId=${scienceCategory._id.toString()}`)
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.count).toBe(1)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0].title).toBe('Math lessons')
    })
  })

  describe(`GET ${endpointUrl}:id`, () => {
    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const response = await app.get(endpointUrl + offer._id.toString())

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const response = await app
        .get(endpointUrl + nonExistentId)
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Offer']), response)
    })
  })

  describe(`PATCH ${endpointUrl}:id`, () => {
    it('should update offer when current user is offer author', async () => {
      const response = await app
        .patch(endpointUrl + offer._id.toString())
        .send({ title: 'Updated English lessons' })
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      const updatedOffer = await Offer.findById(offer._id).lean().exec()

      expect(response.statusCode).toBe(204)
      expect(updatedOffer.title).toBe('Updated English lessons')
    })

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const response = await app.patch(endpointUrl + offer._id.toString()).send({ title: 'Updated English lessons' })

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN when not involved user tries to update offer', async () => {
      const response = await app
        .patch(endpointUrl + offer._id.toString())
        .send({ title: 'Updated English lessons' })
        .set('Cookie', [`accessToken=${notInvolvedUserAccessToken}`])

      const unchangedOffer = await Offer.findById(offer._id).lean().exec()

      expect(response.statusCode).toBe(403)
      expectError(403, FORBIDDEN, response)
      expect(unchangedOffer.title).toBe(offer.title)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const response = await app
        .patch(endpointUrl + nonExistentId)
        .send({ title: 'Updated English lessons' })
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Offer']), response)
    })
  })

  describe(`DELETE ${endpointUrl}:id`, () => {
    it('should delete offer when current user is offer author', async () => {
      const response = await app
        .delete(endpointUrl + offer._id.toString())
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      const deletedOffer = await Offer.findById(offer._id).lean().exec()

      expect(response.statusCode).toBe(204)
      expect(deletedOffer).toBeNull()
    })

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const response = await app.delete(endpointUrl + offer._id.toString())

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN when not involved user tries to delete offer', async () => {
      const response = await app
        .delete(endpointUrl + offer._id.toString())
        .set('Cookie', [`accessToken=${notInvolvedUserAccessToken}`])

      const existingOffer = await Offer.findById(offer._id).lean().exec()

      expect(response.statusCode).toBe(403)
      expectError(403, FORBIDDEN, response)
      expect(existingOffer).not.toBeNull()
      expect(existingOffer.title).toBe(offer.title)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const response = await app
        .delete(endpointUrl + nonExistentId)
        .set('Cookie', [`accessToken=${offerAuthorAccessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Offer']), response)
    })
  })
})
