const { Schema, model } = require('mongoose')

const {
  enums: { RESOURCES_TYPE_ENUM }
} = require('~/consts/validation')
const { QUIZ, QUESTION, USER, RESOURCES_CATEGORY } = require('~/consts/models')
const {
  ENUM_CAN_BE_ONE_OF,
  FIELD_CANNOT_BE_SHORTER,
  FIELD_CANNOT_BE_EMPTY,
  FIELD_CANNOT_BE_LONGER
} = require('~/consts/errors')

const quizSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, FIELD_CANNOT_BE_EMPTY('title')],
      minLength: [1, FIELD_CANNOT_BE_SHORTER('title', 1)],
      maxLength: [100, FIELD_CANNOT_BE_LONGER('title', 100)]
    },
    description: {
      type: String,
      trim: true,
      maxLength: [150, FIELD_CANNOT_BE_LONGER('description', 150)]
    },
    items: {
      type: [Schema.Types.ObjectId],
      required: [true, FIELD_CANNOT_BE_EMPTY('items')],
      ref: QUESTION
    },
    author: {
      type: Schema.Types.ObjectId,
      required: [true, FIELD_CANNOT_BE_EMPTY('author')],
      ref: USER
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: RESOURCES_CATEGORY
    },
    resourceType: {
      type: String,
      required: [true, FIELD_CANNOT_BE_EMPTY('resourceType')],
      enum: {
        values: RESOURCES_TYPE_ENUM,
        message: ENUM_CAN_BE_ONE_OF('resource type', RESOURCES_TYPE_ENUM)
      },
      default: RESOURCES_TYPE_ENUM[0]
    },
    settings: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

module.exports = model(QUIZ, quizSchema)
