const quizService = require('~/services/quiz')

const getQuizById = async (req, res) => {
  const { id } = req.params

  const quiz = await quizService.getQuizById(id)

  res.status(200).json(quiz)
}

const deleteQuiz = async (req, res) => {
  const { id: currentUserId } = req.user
  const { id } = req.params

  await quizService.deleteQuiz(id, currentUserId)

  res.status(204).end()
}

module.exports = {
  getQuizById,
  deleteQuiz
}
