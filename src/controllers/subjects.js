const subjectService = require('~/services/subjects')

const createSubject = async (req, res) => {
  const data = req.body

  const newSubject = await subjectService.createSubject(data)

  res.status(201).json(newSubject)
}

module.exports = {
  createSubject
}
