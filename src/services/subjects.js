const Subject = require('~/models/subject')

const subjectService = {
  createSubject: async (data) => {
    const { name, category } = data

    const subject = await Subject.create({
      name,
      category
    })

    return await subject.populate({ path: 'category', select: '_id name' })
  }
}

module.exports = subjectService
