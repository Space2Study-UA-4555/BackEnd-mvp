const { OAuth2Client } = require('google-auth-library')
const {
  googleAuth: { clientId }
} = require('~/configs/config')
const { createError } = require('~/utils/errorsHelper')
const { INVALID_GOOGLE_TOKEN } = require('~/consts/errors')
const logger = require('~/logger/logger')

const client = new OAuth2Client(clientId)

const googleService = {
  validateGoogleToken: async (idToken) => {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId
      })

      return ticket.getPayload()
    } catch (err) {
      logger.error(err)
      throw createError(401, INVALID_GOOGLE_TOKEN)
    }
  }
}

module.exports = googleService
