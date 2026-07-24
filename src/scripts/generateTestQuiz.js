require('../../module-aliases')
require('dotenv').config({ path: '.env.local' })

const mongoose = require('mongoose')
const Question = require('~/models/question')

const authorId = process.argv[2]

if (!authorId) {
  console.error('Usage: node scripts/generateTestQuiz.js <authorUserId>')
  process.exit(1)
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL)

  const quiz = await Question.create({
    title: 'Sample Quiz',
    text: 'Sample question for testing',
    answers: [
      { text: 'Answer A', isCorrect: true },
      { text: 'Answer B', isCorrect: false }
    ],
    type: 'oneAnswer',
    author: authorId,
    resourceType: 'quizzes'
  })

  console.log('Created quiz:', quiz._id.toString())

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
