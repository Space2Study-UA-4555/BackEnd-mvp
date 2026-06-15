const googleAuthValidationSchema = {
  token: {
    type: 'object',
    required: true,
    properties: {
      credential: {
        type: 'string',
        required: true
      }
    }
  }
}

module.exports = googleAuthValidationSchema
