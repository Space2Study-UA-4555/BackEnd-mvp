const { Schema, model } = require('mongoose')
const { CATEGORY } = require('~/consts/models')
const {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_CANNOT_BE_LONGER,
  FIELD_CANNOT_BE_SHORTER,
  INVALID_HEX_COLOR
} = require('~/consts/errors')
const {
  regex: { COLOR_PATTERN }
} = require('~/consts/validation')

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, FIELD_CANNOT_BE_EMPTY('name')],
      minLength: [1, FIELD_CANNOT_BE_SHORTER('name', 1)],
      maxLength: [50, FIELD_CANNOT_BE_LONGER('name', 50)]
    },
    appearance: {
      icon: {
        type: String,
        required: [true, FIELD_CANNOT_BE_EMPTY('icon')],
        default: 'mocked-path-to-icon'
      },
      color: {
        type: String,
        required: [true, FIELD_CANNOT_BE_EMPTY('color')],
        default: '#66C42C',
        trim: true,
        validate: {
          validator: (value) => COLOR_PATTERN.test(value),
          message: INVALID_HEX_COLOR.message
        }
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

module.exports = model(CATEGORY, categorySchema)
