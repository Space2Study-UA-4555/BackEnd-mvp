const Category = require('~/models/category')
const Subject = require('~/models/subject')
const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError, createAccessToken } = require('~/test/helpers')
const {
  UNAUTHORIZED,
  DOCUMENT_ALREADY_EXISTS,
  VALIDATION_ERROR,
  INVALID_ID,
  DOCUMENT_NOT_FOUND
} = require('~/consts/errors')
const {
  roles: { TUTOR, STUDENT, ADMIN }
} = require('~/consts/auth')

const endpointUrl = '/categories/'

describe('Category', () => {
  let app, server

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe('POST /categories', () => {
    let adminAccessToken, studentAccessToken, tutorAccessToken

    beforeEach(async () => {
      await Category.syncIndexes()

      adminAccessToken = await createAccessToken(app, ADMIN)
      studentAccessToken = await createAccessToken(app, STUDENT)
      tutorAccessToken = await createAccessToken(app, TUTOR)
    })

    afterEach(async () => {
      await serverCleanup()
    })

    it('should create category', async () => {
      const category = {
        name: 'Frontend',
        appearance: {
          icon: 'icon',
          color: '#FFFFFF'
        }
      }

      const response = await app
        .post(endpointUrl)
        .send(category)
        .set('Cookie', [`accessToken=${adminAccessToken}`])

      expect(response.statusCode).toBe(201)

      expect(response.body).toMatchObject({
        name: category.name,
        appearance: category.appearance,
        totalOffers: {
          student: 0,
          tutor: 0
        }
      })

      expect(response.body._id).toBeDefined()
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.post(endpointUrl).send({
        name: 'Frontend test UNAUTHORIZED'
      })

      expectError(401, UNAUTHORIZED, response)
    })

    it('should forbid student to create category', async () => {
      const response = await app
        .post(endpointUrl)
        .send({
          name: 'Frontend forbid student user'
        })
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(403)
    })

    it('should forbid tutor to create category', async () => {
      const response = await app
        .post(endpointUrl)
        .send({
          name: 'Frontend forbid tutor user'
        })
        .set('Cookie', [`accessToken=${tutorAccessToken}`])

      expect(response.statusCode).toBe(403)
    })

    it('should throw DOCUMENT_ALREADY_EXISTS', async () => {
      const category = {
        name: 'Frontend'
      }

      const newCategory = {
        name: 'Frontend'
      }

      await app
        .post(endpointUrl)
        .send(category)
        .set('Cookie', [`accessToken=${adminAccessToken}`])

      await app
        .post(endpointUrl)
        .send(newCategory)
        .set('Cookie', [`accessToken=${adminAccessToken}`])

      const response = await app
        .post(endpointUrl)
        .send(newCategory)
        .set('Cookie', [`accessToken=${adminAccessToken}`])

      expectError(409, DOCUMENT_ALREADY_EXISTS('name'), response)
    })

    it('should throw validation error for invalid color', async () => {
      const response = await app
        .post(endpointUrl)
        .send({
          name: 'Frontend invalid color',
          appearance: {
            icon: 'icon',
            color: 'green'
          }
        })
        .set('Cookie', [`accessToken=${adminAccessToken}`])

      expectError(
        409,
        VALIDATION_ERROR('Category validation failed: appearance.color: Color must be a valid HEX color'),
        response
      )
    })

    it('should create category with default appearance values', async () => {
      const response = await app
        .post(endpointUrl)
        .send({
          name: 'Backend'
        })
        .set('Cookie', [`accessToken=${adminAccessToken}`])

      expect(response.statusCode).toBe(201)

      expect(response.body).toMatchObject({
        name: 'Backend',
        appearance: {
          icon: 'mocked-path-to-icon',
          color: '#66C42C'
        },
        totalOffers: {
          student: 0,
          tutor: 0
        }
      })
    })
  })

  describe('GET /categories', () => {
    let studentAccessToken

    beforeEach(async () => {
      studentAccessToken = await createAccessToken(app, STUDENT)

      await Category.create([{ name: 'Frontend' }, { name: 'Backend' }, { name: 'Design' }])
    })

    afterEach(async () => {
      await serverCleanup()
      await Category.syncIndexes()
    })

    it('should return all categories', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)

      expect(response.body.count).toBe(3)
      expect(response.body.items).toHaveLength(3)

      expect(response.body.items[0]).toHaveProperty('_id')
      expect(response.body.items[0]).toHaveProperty('name')
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl)

      expect(response.statusCode).toBe(401)
      expectError(401, UNAUTHORIZED, response)
    })

    it('should filter categories by name', async () => {
      const response = await app.get(`${endpointUrl}?name=Front`).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)

      expect(response.body.count).toBe(1)
      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0].name).toBe('Frontend')
    })

    it('should return categories with pagination', async () => {
      const response = await app
        .get(`${endpointUrl}?skip=1&limit=1`)
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)

      expect(response.body.count).toBe(3)
      expect(response.body.items).toHaveLength(1)
    })
  })

  describe('GET /categories/names', () => {
    let studentAccessToken

    const endpointUrl = '/categories/names'

    beforeEach(async () => {
      studentAccessToken = await createAccessToken(app, STUDENT)

      await Category.create([{ name: 'Frontend' }, { name: 'Backend' }, { name: 'Design' }])
    })

    afterEach(async () => {
      await serverCleanup()
      await Category.syncIndexes()
    })

    it('should return category names', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)

      expect(response.body).toHaveLength(3)

      response.body.forEach((category) => {
        expect(category).toHaveProperty('_id')
        expect(category).toHaveProperty('name')
        expect(Object.keys(category)).toEqual(expect.arrayContaining(['_id', 'name']))
      })

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Frontend' }),
          expect.objectContaining({ name: 'Backend' }),
          expect.objectContaining({ name: 'Design' })
        ])
      )
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl)

      expect(response.statusCode).toBe(401)
      expectError(401, UNAUTHORIZED, response)
    })

    it('should return empty array when there are no categories', async () => {
      await Category.deleteMany({})

      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe(`GET ${endpointUrl}:id`, () => {
    let category, studentAccessToken

    beforeEach(async () => {
      studentAccessToken = await createAccessToken(app, STUDENT)

      category = await Category.create({
        name: 'Frontend'
      })
    })

    afterEach(async () => {
      await serverCleanup()
      await Category.syncIndexes()
    })

    it('should return category by id', async () => {
      const response = await app.get(endpointUrl + category._id).set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)

      expect(response.body).toMatchObject({
        _id: category._id.toString(),
        name: 'Frontend'
      })
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(endpointUrl + category._id)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw INVALID_ID for non-ObjectId value', async () => {
      const response = await app.get(endpointUrl + 'invalid-id').set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(400, INVALID_ID, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const response = await app
        .get(endpointUrl + '000000000000000000000000')
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Category']), response)
    })
  })

  describe('Category controller - get subject names by category id', () => {
    let studentAccessToken, category

    beforeEach(async () => {
      studentAccessToken = await createAccessToken(app, STUDENT)

      category = await Category.create({
        name: 'Frontend'
      })

      await Subject.create([
        {
          name: 'React',
          category: category._id
        },
        {
          name: 'JavaScript',
          category: category._id
        }
      ])
    })

    afterEach(async () => {
      await serverCleanup()
      await Category.syncIndexes()
      await Subject.syncIndexes()
    })

    it('should return subject names by category id', async () => {
      const response = await app
        .get(`/categories/${category._id}/subjects/names`)
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)

      expect(response.body).toHaveLength(2)

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'React'
          }),
          expect.objectContaining({
            name: 'JavaScript'
          })
        ])
      )

      response.body.forEach((subject) => {
        expect(subject).toHaveProperty('_id')
        expect(subject).toHaveProperty('name')
      })
    })

    it('should return empty array when category has no subjects', async () => {
      const emptyCategory = await Category.create({
        name: 'Backend'
      })

      const response = await app
        .get(`/categories/${emptyCategory._id}/subjects/names`)
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual([])
    })

    it('should throw UNAUTHORIZED', async () => {
      const response = await app.get(`/categories/${category._id}/subjects/names`)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw INVALID_ID for non-ObjectId value', async () => {
      const response = await app
        .get('/categories/invalid-id/subjects/names')
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(400, INVALID_ID, response)
    })

    it('should throw DOCUMENT_NOT_FOUND for valid but non-existent id', async () => {
      const response = await app
        .get('/categories/000000000000000000000000/subjects/names')
        .set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(404, DOCUMENT_NOT_FOUND(['Category']), response)
    })
  })

  describe('Category model', () => {
    it('should trim category name', () => {
      const category = new Category({
        name: '   Frontend Trim   ',
        appearance: {
          icon: 'icon',
          color: '#FFFFFF'
        }
      })

      category.validateSync()

      expect(category.name).toBe('Frontend Trim')
    })

    it('should throw validation error when name is missing', () => {
      const category = new Category({
        appearance: {
          icon: 'icon',
          color: '#FFFFFF'
        }
      })

      const error = category.validateSync()

      expect(error.errors.name).toBeDefined()
    })

    it('should throw validation error when name is longer than 50 characters', () => {
      const category = new Category({
        name: 'a'.repeat(51),
        appearance: {
          icon: 'icon',
          color: '#FFFFFF'
        }
      })

      const error = category.validateSync()

      expect(error.errors.name).toBeDefined()
    })

    it('should throw validation error when color is not valid hex', () => {
      const category = new Category({
        name: 'Frontend color is not a hash',
        appearance: {
          icon: 'icon',
          color: 'green'
        }
      })

      const error = category.validateSync()

      expect(error.errors['appearance.color']).toBeDefined()
    })
  })
})
