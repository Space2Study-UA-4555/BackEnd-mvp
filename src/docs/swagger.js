const path = require('node:path')

const {
  config: { SERVER_URL }
} = require('~/configs/config')

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SpaceToStudy API',
      version: '1.0.0'
    },
    servers: [{ url: SERVER_URL || '/' }]
  },
  apis: [path.join(__dirname, '*.yaml')]
}

module.exports = swaggerOptions
