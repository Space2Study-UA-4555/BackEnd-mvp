const {
  lengths: { MIN_NAME_LENGTH }
} = require('~/consts/validation')

const MAX_SUBJECT_NAME_LENGTH = 50

const subjectValidationSchema = {
  name: {
    type: 'string',
    required: true,
    length: {
      min: MIN_NAME_LENGTH,
      max: MAX_SUBJECT_NAME_LENGTH
    }
  },
  category: {
    type: 'string',
    required: true
  }
}

const updateSubjectValidationSchema = {
  name: {
    type: 'string',
    length: {
      min: MIN_NAME_LENGTH,
      max: MAX_SUBJECT_NAME_LENGTH
    }
  },
  category: {
    type: 'string'
  }
}

module.exports = {
  subjectValidationSchema,
  updateSubjectValidationSchema
}
