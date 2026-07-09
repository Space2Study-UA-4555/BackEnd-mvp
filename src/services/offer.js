const Offer = require('~/models/offer')
const { DOCUMENT_NOT_FOUND } = require('~/consts/errors')
const { createError, createForbiddenError } = require('~/utils/errorsHelper')

const filterAllowedFields = require('~/utils/filterAllowedFields')
const { allowedOfferFieldsForUpdate } = require('~/validation/services/offer')

const checkOfferExists = (offer) => {
  if (!offer) {
    throw createError(404, DOCUMENT_NOT_FOUND([Offer.modelName]))
  }
}

const checkOfferAuthor = (offer, currentUserId) => {
  const author = offer.author.toString()

  if (author !== currentUserId) {
    throw createForbiddenError()
  }
}

const offerService = {
  getOffers: async (pipeline) => {
    const [response] = await Offer.aggregate(pipeline).exec()
    return response
  },

  getOfferById: async (id) => {
    const offer = await Offer.findById(id)
      .populate([
        {
          path: 'author',
          select: ['firstName', 'lastName', 'totalReviews', 'averageRating', 'photo', 'professionalSummary', 'FAQ']
        },
        { path: 'subject', select: 'name' },
        { path: 'category', select: 'appearance' }
      ])
      .lean()
      .exec()

    checkOfferExists(offer)

    if (offer.author.FAQ && offer.authorRole in offer.author.FAQ) {
      offer.author.FAQ = offer.author.FAQ[offer.authorRole]
    } else {
      delete offer.author.FAQ
    }

    return offer
  },

  createOffer: async (author, authorRole, data) => {
    const { price, proficiencyLevel, title, description, languages, subject, category, status, FAQ } = data

    return await Offer.create({
      author,
      authorRole,
      price,
      proficiencyLevel,
      title,
      description,
      languages,
      subject,
      category,
      status,
      FAQ
    })
  },

  updateOffer: async (id, currentUserId, updateData) => {
    const filteredUpdateData = filterAllowedFields(updateData, allowedOfferFieldsForUpdate)

    const offer = await Offer.findById(id).exec()
    checkOfferExists(offer)
    checkOfferAuthor(offer, currentUserId)

    for (let field in filteredUpdateData) {
      offer[field] = filteredUpdateData[field]
    }

    await offer.validate()
    await offer.save()
  },

  deleteOffer: async (id, currentUserId) => {
    const offer = await Offer.findById(id).exec()
    checkOfferExists(offer)
    checkOfferAuthor(offer, currentUserId)

    await Offer.findByIdAndRemove(id).exec()
  }
}

module.exports = offerService
