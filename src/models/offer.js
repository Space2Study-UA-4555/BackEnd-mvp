const { Schema, model } = require('mongoose')

const {
  enums: { MAIN_ROLE_ENUM, SPOKEN_LANG_ENUM, PROFICIENCY_LEVEL_ENUM, OFFER_STATUS_ENUM }
} = require('~/consts/validation')
const { USER, OFFER, SUBJECT, CATEGORY } = require('~/consts/models')
const {
  ENUM_CAN_BE_ONE_OF,
  FIELD_CANNOT_BE_SHORTER,
  FIELD_CANNOT_BE_EMPTY,
  FIELD_CANNOT_BE_LONGER,
  VALUE_MUST_BE_ABOVE
} = require('~/consts/errors')

const offerSchema = new Schema(
  {
    price: {
      type: Number,
      required: [true, FIELD_CANNOT_BE_EMPTY('price')],
      min: [1, VALUE_MUST_BE_ABOVE('price', 0)]
    },
    proficiencyLevel: {
      type: String,
      required: [true, FIELD_CANNOT_BE_EMPTY('proficiencyLevel')],
      enum: {
        values: PROFICIENCY_LEVEL_ENUM,
        message: ENUM_CAN_BE_ONE_OF('proficiency level', PROFICIENCY_LEVEL_ENUM)
      }
    },
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
      required: [true, FIELD_CANNOT_BE_EMPTY('description')],
      minLength: [1, FIELD_CANNOT_BE_SHORTER('description', 1)],
      maxLength: [1000, FIELD_CANNOT_BE_LONGER('description', 1000)]
    },
    languages: {
      type: [String],
      required: [true, FIELD_CANNOT_BE_EMPTY('languages')],
      default: undefined,
      enum: {
        values: SPOKEN_LANG_ENUM,
        message: ENUM_CAN_BE_ONE_OF('language', SPOKEN_LANG_ENUM)
      }
    },
    authorRole: {
      type: String,
      required: [true, FIELD_CANNOT_BE_EMPTY('authorRole')],
      enum: {
        values: MAIN_ROLE_ENUM,
        message: ENUM_CAN_BE_ONE_OF('author role', MAIN_ROLE_ENUM)
      }
    },
    author: {
      type: Schema.Types.ObjectId,
      required: [true, FIELD_CANNOT_BE_EMPTY('author')],
      ref: USER
    },
    subject: {
      type: Schema.Types.ObjectId,
      required: [true, FIELD_CANNOT_BE_EMPTY('subject')],
      ref: SUBJECT
    },
    category: {
      type: Schema.Types.ObjectId,
      required: [true, FIELD_CANNOT_BE_EMPTY('category')],
      ref: CATEGORY
    },
    status: {
      type: String,
      enum: {
        values: OFFER_STATUS_ENUM,
        message: ENUM_CAN_BE_ONE_OF('offer status', OFFER_STATUS_ENUM)
      },
      default: OFFER_STATUS_ENUM[0]
    },
    FAQ: {
      type: [
        {
          question: {
            type: String,
            trim: true,
            required: [true, FIELD_CANNOT_BE_EMPTY('question')]
          },
          answer: {
            type: String,
            trim: true,
            required: [true, FIELD_CANNOT_BE_EMPTY('answer')]
          }
        }
      ]
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

module.exports = model(OFFER, offerSchema)
