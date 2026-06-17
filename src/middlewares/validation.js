const { createError } = require('~/utils/errorsHelper')
const { BODY_IS_NOT_DEFINED } = require('~/consts/errors')
const { validateRequired, validateFunc } = require('~/utils/validationHelper')

const validateField = (schemaFieldKey, schemaFieldValue, reqBodyField) => {
  validateRequired(schemaFieldKey, schemaFieldValue?.required, reqBodyField)

  if (!reqBodyField) {
    return
  }

  Object.entries(schemaFieldValue).forEach(([validationType, validationValue]) => {
    if (validationType === 'properties') {
      return
    }

    validateFunc[validationType](schemaFieldKey, validationValue, reqBodyField)
  })

  if (schemaFieldValue.properties) {
    Object.entries(schemaFieldValue.properties).forEach(([nestedFieldKey, nestedFieldValue]) => {
      validateField(`${schemaFieldKey}.${nestedFieldKey}`, nestedFieldValue, reqBodyField[nestedFieldKey])
    })
  }
}

const validationMiddleware = (schema) => {
  return (req, _res, next) => {
    const { body } = req
    if (!body) {
      throw createError(422, BODY_IS_NOT_DEFINED)
    }

    Object.entries(schema).forEach(([schemaFieldKey, schemaFieldValue]) => {
      validateField(schemaFieldKey, schemaFieldValue, body[schemaFieldKey])
    })

    next()
  }
}

module.exports = validationMiddleware
