const testUserAuthentication = require('~/utils/testUserAuth')
const {
  roles: { ADMIN, STUDENT, TUTOR }
} = require('~/consts/auth')

const users = {
  [ADMIN]: {
    role: ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@testcategory.com',
    password: 'Qwerty123@',
    FAQ: { student: [{ question: 'q', answer: 'a' }] },
    isEmailConfirmed: true,
    lastLoginAs: ADMIN
  },
  [STUDENT]: {
    role: STUDENT,
    firstName: 'Student',
    lastName: 'User',
    email: 'student@test.com',
    password: 'Qwerty123@',
    isEmailConfirmed: true
  },
  [TUTOR]: {
    role: TUTOR,
    firstName: 'Tutor',
    lastName: 'User',
    email: 'tutor@test.com',
    password: 'Qwerty123@',
    isEmailConfirmed: true
  }
}

const expectError = (statusCode, error, response) => {
  expect(response.body).toEqual({
    ...error,
    status: statusCode
  })
}

const createAccessToken = async (app, role) => {
  return testUserAuthentication(app, users[role])
}

module.exports = { expectError, createAccessToken }
