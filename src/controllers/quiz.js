const quizService = require('~/services/quiz')

const deleteQuiz = async (req, res) => {
  const { id: currentUserId } = req.user
  const { id } = req.params

  await quizService.deleteQuiz(id, currentUserId)

  res.status(204).end()
}

module.exports = {
  deleteQuiz
}
