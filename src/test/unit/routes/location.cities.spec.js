const request = require('supertest')
const express = require('express')

jest.mock('~/controllers/location', () => ({
  getCountries: jest.fn((req, res) => res.status(200).json([{ name: 'Ukraine', iso2: 'UA' }])),
  getCities: jest.fn((req, res) => res.status(200).json([{ name: 'Kyiv' }]))
}))

const locationRoutes = require('~/routes/location')

describe('Location routes — /cities', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use('/locations', locationRoutes)
  })

  it('GET /locations/cities should call controller and return cities', async () => {
    const response = await request(app).get('/locations/cities?countryCode=UA')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ name: 'Kyiv' }])
  })
})
